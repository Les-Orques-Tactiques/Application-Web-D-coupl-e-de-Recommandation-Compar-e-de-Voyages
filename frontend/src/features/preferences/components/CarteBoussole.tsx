import { Compass } from "lucide-react";
import type { ChoixPreferences } from "../utils/types";
import { libellesTrajet } from "../utils/libelles";

interface PropsCarteBoussole {
  preferences: ChoixPreferences;
}

export function CarteBoussole({ preferences }: PropsCarteBoussole) {
  const { aeroport, budget, trajet } = preferences;

  const lignes = [
    { titre: "Départ", valeur: aeroport || "Non renseigné" },
    { titre: "Budget A/R", valeur: budget === null ? "Sans limite" : `Jusqu'à ${budget} €` },
    { titre: "Trajet", valeur: libellesTrajet[trajet] },
  ];

  return (
    <div className="rounded-3xl bg-profond p-8 text-white">
      <Compass aria-hidden="true" className="size-8 text-citron" />
      <h2 className="mt-6 text-[26px] font-medium tracking-tight">Votre boussole de départ.</h2>
      <dl className="mt-5 space-y-4">
        {lignes.map((ligne) => (
          <div key={ligne.titre}>
            <dt className="text-[11px] uppercase tracking-[0.12em] text-white/60">{ligne.titre}</dt>
            <dd className="mt-1 text-base">{ligne.valeur}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
