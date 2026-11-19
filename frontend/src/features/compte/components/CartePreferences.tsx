// Même source que PageExplorer : ce qui est enregistré ici préremplit le formulaire d'Explorer.
import { useEffect, useState, type SubmitEvent } from "react";
import { Settings2 } from "lucide-react";
import { modifierPreferences, lirePreferences } from "@/features/preferences";
import { messageErreur } from "../utils/messageErreur";
import { boutonSecondaire, carte, champ, etiquette, messageStatut, titreCarte } from "../utils/classes";

// On déduit le type de ce que renvoie l'API : pas besoin de connaître son nom exact
type Preferences = Awaited<ReturnType<typeof lirePreferences>>;

export function CartePreferences() {
    const [preferences, setPreferences] = useState<Preferences | null>(null);
    const [enCours, setEnCours] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        let actif = true;
        lirePreferences()
            .then((p) => {
                if (actif) setPreferences(p);
            })
            .catch((e: unknown) => {
                if (actif) setMessage(`Impossible de lire vos préférences : ${messageErreur(e)}`);
            });
        return () => {
            actif = false;
        };
    }, []);

    // Petite aide pour modifier un seul champ sans réécrire tout l'objet
    function changer<Cle extends keyof Preferences>(cle: Cle, valeur: Preferences[Cle]) {
        setPreferences((p) => (p ? { ...p, [cle]: valeur } : p));
    }

    async function enregistrer(evenement: SubmitEvent<HTMLFormElement>) {
        evenement.preventDefault();
        if (!preferences) return;
        setEnCours(true);
        setMessage(null);
        try {
            setPreferences(await modifierPreferences(preferences));
            setMessage("Préférences enregistrées.");
        } catch (e: unknown) {
            setMessage(`Impossible d’enregistrer les préférences : ${messageErreur(e)}`);
        } finally {
            setEnCours(false);
        }
    }

    return (
        <section id="preferences" className={carte}>
            <h2 className={titreCarte}>Mes préférences</h2>
            {!preferences ? (
                <p className="text-[13px] text-attenue">{message ?? "Chargement de vos préférences…"}</p>
            ) : (
                <form onSubmit={enregistrer} className="grid gap-3">
                    <label className={etiquette}>
                        Aéroport habituel (code IATA)
                        <input className={`${champ} uppercase`} maxLength={3} placeholder="LYS"
                            value={preferences.aeroport_habituel ?? ""}
                            // Chaîne vide → null : « pas de préférence »
                            onChange={(e) => changer("aeroport_habituel", e.target.value.toUpperCase() || null)} />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className={etiquette}>
                            Budget A/R / pers. (€)
                            <input className={champ} type="number" min={0}
                                value={preferences.budget_max ?? ""}
                                onChange={(e) => changer("budget_max", e.target.value === "" ? null : Number(e.target.value))} />
                        </label>
                        <label className={etiquette}>
                            Escales
                            <select className={champ}
                                value={preferences.escales_max ?? ""}
                                onChange={(e) => changer("escales_max", e.target.value === "" ? null : Number(e.target.value))}>
                                <option value="">Sans préférence</option>
                                <option value={0}>Direct uniquement</option>
                                <option value={1}>1 escale maximum</option>
                                <option value={2}>2 escales maximum</option>
                            </select>
                        </label>
                    </div>
                    <button type="submit" className={boutonSecondaire} disabled={enCours}>
                        <Settings2 className="size-4" aria-hidden="true" />
                        {enCours ? "Enregistrement…" : "Enregistrer les préférences"}
                    </button>
                    {message && <p role="status" className={messageStatut}>{message}</p>}
                </form>
            )}
        </section>
    );
}