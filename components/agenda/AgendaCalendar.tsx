// components/agenda/AgendaCalendar.tsx — calendário da Agenda, com alternância
// Mês/Semana/Dia. Reaproveita a tabela `tasks` (ver migration 021/lib/data.ts)
// — um evento é uma tarefa com data+hora, tipo (cor) e duração. Sem
// arrastar-e-soltar de propósito: o público deste app é majoritariamente
// mobile, e toque-e-segure pra arrastar é pouco confiável no Safari do
// iPhone — reagendar é feito tocando no evento (📅) e escolhendo nova
// data/hora, bem mais robusto no celular.
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Task, EventType } from "@/lib/constants";
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from "@/lib/constants";
import { createAgendaEvent, rescheduleAgendaEvent, toggleTask, deleteTask } from "@/app/(dashboard)/actions";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function timeKey(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

type ViewMode = "mes" | "semana" | "dia";

export function AgendaCalendar({ tasks }: { tasks: Task[] }) {
  const today = new Date();
  const [monthCursor, setMonthCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(dateKey(today));
  const [view, setView] = useState<ViewMode>("mes");
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function shiftSelected(days: number) {
    const d = new Date(`${selected}T00:00:00`);
    d.setDate(d.getDate() + days);
    setSelected(dateKey(d));
    setMonthCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.due_at) continue;
      const key = dateKey(new Date(t.due_at));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    Array.from(map.values()).forEach((list) => {
      list.sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime());
    });
    return map;
  }, [tasks]);

  const cells = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    const result: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < totalCells; i++) {
      const date = new Date(year, month, i - startOffset + 1);
      result.push({ date, inMonth: date.getMonth() === month });
    }
    return result;
  }, [monthCursor]);

  const weekCells = useMemo(() => {
    const base = new Date(`${selected}T00:00:00`);
    const start = new Date(base);
    start.setDate(base.getDate() - base.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [selected]);

  const selectedEvents = eventsByDay.get(selected) ?? [];

  function changeMonth(delta: number) {
    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  function saveReschedule(taskId: string, date: string, time: string) {
    startTransition(async () => {
      await rescheduleAgendaEvent(taskId, date, time);
      setReschedulingId(null);
      router.refresh();
    });
  }

  function toggleDone(taskId: string, done: boolean) {
    startTransition(async () => {
      await toggleTask(taskId, done);
      router.refresh();
    });
  }

  function remove(taskId: string) {
    if (!confirm("Remover este evento?")) return;
    startTransition(async () => {
      await deleteTask(taskId);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="gm-card p-4">
        <div className="mb-3 flex gap-1 rounded-lg bg-gm-50 p-1 text-xs font-semibold">
          {(["mes", "semana", "dia"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 rounded-md py-1.5 transition ${
                view === v ? "bg-gm-500 text-white" : "text-gm-700/60 hover:bg-gm-100"
              }`}
            >
              {v === "mes" ? "Mês" : v === "semana" ? "Semana" : "Dia"}
            </button>
          ))}
        </div>

        {view === "mes" && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <button onClick={() => changeMonth(-1)} className="rounded-lg p-2 text-gm-700 hover:bg-gm-50" aria-label="Mês anterior">
                ←
              </button>
              <h2 className="font-semibold text-gm-900">
                {monthCursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </h2>
              <button onClick={() => changeMonth(1)} className="rounded-lg p-2 text-gm-700 hover:bg-gm-50" aria-label="Próximo mês">
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gm-700/50">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1">{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map(({ date, inMonth }) => {
                const key = dateKey(date);
                const dayEvents = eventsByDay.get(key) ?? [];
                const isToday = key === dateKey(today);
                const isSelected = key === selected;
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(key)}
                    className={`flex min-h-14 flex-col items-center gap-1 rounded-lg p-1 text-xs transition ${
                      isSelected ? "bg-gm-500 text-white" : isToday ? "bg-gm-100 text-gm-900" : "hover:bg-gm-50"
                    } ${!inMonth ? "opacity-30" : ""}`}
                  >
                    <span className="font-medium">{date.getDate()}</span>
                    <span className="flex flex-wrap justify-center gap-0.5">
                      {dayEvents.slice(0, 3).map((t) => (
                        <span key={t.id} className={`h-1.5 w-1.5 rounded-full ${EVENT_TYPE_COLORS[t.event_type].dot}`} />
                      ))}
                      {dayEvents.length > 3 && <span className="text-[9px]">+{dayEvents.length - 3}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {view === "semana" && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <button onClick={() => shiftSelected(-7)} className="rounded-lg p-2 text-gm-700 hover:bg-gm-50" aria-label="Semana anterior">
                ←
              </button>
              <h2 className="font-semibold text-gm-900">
                {weekCells[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – {weekCells[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </h2>
              <button onClick={() => shiftSelected(7)} className="rounded-lg p-2 text-gm-700 hover:bg-gm-50" aria-label="Próxima semana">
                →
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gm-700/50">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1">{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekCells.map((date) => {
                const key = dateKey(date);
                const dayEvents = eventsByDay.get(key) ?? [];
                const isToday = key === dateKey(today);
                const isSelected = key === selected;
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(key)}
                    className={`flex min-h-16 flex-col items-center gap-1 rounded-lg p-1 text-xs transition ${
                      isSelected ? "bg-gm-500 text-white" : isToday ? "bg-gm-100 text-gm-900" : "hover:bg-gm-50"
                    }`}
                  >
                    <span className="font-medium">{date.getDate()}</span>
                    <span className="flex flex-wrap justify-center gap-0.5">
                      {dayEvents.slice(0, 4).map((t) => (
                        <span key={t.id} className={`h-1.5 w-1.5 rounded-full ${EVENT_TYPE_COLORS[t.event_type].dot}`} />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {view === "dia" && (
          <div className="flex items-center justify-between">
            <button onClick={() => shiftSelected(-1)} className="rounded-lg p-2 text-gm-700 hover:bg-gm-50" aria-label="Dia anterior">
              ←
            </button>
            <h2 className="font-semibold text-gm-900">
              {new Date(`${selected}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </h2>
            <button onClick={() => shiftSelected(1)} className="rounded-lg p-2 text-gm-700 hover:bg-gm-50" aria-label="Próximo dia">
              →
            </button>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-gm-900">
          {new Date(`${selected}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </h3>

        {selectedEvents.length === 0 ? (
          <p className="gm-card p-4 text-sm text-gm-700/50">Nenhum evento neste dia.</p>
        ) : (
          <div className="mb-4 space-y-2">
            {selectedEvents.map((t) => {
              const colors = EVENT_TYPE_COLORS[t.event_type];
              const d = new Date(t.due_at!);
              return (
                <div key={t.id} className={`rounded-xl border p-3 ${colors.chip}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${colors.chip}`}>
                        {EVENT_TYPE_LABELS[t.event_type]}
                      </span>
                      <p className={`mt-1 text-sm font-medium ${t.done ? "text-gm-700/40 line-through" : "text-gm-900"}`}>{t.title}</p>
                      <p className="text-xs text-gm-700/50">{timeKey(d)} · {t.duration_minutes}min</p>
                    </div>
                    <div className="flex flex-none gap-1">
                      <button onClick={() => toggleDone(t.id, !t.done)} disabled={pending} className="rounded-lg border border-gm-200 px-2 py-1 text-xs hover:bg-gm-50">
                        {t.done ? "↺" : "✓"}
                      </button>
                      <button onClick={() => setReschedulingId(reschedulingId === t.id ? null : t.id)} className="rounded-lg border border-gm-200 px-2 py-1 text-xs hover:bg-gm-50">
                        📅
                      </button>
                      <button onClick={() => remove(t.id)} disabled={pending} className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                        🗑
                      </button>
                    </div>
                  </div>

                  {reschedulingId === t.id && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        saveReschedule(t.id, String(fd.get("date")), String(fd.get("time")));
                      }}
                      className="mt-2 flex flex-wrap items-center gap-2"
                    >
                      <input type="date" name="date" defaultValue={dateKey(d)} className="rounded-lg border border-gm-200 px-2 py-1 text-xs" />
                      <input type="time" name="time" defaultValue={timeKey(d)} className="rounded-lg border border-gm-200 px-2 py-1 text-xs" />
                      <button type="submit" disabled={pending} className="rounded-lg bg-gm-500 px-3 py-1 text-xs font-semibold text-white hover:bg-gm-600">
                        Salvar
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <form action={createAgendaEvent} className="gm-card space-y-2 p-4">
          <h4 className="text-sm font-semibold text-gm-900">+ Novo evento</h4>
          <input type="hidden" name="date" value={selected} />
          <input name="title" required placeholder="Título *" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <input name="time" type="time" defaultValue="09:00" className="w-1/2 rounded-lg border border-gm-200 px-3 py-2 text-sm" />
            <input name="duration_minutes" type="number" min="15" step="15" defaultValue={60} placeholder="Min." className="w-1/2 rounded-lg border border-gm-200 px-3 py-2 text-sm" />
          </div>
          <select name="event_type" defaultValue="lembrete" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm">
            {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((k) => (
              <option key={k} value={k}>{EVENT_TYPE_LABELS[k]}</option>
            ))}
          </select>
          <button type="submit" className="w-full rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">
            Adicionar em {selected.split("-").reverse().join("/")}
          </button>
        </form>
      </div>
    </div>
  );
}
