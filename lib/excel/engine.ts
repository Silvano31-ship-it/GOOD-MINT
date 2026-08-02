// lib/excel/engine.ts — motor de fórmulas do EXCEL GOOD ✅ (100% próprio, sem
// dependências). Pipeline: tokenizer → parser (descida recursiva) → avaliador,
// com registry de funções em PT-BR. Também cuida da resolução de referências
// (relativa/absoluta/mista) e do ajuste de fórmulas ao copiar/arrastar.
//
// A grade guarda só o conteúdo CRU de cada célula (ex.: "=SOMA(A1:A3)", "10",
// "texto"). O valor exibido é sempre derivado aqui — nunca persistido.

export type CellMap = Record<string, string>; // "A1" -> conteúdo cru
export type ComputedMap = Record<string, { display: string; error: boolean }>;

// ---------------------------------------------------------------- Referências
export function colToNum(col: string): number {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1; // 0-based
}
export function numToCol(n: number): string {
  let s = "";
  n += 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
export function cellName(col: number, row: number): string {
  return `${numToCol(col)}${row + 1}`;
}

interface Ref {
  col: number;
  row: number;
  colAbs: boolean;
  rowAbs: boolean;
}
const REF_RE = /^(\$?)([A-Z]+)(\$?)(\d+)$/;
function parseRef(s: string): Ref | null {
  const m = REF_RE.exec(s.toUpperCase());
  if (!m) return null;
  return { colAbs: m[1] === "$", col: colToNum(m[2]), rowAbs: m[3] === "$", row: parseInt(m[4], 10) - 1 };
}

// ---------------------------------------------------------------- Tokenizer
type Tok =
  | { t: "num"; v: number }
  | { t: "str"; v: string }
  | { t: "ref"; v: string }
  | { t: "range"; a: string; b: string }
  | { t: "func"; v: string }
  | { t: "op"; v: string }
  | { t: "sep" }
  | { t: "lp" }
  | { t: "rp" };

const NAME_RE = /[A-Za-zÀ-Úà-ú0-9_.$]/;

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === " " || c === "\t" || c === "\n") { i++; continue; }
    if (c === '"') {
      let s = ""; i++;
      while (i < src.length && src[i] !== '"') { s += src[i]; i++; }
      i++; // fecha aspas
      toks.push({ t: "str", v: s });
      continue;
    }
    if (c >= "0" && c <= "9") {
      let s = "";
      while (i < src.length && ((src[i] >= "0" && src[i] <= "9") || src[i] === "." || src[i] === ",")) {
        if ((src[i] === "." || src[i] === ",")) {
          const next = src[i + 1];
          if (!(next >= "0" && next <= "9")) break;
          s += ".";
        } else s += src[i];
        i++;
      }
      toks.push({ t: "num", v: parseFloat(s) });
      continue;
    }
    if (c === "(") { toks.push({ t: "lp" }); i++; continue; }
    if (c === ")") { toks.push({ t: "rp" }); i++; continue; }
    if (c === ";") { toks.push({ t: "sep" }); i++; continue; }
    if ("+-*/^&<>=".includes(c)) {
      let op = c; i++;
      if ((c === "<" && (src[i] === "=" || src[i] === ">")) || (c === ">" && src[i] === "=")) {
        op += src[i]; i++;
      }
      toks.push({ t: "op", v: op });
      continue;
    }
    if (NAME_RE.test(c)) {
      let s = "";
      while (i < src.length && NAME_RE.test(src[i]) && src[i] !== "(") { s += src[i]; i++; }
      if (src[i] === ":") {
        i++;
        let b = "";
        while (i < src.length && NAME_RE.test(src[i])) { b += src[i]; i++; }
        toks.push({ t: "range", a: s, b });
        continue;
      }
      if (src[i] === "(") {
        toks.push({ t: "func", v: s.toUpperCase() });
        continue;
      }
      if (parseRef(s)) toks.push({ t: "ref", v: s });
      else toks.push({ t: "str", v: s });
      continue;
    }
    i++;
  }
  return toks;
}

