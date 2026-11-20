import { useNavigate } from "react-router-dom";
import { convertirVolExplorer } from "@/features/rechercheVols/utils/recherche";
import type { EtatPageDetailVol } from "@/features/rechercheVols/pages/PageDetailVol";
import { ListeVols, useExplorer, type Vol } from "@/features/explorer";

export default function PageFavoris() {
  const explorer = useExplorer();
  const navigate = useNavigate();

  function voirVol(vol: Vol) {
    const etat = {
      vol: convertirVolExplorer(vol),
      saisie: {
        origine: vol.origine,
        destination: vol.destination,
        aller: vol.date_depart ?? "",
        retour: vol.date_retour ?? "",
        allerRetour: vol.aller_retour,
        passagers: 1,
      },
      budget: vol.prix,
      depuisLaBase: true,
      nbResultats: explorer.favoris.length,
      retour: "/favoris",
      favori: explorer.favorisIds.has(vol.id),
      devise: vol.devise,
    } satisfies EtatPageDetailVol;

    navigate(`/vol/${vol.id}`, { state: etat });
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-16">
      <header>
        <p className="text-[11px] font-semibold tracking-wider text-principal">VOTRE SÉLECTION</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-encre">Mes favoris</h1>
        <p className="mt-1 text-[13px] text-attenue">
          Retrouvez les vols que vous avez gardés de côté.
        </p>
      </header>

      {explorer.erreur && (
        <p role="alert" className="mt-6 rounded-lg bg-erreur-fond px-4 py-3 text-[13px] text-erreur">
          {explorer.erreur}
        </p>
      )}

      <div className="mt-8">
        <p className="mb-5 text-[13px] text-attenue">
          {explorer.favoris.length} vol(s) favori(s)
        </p>
        <ListeVols
          vols={explorer.favoris}
          favorisIds={explorer.favorisIds}
          favorisEnCours={explorer.favorisEnCours}
          onBasculerFavori={(vol) => void explorer.basculerFavori(vol)}
          onVoir={voirVol}
          messageSiVide={
            explorer.chargement
              ? "Chargement de vos favoris…"
              : "Vous n’avez pas encore de vol favori."
          }
        />
      </div>
    </section>
  );
}
