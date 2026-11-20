import type { Vol } from "../services/explorationApi";
import { CarteVol } from "./CarteVol";
import { Encart } from "./Encart";

type Props = {
  vols: Vol[];
  favorisIds: Set<string>;
  favorisEnCours: Set<string>;
  onBasculerFavori: (vol: Vol) => void;
  /** Facultatif : si fourni, chaque carte affiche un bouton « Voir le vol ». */
  onVoir?: (vol: Vol) => void;
  messageSiVide: string;
};

export function ListeVols({ vols, favorisIds, favorisEnCours, onBasculerFavori, onVoir, messageSiVide }: Props) {
  if (vols.length === 0) return <Encart>{messageSiVide}</Encart>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {vols.map(vol => (
        <CarteVol
          key={vol.id}
          vol={vol}
          favori={favorisIds.has(vol.id)}
          enCours={favorisEnCours.has(vol.id)}
          onBasculerFavori={onBasculerFavori}
          // ListeVols ne fait que transmettre : c'est la carte qui affiche le bouton
          onVoir={onVoir}
        />
      ))}
    </div>
  );
}