// ---------------------------------------------------------------- Parser (AST)
type Node =
  | { k: "num"; v: number }
  | { k: "str"; v: string }
  | { k: "ref"; v: string }
  | { k: "range"; a: string; b: string }
  | { k: "bin"; op: string; l: Node; r: Node }
  | { k: "neg"; e: Node }
  | { k: "call"; name: string; args: Node[] };

class Parser {
  toks: Tok[];
  p = 0;
  constructor(toks: Tok[]) { this.toks = toks; }
  peek() { return this.toks[this.p]; }
  next() { return this.toks[this.p++]; }

  parse(): Node {
    const n = this.parseExpr();
    return n;
  }
  parseExpr(): Node {
    let l = this.parseConcat();
    while (this.peek()?.t === "op" && ["=", "<", ">", "<=", ">=", "<>"].includes((this.peek() as any).v)) {
      const op = (this.next() as any).v;
      const r = this.parseConcat();
      l = { k: "bin", op, l, r };
    }
    return l;
  }
  parseConcat(): Node {
    let l = this.parseAdd();
    while (this.peek()?.t === "op" && (this.peek() as any).v === "&") {
      this.next();
      const r = this.parseAdd();
      l = { k: "bin", op: "&", l, r };
    }
    return l;
  }
  parseAdd(): Node {
    let l = this.parseMul();
    while (this.peek()?.t === "op" && ["+", "-"].includes((this.peek() as any).v)) {
      const op = (this.next() as any).v;
      const r = this.parseMul();
      l = { k: "bin", op, l, r };
    }
    return l;
  }
  parseMul(): Node {
    let l = this.parsePow();
    while (this.peek()?.t === "op" && ["*", "/"].includes((this.peek() as any).v)) {
      const op = (this.next() as any).v;
      const r = this.parsePow();
      l = { k: "bin", op, l, r };
    }
    return l;
  }
  parsePow(): Node {
    let l = this.parseUnary();
    while (this.peek()?.t === "op" && (this.peek() as any).v === "^") {
      this.next();
      const r = this.parseUnary();
      l = { k: "bin", op: "^", l, r };
    }
    return l;
  }
  parseUnary(): Node {
    if (this.peek()?.t === "op" && (this.peek() as any).v === "-") {
      this.next();
      return { k: "neg", e: this.parseUnary() };
    }
    if (this.peek()?.t === "op" && (this.peek() as any).v === "+") {
      this.next();
      return this.parseUnary();
    }
    return this.parsePrimary();
  }
  parsePrimary(): Node {
    const tk = this.next();
    if (!tk) throw new Error("#SINTAXE");
    if (tk.t === "num") return { k: "num", v: tk.v };
    if (tk.t === "str") return { k: "str", v: tk.v };
    if (tk.t === "ref") return { k: "ref", v: tk.v };
    if (tk.t === "range") return { k: "range", a: tk.a, b: tk.b };
    if (tk.t === "lp") {
      const e = this.parseExpr();
      if (this.peek()?.t === "rp") this.next();
      return e;
    }
    if (tk.t === "func") {
      if (this.peek()?.t === "lp") this.next();
      const args: Node[] = [];
      if (this.peek()?.t !== "rp") {
        args.push(this.parseExpr());
        while (this.peek()?.t === "sep") { this.next(); args.push(this.parseExpr()); }
      }
      if (this.peek()?.t === "rp") this.next();
      return { k: "call", name: tk.v, args };
    }
    throw new Error("#SINTAXE");
  }
}

// ---------------------------------------------------------------- Avaliador
class CalcError extends Error {}

type Val = number | string | boolean;

