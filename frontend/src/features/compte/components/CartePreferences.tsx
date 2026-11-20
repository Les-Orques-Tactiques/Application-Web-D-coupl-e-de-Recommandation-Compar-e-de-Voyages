import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Save, SlidersHorizontal } from "lucide-react";
import {
    lirePreferences,
    modifierPreferences,
    type Preferences,
    type PreferencesModifiables,
} from "@/features/preferences";
import { messageErreur } from "../utils/messageErreur";

// Le code aéroport IATA = exactement 3 lettres (ex. CDG, ORY, JFK).
const FORMAT_AEROPORT = /^[A-Z]{3}$/;

export function CartePreferences() {
    // Préférences telles que renvoyées par le back (objet complet, lecture seule
    // pour les champs serveur comme utilisateur_id ou modifie_le).
    const [preferences, setPreferences] = useState<Preferences | null>(null);
    const [chargement, setChargement] = useState(true);
    const [enregistrement, setEnregistrement] = useState(false);

    // Deux états séparés : succès (vert) et erreur (rouge).
    const [messageStatut, setMessageStatut] = useState<string | null>(null);
    const [erreur, setErreur] = useState<string | null>(null);

    // --- Chargement initial ---------------------------------------------------
    useEffect(() => {
        let actif = true; // évite un setState si le composant est démonté entre-temps

        lirePreferences()
            .then((donnees) => {
                if (actif) setPreferences(donnees);
            })
            .catch((e: unknown) => {
                if (actif) setErreur(`Impossible de charger les préférences : ${messageErreur(e)}`);
            })
            .finally(() => {
                if (actif) setChargement(false);
            });

        return () => {
            actif = false;
        };
    }, []);

    // --- Modification locale d'un champ ---------------------------------------
    // Générique : la clé et la valeur restent typées correctement.
    function modifierChamp<K extends keyof PreferencesModifiables>(
        cle: K,
        valeur: PreferencesModifiables[K],
    ) {
        setPreferences((precedent) => (precedent ? { ...precedent, [cle]: valeur } : precedent));
        setMessageStatut(null);
    }

    // --- Envoi au back ----------------------------------------------------------
    async function enregistrer(evenement: FormEvent<HTMLFormElement>) {
        evenement.preventDefault();
        if (!preferences) return;

        setErreur(null);
        setMessageStatut(null);

        // Vide => null (= pas d'aéroport habituel). Sinon on normalise en majuscules.
        const aeroport = preferences.aeroport_habituel?.trim().toUpperCase() || null;
        if (aeroport !== null && !FORMAT_AEROPORT.test(aeroport)) {
            setErreur("Le code aéroport doit faire exactement 3 lettres (ex. CDG).");
            return;
        }

        // IMPORTANT : on n'envoie QUE les champs modifiables.
        // Le back est en extra="forbid" : utilisateur_id, latitude_depart,
        // longitude_depart, a_un_lieu_depart et modifie_le provoqueraient une 422.
        const donnees: PreferencesModifiables = {
            aeroport_habituel: aeroport,
            budget_max: preferences.budget_max,
            escales_max: preferences.escales_max,
        };

        setEnregistrement(true);
        try {
            setPreferences(await modifierPreferences(donnees));
            setMessageStatut("Préférences enregistrées.");
        } catch (e) {
            setErreur(`Impossible d'enregistrer les préférences : ${messageErreur(e)}`);
        } finally {
            setEnregistrement(false);
        }
    }

    // --- Rendu ------------------------------------------------------------------
    return (
        <section className="rounded-2xl border border-trait bg-white p-6 shadow-sm">
            <header className="mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-principal" aria-hidden />
                <h2 className="text-lg font-semibold text-encre">Mes préférences de voyage</h2>
            </header>

            {chargement && (
                <p className="flex items-center gap-2 text-sm text-attenue">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Chargement…
                </p>
            )}

            {!chargement && preferences && (
                <form onSubmit={enregistrer} className="space-y-4" noValidate>
                    {/* Aéroport habituel */}
                    <label className="block">
                        <span className="text-sm font-medium text-encre">Aéroport habituel (code IATA)</span>
                        <input
                            type="text"
                            maxLength={3}
                            placeholder="CDG"
                            value={preferences.aeroport_habituel ?? ""}
                            onChange={(e) => modifierChamp("aeroport_habituel", e.target.value.toUpperCase())}
                            className="mt-1 w-full rounded-lg border border-trait bg-fond px-3 py-2 uppercase text-encre focus:border-principal focus:outline-none"
                        />
                    </label>

                    {/* Budget maximum */}
                    <label className="block">
                        <span className="text-sm font-medium text-encre">Budget maximum (USD)</span>
                        <input
                            type="number"
                            min={0}
                            step={10}
                            value={preferences.budget_max ?? ""}
                            onChange={(e) =>
                                modifierChamp("budget_max", e.target.value === "" ? null : Number(e.target.value))
                            }
                            className="mt-1 w-full rounded-lg border border-trait bg-fond px-3 py-2 text-encre focus:border-principal focus:outline-none"
                        />
                    </label>

                    {/* Escales maximum */}
                    <label className="block">
                        <span className="text-sm font-medium text-encre">Nombre d'escales maximum</span>
                        <select
                            value={preferences.escales_max ?? ""}
                            onChange={(e) =>
                                modifierChamp("escales_max", e.target.value === "" ? null : Number(e.target.value))
                            }
                            className="mt-1 w-full rounded-lg border border-trait bg-fond px-3 py-2 text-encre focus:border-principal focus:outline-none"
                        >
                            <option value="">Peu importe</option>
                            <option value="0">Vol direct uniquement</option>
                            <option value="1">1 escale max</option>
                            <option value="2">2 escales max</option>
                        </select>
                    </label>

                    {/* Messages : succès en vert, erreur en rouge */}
                    {messageStatut && (
                        <p role="status" className="text-sm text-menthe">
                            {messageStatut}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={enregistrement}
                        className="inline-flex items-center gap-2 rounded-lg bg-principal px-4 py-2 font-medium text-white hover:bg-principal-fonce disabled:opacity-60"
                    >
                        {enregistrement ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                            <Save className="h-4 w-4" aria-hidden />
                        )}
                        Enregistrer
                    </button>
                </form>
            )}

            {erreur && (
                <p role="alert" className="mt-4 rounded-lg bg-erreur-fond px-3 py-2 text-sm text-erreur">
                    {erreur}
                </p>
            )}
        </section>
    );
}