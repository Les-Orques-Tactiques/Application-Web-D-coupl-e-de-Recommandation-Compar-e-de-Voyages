import { ArrowRight, Heart, Plane, Sparkles } from "lucide-react";
import type { Vol } from "../services/explorationApi";
import { formaterDate, formaterDuree, formaterHeure, formaterPrix } from "../utils/formatage";

type Props = {
  vol: Vol;
  favori: boolean;
  enCours: boolean;
  onBasculerFavori: (vol: Vol) => void;
  /** 🆕 Facultatif : si fourni, la carte affiche un bouton « Voir le vol ». */
  onVoir?: (vol: Vol) => void;
};

export function CarteVol({ vol, favori, enCours, onBasculerFavori, onVoir }: Props) {
  const escales = vol.escales_aller === 0 ? "Direct" : `${vol.escales_aller} escale(s)`;
  const bagage =
    vol.bagage_inclus === null ? "Bagage non renseigné" : vol.bagage_inclus ? "Bagage en soute inclus" : "Bagage non inclus";
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

      {/* Horaires et trajet */}
      <div className="mt-5 flex items-center gap-2.5">
        <Horaire heure={formaterHeure(vol.depart_aller_local)} legende={`${vol.origine} · ${vol.ville_origine ?? "Départ"}`} />
 <div className="flex-1 text-center">
   <span className="block text-[10px] text-attenue">{formaterDuree(vol.duree_aller_min)}</span>
   <div className="my-1 flex items-center gap-1 text-principal">
     <span className="size-1 rounded-full bg-principal" />
     <span className="h-px flex-1 bg-trait" />
     <Plane aria-hidden="true" className="size-3.5" />
          </div>
   <span className="block text-[10px] text-principal">{escales}</span>
        </div>
        <Horaire
          heure={formaterHeure(vol.arrivee_aller_locale)}
   legende={`${vol.destination} · ${vol.ville_destination ?? "Arrivée"}`}
   aDroite
        />
      </div>

      <div className="mt-4 flex justify-between gap-2 text-[11px] text-attenue">
        <span>{bagage}</span>
        <span>{dates}</span>
      </div>

      <p className="mt-3 flex items-start gap-2 rounded-md bg-menthe px-3 py-2.5 text-[12px] text-encre">
 <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-principal" />
        {vol.explication ??
   (vol.simulee ? "Itinéraire simulé présent dans le catalogue." : "Vol présent dans le catalogue de la base.")}
      </p>

      {/* 🆕 Bas de carte : prix à gauche, bouton « Voir le vol » à droite.
          mt-auto pousse ce bloc en bas de la carte ; flex-wrap fait passer
          le bouton à la ligne si la carte est trop étroite (grille à 3 colonnes). */}
      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
        <p className="text-2xl text-encre">
   {formaterPrix(vol.prix, vol.devise)}
   <small className="ml-2 text-[10px] text-attenue">{vol.aller_retour ? "A/R" : "Aller simple"}</small>
        </p>

 {/* Le bouton n'existe que si le parent fournit onVoir (ex. pas forcément sur l'onglet Favoris) */}
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

function Horaire({ heure, legende, aDroite = false }: { heure: string | null; legende: string; aDroite?: boolean }) {
  return (
    <div className={aDroite ? "text-right" : ""}>
      <strong className="block text-2xl font-semibold text-encre">{heure ?? "--:--"}</strong>
      <small className="mt-1 block text-[10px] whitespace-nowrap text-attenue">{legende}</small>
    </div>
  );
}