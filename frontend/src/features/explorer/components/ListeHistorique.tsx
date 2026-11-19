import { ArrowRight } from "lucide-react";
import type { RechercheHistorique } from "../services/explorationApi";
import { formaterDate } from "../utils/formatage";
import { Encart } from "./Encart";

type Props = {
  historique: RechercheHistorique[];
  chargement: boolean;
  onReprendre: (recherche: RechercheHistorique) => void;
};

export function ListeHistorique({ historique, chargement, onReprendre }: Props) {
  if (chargement) return <Encart>Chargement de votre historique…</Encart>;
  if (historique.length === 0) return <Encart>Aucune recherche enregistrée pour le moment.</Encart>;

  return (
    <ul className="space-y-3">
      {historique.map(recherche => (
        <li
          key={recherche.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-trait bg-white p-5 text-[13px] text-encre"
        >
          <span>
            {recherche.origine ?? "Départ"} → {recherche.ville_destination ?? recherche.destination ?? "Destination"}
            {recherche.date_depart && ` · ${formaterDate(recherche.date_depart)}`}
            {recherche.aller_retour && recherche.date_retour && ` au ${formaterDate(recherche.date_retour)}`}
            {` · ${recherche.nb_passagers} passager(s)`}
            {!recherche.relancable && (
              <small className="ml-2 text-[11px] text-attenue">(aéroport supprimé)</small>
            )}
          </span>
          <button
            type="button"
            disabled={!recherche.relancable}
            onClick={() => onReprendre(recherche)}
            className="inline-flex items-center gap-2 rounded-lg border border-trait px-4 py-2 font-medium text-principal hover:border-principal disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reprendre
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}