import { CheckCircle2 } from "lucide-react";
import type { Trajet } from "../utils/types";
import { libellesTrajet } from "../utils/libelles";

interface PropsChoixTrajet {
  valeur: Trajet;
  onChange: (trajet: Trajet) => void;
}

const options: Trajet[] = ["direct", "une_escale", "indifferent"];

export function ChoixTrajet({ valeur, onChange }: PropsChoixTrajet) {
  return (
    <div role="radiogroup" aria-label="Le trajet qui vous convient" className="grid gap-3 sm:grid-cols-3">
      {options.map((option) => {
        const choisi = option === valeur;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={choisi}
            onClick={() => onChange(option)}
            className={`flex min-h-12 items-center justify-between gap-2 rounded-xl border px-4 py-2 text-left text-sm transition-colors ${
              choisi ? "border-principal bg-menthe font-semibold" : "border-trait bg-white hover:border-principal"
            }`}
          >
            {libellesTrajet[option]}
            {choisi && <CheckCircle2 aria-hidden="true" className="size-[18px] shrink-0 text-principal" />}
          </button>
        );
      })}
    </div>
  );
}
