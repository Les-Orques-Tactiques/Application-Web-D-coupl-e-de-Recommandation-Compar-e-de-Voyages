import type { VolExplorer } from "../services/explorationApi";
import { CarteVol } from "./CarteVol";
import { Encart } from "./Encart";

type Props = {
  vols: VolExplorer[];
  favorisEnCours: string[];
  onBasculerFavori: (vol: VolExplorer) => void;
  messageSiVide: string;
};

export function ListeVols({ vols, favorisEnCours, onBasculerFavori, messageSiVide }: Props) {
  if (vols.length === 0) return <Encart>{messageSiVide}</Encart>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {vols.map(vol => (
 <CarteVol
   key={vol.id}
          vol={vol}
          enCours={favorisEnCours.includes(vol.id)}
   onBasculerFavori={onBasculerFavori}
        />
      ))}
    </div>
  );
}