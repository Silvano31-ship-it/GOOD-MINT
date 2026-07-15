// app/api/chat/[code]/messages/route.ts — GET/POST das mensagens de um grupo.
// Sem checagem de sessão obrigatória: convidados não têm conta, então o
// acesso é escopado só pelo invite_code (mesmo padrão de
// app/acompanhar/actions.ts, escopado só pelo referral_token). Liberado do
// middleware de sessão — ver middleware.ts.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_NAME_LENGTH = 60;

async function findGroup(code: string) {
  const { rows } = await db.query<{ id: string; user_id: string; name: string }>(
    `SELECT id, user_id, name FROM chat_groups WHERE invite_code = $1`,
    [code]
  );
  return rows[0] ?? null;
}

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const group = await findGroup(params.code);
  if (!group) return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 });

  const { rows } = await db.query<{
    id: string;
    sender_name: string;
    is_owner: boolean;
    content: string;
    created_at: string;
  }>(
    `SELECT id, sender_name, is_owner, content, created_at
     FROM chat_messages WHERE group_id = $1 ORDER BY created_at ASC LIMIT 500`,
    [group.id]
  );

  return NextResponse.json({
    groupName: group.name,
    messages: rows.map((r) => ({
      id: r.id,
      senderName: r.sender_name,
      isOwner: r.is_owner,
      content: r.content,
      createdAt: r.created_at,
    })),
  });
}

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const group = await findGroup(params.code);
  if (!group) return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const content = String(body?.content ?? "").trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!content) return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });

  const session = await getSession();
  let senderName: string;
  let isOwner = false;

  if (session && session.userId === group.user_id) {
    const { rows } = await db.query<{ full_name: string }>(
      `SELECT full_name FROM users WHERE id=$1`,
      [session.userId]
    );
    senderName = rows[0]?.full_name ?? "Corretor";
    isOwner = true;
  } else {
    senderName = String(body?.senderName ?? "").trim().slice(0, MAX_NAME_LENGTH);
    if (!senderName) return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
  }

  await db.query(
    `INSERT INTO chat_messages (group_id, sender_name, is_owner, content) VALUES ($1,$2,$3,$4)`,
    [group.id, senderName, isOwner, content]
  );

  return NextResponse.json({ ok: true });
}