function expandRange(a: string, b: string): string[] {
  const ra = parseRef(a), rb = parseRef(b);
  if (!ra || !rb) throw new CalcError("#REF!");
  const c1 = Math.min(ra.col, rb.col), c2 = Math.max(ra.col, rb.col);
  const r1 = Math.min(ra.row, rb.row), r2 = Math.max(ra.row, rb.row);
  const out: string[] = [];
  for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) out.push(cellName(c, r));
  return out;
}

function toNum(v: Val): number {
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (v === "" || v == null) return 0;
  const n = parseFloat(String(v).replace(",", "."));
  if (isNaN(n)) throw new CalcError("#VALOR!");
  return n;
}
function toStr(v: Val): string {
  if (typeof v === "boolean") return v ? "VERDADEIRO" : "FALSO";
  return String(v);
}
function toBool(v: Val): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = String(v).toUpperCase();
  if (s === "VERDADEIRO") return true;
  if (s === "FALSO") return false;
  return toNum(v) !== 0;
}

interface Ctx {
  raw: CellMap;
  cache: Record<string, Val>;
  visiting: Set<string>;
}

function getCellValue(ref: string, ctx: Ctx): Val {
  const key = ref.toUpperCase();
  if (ctx.cache[key] !== undefined) return ctx.cache[key];
  if (ctx.visiting.has(key)) throw new CalcError("#CIRC!");
  const rawKey = normalizeKey(key);
  const raw = ctx.raw[rawKey];
  if (raw === undefined || raw === "") { ctx.cache[key] = 0; return 0; }
  ctx.visiting.add(key);
  let val: Val;
  try {
    val = evalRaw(raw, ctx);
  } finally {
    ctx.visiting.delete(key);
  }
  ctx.cache[key] = val;
  return val;
}
function normalizeKey(ref: string): string {
  const r = parseRef(ref);
  return r ? cellName(r.col, r.row) : ref.toUpperCase();
}

function evalNode(n: Node, ctx: Ctx): Val {
  switch (n.k) {
    case "num": return n.v;
    case "str": return n.v;
    case "ref": return getCellValue(n.v, ctx);
    case "range": throw new CalcError("#VALOR!");
    case "neg": return -toNum(evalNode(n.e, ctx));
    case "bin": return evalBin(n.op, n.l, n.r, ctx);
    case "call": return evalCall(n.name, n.args, ctx);
  }
}
function evalBin(op: string, ln: Node, rn: Node, ctx: Ctx): Val {
  if (op === "&") return toStr(evalNode(ln, ctx)) + toStr(evalNode(rn, ctx));
  if (["=", "<", ">", "<=", ">=", "<>"].includes(op)) {
    const l = evalNode(ln, ctx), r = evalNode(rn, ctx);
    let cmp: number;
    if (typeof l === "number" && typeof r === "number") cmp = l - r;
    else cmp = String(toStr(l)).localeCompare(String(toStr(r)));
    switch (op) {
      case "=": return cmp === 0;
      case "<>": return cmp !== 0;
      case "<": return cmp < 0;
      case ">": return cmp > 0;
      case "<=": return cmp <= 0;
      case ">=": return cmp >= 0;
    }
  }
  const a = toNum(evalNode(ln, ctx)), b = toNum(evalNode(rn, ctx));
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": if (b === 0) throw new CalcError("#DIV/0!"); return a / b;
    case "^": return Math.pow(a, b);
  }
  throw new CalcError("#SINTAXE");
}

function collectNums(args: Node[], ctx: Ctx): number[] {
  const out: number[] = [];
  for (const a of args) {
    if (a.k === "range") {
      for (const ref of expandRange(a.a, a.b)) {
        const v = getCellValue(ref, ctx);
        if (v === "" || v == null) continue;
        if (typeof v === "number") out.push(v);
        else if (typeof v === "boolean") out.push(v ? 1 : 0);
        else { const n = parseFloat(String(v).replace(",", ".")); if (!isNaN(n)) out.push(n); }
      }
    } else {
      out.push(toNum(evalNode(a, ctx)));
    }
  }
  return out;
}
function collectAll(args: Node[], ctx: Ctx): Val[] {
  const out: Val[] = [];
  for (const a of args) {
    if (a.k === "range") for (const ref of expandRange(a.a, a.b)) out.push(getCellValue(ref, ctx));
    else out.push(evalNode(a, ctx));
  }
  return out;
}

