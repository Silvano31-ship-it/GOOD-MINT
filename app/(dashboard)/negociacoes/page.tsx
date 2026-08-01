        action={
          <div className="flex items-center gap-2">
            <Link
              href="/negociacoes/simulador"
              className="rounded-lg border border-gm-200 px-4 py-2 text-sm font-semibold text-gm-700 hover:bg-gm-50"
            >
              📈 Simulador
            </Link>
            <NewNegotiationButton leads={leads} properties={properties} />
          </div>
        }
      />
