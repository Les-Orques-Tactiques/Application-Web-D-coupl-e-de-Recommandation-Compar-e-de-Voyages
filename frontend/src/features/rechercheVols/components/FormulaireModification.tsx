import { NOMBRES_PASSAGERS } from "../utils/constantes";
import { boutonSecondaire } from "../utils/styles";
import type { SaisieRecherche } from "../utils/types";

type PropsFormulaireModification = {
    saisie: SaisieRecherche;
    budget: number;
    enCours: boolean;
    erreur: string | null;
    onModifier: (changements: Partial<SaisieRecherche>) => void;
    onChangerBudget: (budget: number) => void;
    onRechercher: () => void;
    onFermer: () => void;
};

const etiquette = "grid gap-2 text-xs text-attenue";
const champ = "rounded-lg border border-trait bg-white p-2 text-encre disabled:opacity-50";

/** Panneau ouvert par « Modifier la recherche ». Un vrai <form> : Entrée lance la recherche. */
export function FormulaireModification({
    saisie, budget, enCours, erreur, onModifier, onChangerBudget, onRechercher, onFermer,
}: PropsFormulaireModification) {
    return (
        <form
            onSubmit={e => {
                e.preventDefault(); // empêche le rechargement de la page
                onRechercher();
            }}
            className="mt-3 flex flex-wrap items-end gap-4 rounded-xl border border-trait bg-white p-5"
        >
            <label className={etiquette}>
                Aller
                <input
                    type="date"
                    value={saisie.aller}
                    max={saisie.allerRetour ? saisie.retour : undefined}
                    onChange={e => e.target.value && onModifier({ aller: e.target.value })}
                    className={champ}
                />
            </label>

            <label className={etiquette}>
                Retour
                <input
                    type="date"
                    value={saisie.retour}
                    min={saisie.aller}
                    disabled={!saisie.allerRetour}
                    onChange={e => e.target.value && onModifier({ retour: e.target.value })}
                    className={champ}
                />
            </label>

            <label className={etiquette}>
                Trajet
                <select
                    value={saisie.allerRetour ? "aller-retour" : "aller-simple"}
                    onChange={e => onModifier({ allerRetour: e.target.value === "aller-retour" })}
                    className={champ}
                >
                    <option value="aller-retour">Aller-retour</option>
                    <option value="aller-simple">Aller simple</option>
                </select>
            </label>

            <label className={etiquette}>
                Passagers
                <select
                    value={saisie.passagers}
                    onChange={e => onModifier({ passagers: Number(e.target.value) })}
                    className={champ}
                >
                    {NOMBRES_PASSAGERS.map(n => (
                        <option key={n} value={n}>{n} adulte{n > 1 ? "s" : ""}</option>
                    ))}
                </select>
            </label>

            <label className={etiquette}>
                Budget maximum (€)
                <input
                    type="number"
                    min={1}
                    value={budget}
                    onChange={e => onChangerBudget(Number(e.target.value))}
                    className={`${champ} w-36`}
                />
            </label>

            <button type="submit" className={boutonSecondaire} disabled={enCours}>
                {enCours ? "Recherche…" : "Rechercher dans la base"}
            </button>
            <button type="button" className={boutonSecondaire} onClick={onFermer}>
                Fermer
            </button>

            <p className="w-full text-xs text-attenue">
                Pour les villes, indiquez aussi le code IATA à trois lettres (ex. Paris CDG).
                La recherche utilise les vols enregistrés dans la base.
            </p>
            {erreur && (
                <p role="alert" className="w-full rounded-lg bg-erreur-fond px-4 py-3 text-xs text-erreur">
                    {erreur}
                </p>
            )}
        </form>
    );
}