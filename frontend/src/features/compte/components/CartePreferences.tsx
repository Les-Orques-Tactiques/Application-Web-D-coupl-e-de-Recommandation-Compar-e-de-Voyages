import { useEffect, useState, type FormEvent } from "react";
import { Loader2, SlidersHorizontal } from "lucide-react";
import {
    lirePreferences,
    modifierPreferences,
    type Preferences,
    type PreferencesModifiables,
} from "@/features/preferences";
import { ChampAeroport } from "@/features/referentiel/components/ChampAeroport";
import { messageErreur } from "../utils/messageErreur";

// Le code aéroport IATA = exactement 3 lettres (ex. CDG, ORY, JFK).
// Le code vient toujours de la liste de ChampAeroport, mais on garde ce garde-fou.
const FORMAT_AEROPORT = /^[A-Z]{3}$/;

// Classes communes aux champs « budget » et « escales » (fond blanc, comme CarteProfil)
const CLASSES_LIBELLE = "text-[13px] font-medium text-encre";
const CLASSES_CHAMP =
    "mt-1.5 w-full rounded-lg border border-trait bg-white px-3 py-2.5 text-[13px] text-encre focus:border-principal focus:outline-none";

export function CartePreferences() {
    // Préférences telles que renvoyées par le back (objet complet, lecture seule
    // pour les champs serveur comme utilisateur_id ou modifie_le).
    const [preferences, setPreferences] = useState<Preferences | null>(null);
    const [chargement, setChargement] = useState(true);
    const [enregistrement, setEnregistrement] = useState(false);

    // Deux états séparés : succès et erreur.
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
            setErreur("Choisissez un aéroport dans la liste.");
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
        // id="preferences" : cible de la pastille « Préférences » de PageMonCompte
        <section id="preferences" className="rounded-2xl border border-trait bg-white p-5">
            <h2 className="mb-4 text-[15px] font-semibold text-encre">Mes préférences</h2>

            {chargement && (
                <p className="flex items-center gap-2 text-[13px] text-attenue">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Chargement…
                </p>
            )}

            {!chargement && preferences && (
                <form onSubmit={enregistrer} className="space-y-4" noValidate>
                    {/* Aéroport habituel : liste déroulante partagée avec Explorer.
   Le champ affiche « Lyon (LYS), France », mais on ne garde que le code IATA. */}
                    <ChampAeroport
                        libelle="Aéroport habituel"
                        code={preferences.aeroport_habituel ?? ""}
                        onChoisir={(aeroport) => modifierChamp("aeroport_habituel", aeroport.code_iata)}
                        onEffacer={() => modifierChamp("aeroport_habituel", null)}
                    />

                    {/* Budget et escales côte à côte (empilés sur petit écran) */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                            <span className={CLASSES_LIBELLE}>Budget A/R / pers. (USD)</span>
                            <input
                                type="number"
                                min={0}
                                step={10}
                                value={preferences.budget_max ?? ""}
                                onChange={(e) =>
                                    modifierChamp("budget_max", e.target.value === "" ? null : Number(e.target.value))
                                }
                                className={CLASSES_CHAMP}
                            />
                        </label>

                        <label className="block">
                            <span className={CLASSES_LIBELLE}>Escales</span>
                            <select
                                value={preferences.escales_max ?? ""}
                                onChange={(e) =>
                                    modifierChamp("escales_max", e.target.value === "" ? null : Number(e.target.value))
                                }
                                className={CLASSES_CHAMP}
                            >
                                <option value="">Peu importe</option>
                                <option value="0">Vol direct uniquement</option>
                                <option value="1">1 escale maximum</option>
                                <option value="2">2 escales maximum</option>
                            </select>
                        </label>
                    </div>

                    {/* Bouton en contour, sur toute la largeur */}
                    <button
                        type="submit"
                        disabled={enregistrement}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-principal bg-white px-4 py-2.5 text-[13px] font-medium text-principal hover:bg-principal hover:text-white disabled:opacity-60"
                    >
                        {enregistrement ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <SlidersHorizontal className="size-4" aria-hidden="true" />
                        )}
                        Enregistrer les préférences
                    </button>

                    {/* Succès : couleur principale (menthe est illisible sur fond blanc) */}
                    {messageStatut && (
                        <p role="status" className="text-[13px] text-principal">
                            {messageStatut}
                        </p>
                    )}
                </form>
            )}

            {/* Erreur : en rouge, annoncée aux lecteurs d'écran */}
            {erreur && (
                <p role="alert" className="mt-4 rounded-lg bg-erreur-fond px-3 py-2 text-[13px] text-erreur">
                    {erreur}
                </p>
            )}
        </section>
    );
}