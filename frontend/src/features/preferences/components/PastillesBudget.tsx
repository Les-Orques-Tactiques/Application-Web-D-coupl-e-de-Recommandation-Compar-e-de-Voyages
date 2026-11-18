interface PropsPastillesBudget {
  valeur: number | null;
  onChange: (budget: number | null) => void;
}

// null correspond à la pastille « Sans limite »
const montants: (number | null)[] = [150, 220, 350, null];

export function PastillesBudget({ valeur, onChange }: PropsPastillesBudget) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {montants.map((montant) => {
        const choisi = montant === valeur;
        return (
          <button
            key={montant ?? "sans-limite"}
            type="button"
            aria-pressed={choisi}
            onClick={() => onChange(montant)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              choisi ? "bg-profond text-white" : "bg-menthe text-encre hover:bg-trait"
            }`}
          >
            {montant === null ? "Sans limite" : `${montant} €`}
          </button>
        );
      })}
    </div>
  );
}
