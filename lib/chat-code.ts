// lib/chat-code.ts — código curto de convite do Chat em Grupo. Sem precedente
// de código curto no projeto (o referral_token do pós-venda é um UUID longo,
// que ninguém digita à mão) — aqui o corretor pode ditar o código por
// telefone, então usamos um alfabeto sem caracteres ambíguos (sem 0/O/1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 8): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}
