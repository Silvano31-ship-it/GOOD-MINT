// app/(dashboard)/tarefas/page.tsx — Tarefas (item do menu, seção 4).
import { requireActiveAccount } from "@/lib/account-guard";
import { getTasks } from "@/lib/data";
import { createTask, toggleTask } from "@/app/(dashboard)/actions";
import { PageHeader, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";

export default async function TarefasPage() {
  const user = await requireActiveAccount();
  const tasks = await getTasks(user.id);
  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <div>
      <PageHeader title="Tarefas" subtitle="Seus lembretes e pendências do dia a dia." />

      <form action={createTask} className="gm-card mb-6 flex flex-wrap gap-3 p-4">
        <input name="title" required placeholder="Nova tarefa..." className="min-w-[200px] flex-1 rounded-lg border border-gm-200 px-3 py-2 text-sm" />
        <input name="due_at" type="date" className="rounded-lg border border-gm-200 px-3 py-2 text-sm" />
        <button className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">Adicionar</button>
      </form>

      {tasks.length === 0 ? (
        <EmptyState icon="✅" title="Nenhuma tarefa" desc="Adicione lembretes para não perder nenhum follow-up." />
      ) : (
        <div className="space-y-6">
          <TaskList title="Pendentes" tasks={pending} />
          {done.length > 0 && <TaskList title="Concluídas" tasks={done} />}
        </div>
      )}
    </div>
  );
}

function TaskList({ title, tasks }: { title: string; tasks: Awaited<ReturnType<typeof getTasks>> }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gm-700/50">{title}</h2>
      <div className="gm-card divide-y divide-gm-50">
        {tasks.map((t) => (
          <form key={t.id} action={toggleTask.bind(null, t.id, !t.done)} className="flex items-center gap-3 px-4 py-3">
            <button className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border ${t.done ? "border-gm-500 bg-gm-500 text-white" : "border-gm-300"}`}>
              {t.done ? "✓" : ""}
            </button>
            <span className={`flex-1 text-sm ${t.done ? "text-gm-700/40 line-through" : "text-gm-900"}`}>{t.title}</span>
            {t.due_at && <span className="text-xs text-gm-700/50">{formatDate(t.due_at)}</span>}
          </form>
        ))}
      </div>
    </div>
  );
}
