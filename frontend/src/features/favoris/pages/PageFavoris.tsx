import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Plane } from "lucide-react";
import { convertirVolExplorer } from "@/features/rechercheVols/utils/recherche";
import type { EtatPageDetailVol } from "@/features/rechercheVols/pages/PageDetailVol";
import { ListeVols, useExplorer, type Vol } from "@/features/explorer";

export default function PageFavoris() {
  const explorer = useExplorer();
  const navigate = useNavigate();
  const [ordrePrix, setOrdrePrix] = useState<"croissant" | "decroissant">("croissant");

  const favorisTries = useMemo(
    () =>
      [...explorer.favoris].sort((a, b) => {
        const deviseA = a.devise.trim().toUpperCase();
        const deviseB = b.devise.trim().toUpperCase();
        const ordreDevise = deviseA.localeCompare(deviseB);
        if (ordreDevise !== 0) return ordreDevise;
        return ordrePrix === "croissant" ? a.prix - b.prix : b.prix - a.prix;
      }),
    [explorer.favoris, ordrePrix],
  );
  const plusieursDevises =
    new Set(explorer.favoris.map((vol) => vol.devise.trim().toUpperCase())).size > 1;

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
      <header className="relative isolate mb-8 overflow-hidden rounded-3xl bg-profond px-6 py-7 text-white md:px-10 md:py-9">
        <Plane
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 top-1/2 size-48 -translate-y-1/2 rotate-12 text-white/[0.06]"
        />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-citron">
              VOTRE CARNET DE VOYAGE
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Mes favoris</h1>
            <p className="mt-2 max-w-md text-sm text-white/70">
              Vos itinéraires préférés, réunis au même endroit.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
            <Heart aria-hidden="true" className="size-5 text-citron" fill="currentColor" />
            <span className="text-2xl font-semibold">{explorer.favoris.length}</span>
            <span className="text-xs text-white/75">favoris enregistrés</span>
          </div>
        </div>
      </header>

      {explorer.erreur && (
        <p role="alert" className="mb-6 rounded-lg bg-erreur-fond px-4 py-3 text-[13px] text-erreur">
          {explorer.erreur}
        </p>
      )}

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="size-2 rounded-full bg-principal" />
            <h2 className="text-xs font-semibold tracking-[0.14em] text-encre">VOTRE SÉLECTION</h2>
          </div>
          <label className="flex items-center gap-2 text-[13px] font-medium text-encre">
            Trier par prix
            <select
              aria-label="Ordre de tri des favoris par prix"
              value={ordrePrix}
              onChange={(event) => {
                const valeur = event.target.value;
                if (valeur === "croissant" || valeur === "decroissant") {
                  setOrdrePrix(valeur);
                }
              }}
              disabled={explorer.favoris.length < 2}
              className="rounded-lg border border-trait bg-white px-3 py-2 text-[13px] text-encre outline-none transition focus:border-principal disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="croissant">Moins cher d’abord</option>
              <option value="decroissant">Plus cher d’abord</option>
            </select>
          </label>
        </div>
        {plusieursDevises && (
          <p className="mb-4 text-xs text-attenue">
            Les prix sont triés séparément pour chaque devise.
          </p>
        )}
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