function evalCall(name: string, args: Node[], ctx: Ctx): Val {
  switch (name) {
    case "SOMA": return collectNums(args, ctx).reduce((s, x) => s + x, 0);
    case "MÉDIA": case "MEDIA": {
      const ns = collectNums(args, ctx);
      if (ns.length === 0) throw new CalcError("#DIV/0!");
      return ns.reduce((s, x) => s + x, 0) / ns.length;
    }
    case "MÍNIMO": case "MINIMO": { const ns = collectNums(args, ctx); return ns.length ? Math.min(...ns) : 0; }
    case "MÁXIMO": case "MAXIMO": { const ns = collectNums(args, ctx); return ns.length ? Math.max(...ns) : 0; }
    case "CONT.NÚM": case "CONT.NUM": return collectNums(args, ctx).length;
    case "ARRED": {
      const v = toNum(evalNode(args[0], ctx));
      const d = args[1] ? toNum(evalNode(args[1], ctx)) : 0;
      const f = Math.pow(10, d);
      return Math.round(v * f) / f;
    }
    case "SE": {
      const cond = toBool(evalNode(args[0], ctx));
      return cond ? evalNode(args[1], ctx) : (args[2] !== undefined ? evalNode(args[2], ctx) : false);
    }
    case "E": return collectAll(args, ctx).every((v) => toBool(v));
    case "OU": return collectAll(args, ctx).some((v) => toBool(v));
    case "SEERRO": {
      try { return evalNode(args[0], ctx); }
      catch (e) { if (e instanceof CalcError) return args[1] !== undefined ? evalNode(args[1], ctx) : ""; throw e; }
    }
    case "CONCAT": case "CONCATENAR": return collectAll(args, ctx).map(toStr).join("");
    case "ESQUERDA": { const s = toStr(evalNode(args[0], ctx)); const n = args[1] ? toNum(evalNode(args[1], ctx)) : 1; return s.slice(0, n); }
    case "DIREITA": { const s = toStr(evalNode(args[0], ctx)); const n = args[1] ? toNum(evalNode(args[1], ctx)) : 1; return n <= 0 ? "" : s.slice(-n); }
    case "EXT.TEXTO": { const s = toStr(evalNode(args[0], ctx)); const ini = toNum(evalNode(args[1], ctx)); const num = toNum(evalNode(args[2], ctx)); return s.substr(Math.max(0, ini - 1), num); }
    case "NÚM.CARACT": case "NUM.CARACT": return toStr(evalNode(args[0], ctx)).length;
    case "PROCV": {
      const alvo = evalNode(args[0], ctx);
      if (args[1].k !== "range") throw new CalcError("#REF!");
      const colIdx = toNum(evalNode(args[2], ctx));
      const ra = parseRef(args[1].a)!, rb = parseRef(args[1].b)!;
      const c1 = Math.min(ra.col, rb.col), c2 = Math.max(ra.col, rb.col);
      const r1 = Math.min(ra.row, rb.row), r2 = Math.max(ra.row, rb.row);
      for (let r = r1; r <= r2; r++) {
        const first = getCellValue(cellName(c1, r), ctx);
        if (String(toStr(first)) === String(toStr(alvo))) {
          const col = c1 + (colIdx - 1);
          if (col < c1 || col > c2) throw new CalcError("#REF!");
          return getCellValue(cellName(col, r), ctx);
        }
      }
      throw new CalcError("#N/D");
    }
    case "HOJE": { const d = new Date(); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`; }
    case "AGORA": { const d = new Date(); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; }
    case "DIA": return dateFrom(evalNode(args[0], ctx)).getDate();
    case "MÊS": case "MES": return dateFrom(evalNode(args[0], ctx)).getMonth() + 1;
    case "ANO": return dateFrom(evalNode(args[0], ctx)).getFullYear();
    default: throw new CalcError("#NOME?");
  }
}

function dateFrom(v: Val): Date {
  const s = toStr(v).trim();
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (m) return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
  const d = new Date(s);
  if (isNaN(d.getTime())) throw new CalcError("#VALOR!");
  return d;
}

function evalRaw(raw: string, ctx: Ctx): Val {
  if (raw.startsWith("=")) {
    const toks = tokenize(raw.slice(1));
    const ast = new Parser(toks).parse();
    return evalNode(ast, ctx);
  }
  const n = parseFloat(raw.replace(",", "."));
  if (raw.trim() !== "" && !isNaN(n) && /^-?[\d.,]+$/.test(raw.trim())) return n;
  return raw;
}

export function computeAll(raw: CellMap): ComputedMap {
  const out: ComputedMap = {};
  const cache: Record<string, Val> = {};
  for (const key of Object.keys(raw)) {
    const norm = normalizeKey(key);
    if (raw[key] === "" || raw[key] == null) continue;
    try {
      const ctx: Ctx = { raw, cache, visiting: new Set() };
      const v = getCellValue(norm, ctx);
      out[norm] = { display: displayVal(v), error: false };
    } catch (e) {
      out[norm] = { display: e instanceof CalcError ? e.message : "#ERRO", error: true };
    }
  }
  return out;
}

function displayVal(v: Val): string {
  if (typeof v === "boolean") return v ? "VERDADEIRO" : "FALSO";
  if (typeof v === "number") {
    if (!isFinite(v)) return "#NÚM!";
    const r = Math.round(v * 1e10) / 1e10;
    return String(r);
  }
  return v;
}

// ---------------------------------------------------------------- Ajuste de refs
export function adjustFormula(raw: string, dCol: number, dRow: number): string {
  if (!raw.startsWith("=")) return raw;
  const body = raw.slice(1);
  let out = "=";
  let i = 0;
  while (i < body.length) {
    const c = body[i];
    if (c === '"') {
      out += c; i++;
      while (i < body.length && body[i] !== '"') { out += body[i]; i++; }
      if (i < body.length) { out += body[i]; i++; }
      continue;
    }
    const m = /^(\$?[A-Za-z]+\$?\d+)/.exec(body.slice(i));
    if (m && !isPartOfName(body, i)) {
      out += shiftRef(m[1], dCol, dRow);
      i += m[1].length;
      continue;
    }
    out += c; i++;
  }
  return out;
}
function isPartOfName(body: string, i: number): boolean {
  const prev = body[i - 1];
  return prev !== undefined && /[A-Za-zÀ-Úà-ú0-9_.]/.test(prev);
}
function shiftRef(ref: string, dCol: number, dRow: number): string {
  const r = parseRef(ref);
  if (!r) return ref;
  const col = r.colAbs ? r.col : r.col + dCol;
  const row = r.rowAbs ? r.row : r.row + dRow;
  if (col < 0 || row < 0) return "#REF!";
  return `${r.colAbs ? "$" : ""}${numToCol(col)}${r.rowAbs ? "$" : ""}${row + 1}`;
}

export function cycleRefMode(ref: string): string {
  const r = parseRef(ref);
  if (!r) return ref;
  const col = numToCol(r.col);
  const row = r.row + 1;
  const state = (r.colAbs ? 2 : 0) + (r.rowAbs ? 1 : 0);
  const next = state === 0 ? 3 : state === 3 ? 1 : state === 1 ? 2 : 0;
  const cAbs = next === 3 || next === 2;
  const rAbs = next === 3 || next === 1;
  return `${cAbs ? "$" : ""}${col}${rAbs ? "$" : ""}${row}`;
}
