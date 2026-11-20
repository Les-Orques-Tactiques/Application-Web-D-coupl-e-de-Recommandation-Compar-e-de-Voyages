import { ListeVols } from "@/features/explorer";
import { BarreTri, EnTeteFavoris, useFavoris } from "@/features/favoris";

/**
 * Page « Mes favoris » (/favoris).
 * Elle ne fait qu'assembler : la logique est dans useFavoris, l'affichage dans components/.
 */
export default function PageFavoris() {
  const { explorer, ordrePrix, setOrdrePrix, favorisTries, plusieursDevises, voirVol } = useFavoris();

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-16">
      <EnTeteFavoris nbFavoris={explorer.favoris.length} />

      {explorer.erreur && (
        <p role="alert" className="mb-6 rounded-lg bg-erreur-fond px-4 py-3 text-[13px] text-erreur">
          {explorer.erreur}
        </p>
      )}

      <div>
        <BarreTri
          ordrePrix={ordrePrix}
          onChanger={setOrdrePrix}
          desactive={explorer.favoris.length < 2}
        />
        {plusieursDevises && (
          <p className="mb-4 text-xs text-attenue">
            Les prix sont triés séparément pour chaque devise.
          </p>
        )}
        {/* Mêmes cartes que sur Explorer : cœur et « Voir le vol » fonctionnent pareil */}
        <ListeVols
          vols={favorisTries}
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