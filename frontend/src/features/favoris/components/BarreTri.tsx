import { estOrdrePrix, type OrdrePrix } from "../utils/tri";

type ProprietesBarreTri = {
    ordrePrix: OrdrePrix;
    onChanger: (ordre: OrdrePrix) => void;
    desactive: boolean; // vrai quand il y a moins de 2 favoris : rien à trier
};

/** Titre de la section et menu déroulant « Trier par prix ». */
export function BarreTri({ ordrePrix, onChanger, desactive }: ProprietesBarreTri) {
    return (
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
                        if (estOrdrePrix(valeur)) {
                            onChanger(valeur);
                        }
                    }}
                    disabled={desactive}
                    className="rounded-lg border border-trait bg-white px-3 py-2 text-[13px] text-encre outline-none transition focus:border-principal disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="croissant">Moins cher d’abord</option>
                    <option value="decroissant">Plus cher d’abord</option>
                </select>
            </label>
        </div>
    );
}