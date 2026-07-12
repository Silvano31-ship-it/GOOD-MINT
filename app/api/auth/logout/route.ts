// app/api/auth/logout/route.ts
// POST /api/auth/logout — destrói a sessão (item "Sair" do menu lateral).

import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

export async function POST() {
  await destroySession();
  return NextResponse.json({ ok: true, redirect: "/login" });
}
