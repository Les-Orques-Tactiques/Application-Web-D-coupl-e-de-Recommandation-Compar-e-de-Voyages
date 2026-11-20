import { ArrowRight, Heart, Plane, Sparkles } from "lucide-react";
import type { Vol } from "../services/explorationApi";
import { formaterDate, formaterDuree, formaterHeure, formaterPrix } from "../utils/formatage";

type Props = {
  vol: Vol;
  favori: boolean;
  enCours: boolean;
  onBasculerFavori: (vol: Vol) => void;
  /** Facultatif : si fourni, la carte affiche un bouton « Voir le vol ». */
  onVoir?: (vol: Vol) => void;
};

function libelleEscales(escales: number | null): string {
  if (escales == null) return "";
  return escales === 0 ? "Direct" : `${escales} escale(s)`;
}

/** « MRS · Marignane » : on garde seulement la ville, sans le département. */
function legende(code: string, ville: string | null, repli: string): string {
  return `${code} · ${ville ? ville.split(",")[0].trim() : repli}`;
}

export function CarteVol({ vol, favori, enCours, onBasculerFavori, onVoir }: Props) {
  const dates = formaterDate(vol.date_depart) + (vol.date_retour ? ` – ${formaterDate(vol.date_retour)}` : "");

  return (
    // flex-col + mt-auto sur le bas : les prix restent alignés même si les cartes n'ont pas la même hauteur
    <article className="flex flex-col rounded-2xl border border-trait bg-white p-5">
      {/* Compagnie + favori */}
      <div className="flex items-center gap-2.5 text-[12px] text-encre">
        <span className="grid size-7 place-items-center rounded-md bg-menthe text-[10px] font-semibold text-principal">
          {vol.compagnie_aller.slice(0, 2).toUpperCase()}
        </span>
        <span>{vol.compagnie_aller}</span>
        <button
          type="button"
          disabled={enCours}
          aria-pressed={favori}
          aria-label={favori ? `Retirer ${vol.compagnie_aller} des favoris` : `Ajouter ${vol.compagnie_aller} aux favoris`}
          onClick={() => onBasculerFavori(vol)}
          className={`ml-auto disabled:opacity-50 ${favori ? "text-principal" : "text-attenue hover:text-principal"}`}
        >
          <Heart aria-hidden="true" className="size-[18px]" fill={favori ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Horaires et trajet : aller */}
      <div className="mt-5">
        <LigneTrajet
          depart={formaterHeure(vol.depart_aller_local)}
          arrivee={formaterHeure(vol.arrivee_aller_locale)}
          legendeDepart={legende(vol.origine, vol.ville_origine, "Départ")}
          legendeArrivee={legende(vol.destination, vol.ville_destination, "Arrivée")}
          duree={formaterDuree(vol.duree_aller_min)}
          escales={libelleEscales(vol.escales_aller)}
        />
      </div>

      {/* Horaires et trajet : retour (aller-retour uniquement) */}
      {vol.aller_retour && (
        <div className="mt-3 border-t border-trait pt-3">
          <LigneTrajet
            depart={formaterHeure(vol.depart_retour_local)}
            arrivee={formaterHeure(vol.arrivee_retour_locale)}
            legendeDepart={legende(vol.destination, vol.ville_destination, "Départ")}
            legendeArrivee={legende(vol.origine, vol.ville_origine, "Arrivée")}
            duree={vol.duree_retour_min != null ? formaterDuree(vol.duree_retour_min) : "--"}
            escales={libelleEscales(vol.escales_retour)}
            retour
          />
        </div>
      )}

      <div className="mt-4 text-[11px] text-attenue">
        <span>{dates}</span>
      </div>

      <p className="mt-3 flex items-start gap-2 rounded-md bg-menthe px-3 py-2.5 text-[12px] text-encre">
        <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-principal" />
        {vol.explication ??
          (vol.simulee ? "Itinéraire simulé présent dans le catalogue." : "Vol présent dans le catalogue de la base.")}
      </p>

      {/* Bas de carte : prix à gauche, bouton « Voir le vol » à droite. */}
      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
        <p className="text-2xl text-encre">
          {formaterPrix(vol.prix, vol.devise)}
          <small className="ml-2 text-[10px] text-attenue">{vol.aller_retour ? "A/R" : "Aller simple"}</small>
        </p>

        {onVoir && (
          <button
            type="button"
            onClick={() => onVoir(vol)}
            aria-label={`Voir le détail du vol ${vol.compagnie_aller} ${vol.origine} → ${vol.destination}`}
            className="inline-flex items-center gap-1 rounded-lg bg-principal px-4 py-2 text-[13px] font-medium text-white hover:bg-principal-fonce"
          >
            Voir le vol <ArrowRight aria-hidden="true" className="size-3.5" />
          </button>
        )}
      </div>
    </article>
  );
}

type LigneProps = {
  depart: string | null;
  arrivee: string | null;
  legendeDepart: string;
  legendeArrivee: string;
  duree: string;
  escales: string;
  retour?: boolean;
};

function LigneTrajet({ depart, arrivee, legendeDepart, legendeArrivee, duree, escales, retour = false }: LigneProps) {
  return (
    // Même grille fixe pour l'aller et le retour (et pour toutes les cartes) → colonnes alignées.
    // Côtés de même largeur (minmax(0,1fr) → peuvent rétrécir), trajet de largeur fixe au centre.
    <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_minmax(0,1fr)] items-start gap-x-3">
      <Horaire heure={depart} legende={legendeDepart} />
      <Trajet duree={duree} escales={escales} retour={retour} />
      <Horaire heure={arrivee} legende={legendeArrivee} aDroite />
    </div>
  );
}

function Trajet({ duree, escales, retour = false }: { duree: string; escales: string; retour?: boolean }) {
  return (
    <div className="text-center">
      {/* h-8 = hauteur de l'heure → le trait est pile au niveau des heures */}
      <div className="flex h-8 items-center gap-1 text-principal">
        <span className="size-1 shrink-0 rounded-full bg-principal" />
        <span className="h-px flex-1 bg-trait" />
        <Plane aria-hidden="true" className={`size-3.5 shrink-0 ${retour ? "rotate-180" : ""}`} />
      </div>
      {/* Même hauteur et même style que la légende des horaires */}
      <small className="mt-1 block text-[10px] whitespace-nowrap text-attenue">
        {duree}
        {escales && <span className="text-principal"> · {escales}</span>}
      </small>
    </div>
  );
}

function Horaire({ heure, legende, aDroite = false }: { heure: string | null; legende: string; aDroite?: boolean }) {
  return (
    <div className={`min-w-0 ${aDroite ? "text-right" : ""}`}>
      <strong className="block text-2xl leading-8 font-semibold text-encre">{heure ?? "--:--"}</strong>
      {/* truncate : « … » si c'est encore trop long ; le nom complet s'affiche au survol */}
      <small title={legende} className="mt-1 block truncate text-[10px] text-attenue">
        {legende}
      </small>
    </div>
  );
}