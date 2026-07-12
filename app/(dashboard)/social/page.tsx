// app/(dashboard)/social/page.tsx — redireciona para a aba padrão (Atividade).
import { redirect } from "next/navigation";

export default function SocialIndexPage() {
  redirect("/social/atividade");
}
