// app/(dashboard)/agenda/page.tsx — Agenda: calendário mensal com visitas,
// reuniões, ligações, lembretes e prazos (reaproveita a tabela `tasks`).
import { requireActiveAccount } from "@/lib/account-guard";
import { getTasks, getGoogleCalendarConnection } from "@/lib/data";
import { isGoogleCalendarConfigured } from "@/lib/google-calendar";
import { connectGoogleCalendar, disconnectGoogleCalendar } from "@/app/(dashboard)/actions";
import { PageHeader } from "@/components/ui";
import { AgendaCalendar } from "@/components/agenda/AgendaCalendar";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { conectado?: string; erro?: string };
}) {
  const user = await requireActiveAccount();
  const [tasks, googleConnection] = await Promise.all([
    getTasks(user.id),
    getGoogleCalendarConnection(user.id),
  ]);
  const configured = isGoogleCalendarConfigured();

  return (
    <div>
      <PageHeader title="Agenda" subtitle="Visitas, reuniões, ligações e prazos num calendário só." />

      <div className="mb-6 gm-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-semibold text-gm-900">📅 Google Calendar</p>
          <p className="text-xs text-gm-700/60">
            {!configured
              ? "Ainda não configurado nesta conta."
              : googleConnection
              ? "Conectado — novos eventos são espelhados no seu Google Calendar."
              : "Não conectado — os eventos ficam só aqui no GOOD MINT."}
          </p>
          {searchParams.conectado && <p className="mt-1 text-xs font-medium text-green-600">✓ Conectado com sucesso!</p>}
          {searchParams.erro && <p className="mt-1 text-xs font-medium text-red-600">Não foi possível conectar. Tente novamente.</p>}
        </div>
        {configured && (
          googleConnection ? (
            <form action={disconnectGoogleCalendar}>
              <button className="rounded-lg border border-gm-200 px-3 py-1.5 text-xs font-semibold text-gm-700 hover:bg-gm-50">
                Desconectar
              </button>
            </form>
          ) : (
            <form action={connectGoogleCalendar}>
              <button className="rounded-lg bg-gm-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gm-600">
                Conectar Google Calendar
              </button>
            </form>
          )
        )}
      </div>

      <AgendaCalendar tasks={tasks} />
    </div>
  );
}
