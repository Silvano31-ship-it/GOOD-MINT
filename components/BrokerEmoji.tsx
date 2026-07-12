// components/BrokerEmoji.tsx — emoji grande e animado do corretor, usado no
// topo do Login/Cadastro e (clicável) no Dashboard. Respeita
// prefers-reduced-motion (ver .gm-broker-emoji em app/globals.css).
export function BrokerEmoji({ emoji = "🧑‍💼" }: { emoji?: string }) {
  return (
    <span className="gm-broker-emoji" aria-hidden>
      {emoji}
    </span>
  );
}
