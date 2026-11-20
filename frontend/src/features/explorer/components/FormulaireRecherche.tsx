import type { ReactNode, SubmitEvent } from "react";
import { Calendar, Search, User, Wallet, type LucideIcon } from "lucide-react";
import { Bouton } from "@/components/ui/Bouton";
import { ChampAeroport } from "@/features/referentiel";
import type { CriteresRecherche } from "../hooks/useExplorer";

type Props = {
  criteres: CriteresRecherche;
  onChange: (criteres: CriteresRecherche) => void;
  onRechercher: () => void;
  enCours: boolean;
};

// Classes communes à tous les <input> / <select> du formulaire
const classeSaisie = "w-full min-w-0 bg-transparent py-2.5 text-[13px] text-encre outline-none disabled:opacity-40";

/**
 * Formulaire « contrôlé » : il n'a pas d'état à lui. Il affiche les critères
 * reçus et prévient la page à chaque modification (onChange).
 */
export function FormulaireRecherche({ criteres, onChange, onRechercher, enCours }: Props) {
  // Modifie UN critère en gardant tous les autres.
  // <K extends keyof …> : TypeScript vérifie que la valeur a le bon type pour cette clé.
  function modifier<K extends keyof CriteresRecherche>(cle: K, valeur: CriteresRecherche[K]) {
    onChange({ ...criteres, [cle]: valeur });
  }

  function soumettre(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault(); // empêche le rechargement de la page
    onRechercher();
  }

  return (
    <form onSubmit={soumettre} className="mt-7 rounded-2xl border border-trait bg-white p-6">
      {/* Type de voyage */}
      <div role="group" aria-label="Type de voyage" className="flex gap-2">
        <BoutonTypeVoyage actif={criteres.aller_retour} onClick={() => modifier("aller_retour", true)}>
          Aller-retour
        </BoutonTypeVoyage>
        <BoutonTypeVoyage actif={!criteres.aller_retour} onClick={() => modifier("aller_retour", false)}>
          Aller simple
        </BoutonTypeVoyage>
      </div>

      {/* Départ et destination */}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <ChampAeroport
          libelle="Au départ de"
          code={criteres.origine}
          onChoisir={a => modifier("origine", a.code_iata)}
          onEffacer={() => modifier("origine", "")}
        />
        <ChampAeroport
          libelle="Envie d’aller à"
          code={criteres.destination}
          onChoisir={a => modifier("destination", a.code_iata)}
          onEffacer={() => modifier("destination", "")}
        />
      </div>

      {/* Dates, passagers, budget : 2 colonnes sur mobile, 4 sur grand écran */}
      <div className="mt-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <ChampRecherche libelle="Date de départ" icone={Calendar}>
          <input
            type="date"
            required
            className={classeSaisie}
            value={criteres.date_depart}
            onChange={e => modifier("date_depart", e.target.value)}
          />
        </ChampRecherche>
        <ChampRecherche libelle="Date de retour" icone={Calendar}>
          <input
            type="date"
            required={criteres.aller_retour}
            disabled={!criteres.aller_retour}
            min={criteres.date_depart}
            className={classeSaisie}
            value={criteres.date_retour ?? ""}
            onChange={e => modifier("date_retour", e.target.value)}
          />
        </ChampRecherche>
        <ChampRecherche libelle="Passagers" icone={User}>
          <select
            className={classeSaisie}
            value={criteres.nb_passagers}
            onChange={e => modifier("nb_passagers", Number(e.target.value))}
          >
            <option value={1}>1 adulte</option>
            <option value={2}>2 adultes</option>
            <option value={3}>3 adultes</option>
          </select>
        </ChampRecherche>
        <ChampRecherche libelle={`Budget max. par personne${criteres.aller_retour ? " (A/R)" : ""} · USD`}>
          <input
            type="number"
            min={1}
            required
            aria-label="Budget maximum par personne"
            className={classeSaisie}
            value={criteres.budget_max}
            onChange={e => modifier("budget_max", Number(e.target.value))}
          />
        </ChampRecherche>
      </div>

      {/* Préférences + bouton de recherche */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-5 text-[13px] text-encre">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="accent-principal"
              checked={criteres.direct_seulement}
              onChange={e => modifier("direct_seulement", e.target.checked)}
            />
            Vols directs uniquement
          </label>
        </div>
        <Bouton type="submit" disabled={enCours || !criteres.origine || !criteres.destination}>
          {enCours ? "Recherche…" : "Trouver mes vols"}
          <Search aria-hidden="true" className="size-4" />
        </Bouton>
      </div>
    </form>
  );
}

/** Libellé + cadre arrondi avec une icône optionnelle à gauche */
function ChampRecherche({ libelle, icone: Icone, children }: { libelle: string; icone?: LucideIcon; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[11px] font-semibold text-encre">{libelle}</span>
      {/* focus-within : la bordure change de couleur quand le champ intérieur a le focus */}
      <div className="flex min-h-11 items-center gap-2 rounded-lg border border-trait bg-white px-3 focus-within:border-principal">
        {Icone && <Icone aria-hidden="true" className="size-4 shrink-0 text-principal" />}
        {children}
      </div>
    </label>
  );
}

function BoutonTypeVoyage({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${actif ? "bg-profond text-white" : "bg-menthe text-encre"}`}
    >
      {children}
    </button>
  );
}