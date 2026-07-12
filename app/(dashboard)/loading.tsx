// app/(dashboard)/loading.tsx — esqueleto exibido instantaneamente ao navegar
// entre telas da área logada (Next.js mostra isso enquanto a página de
// destino busca dados no servidor). Sem isso, o clique parece "travar" até
// a resposta chegar; com isso, a resposta ao toque é imediata.
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded-lg bg-gm-100" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-gm-100" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-gm-100" />
    </div>
  );
}
