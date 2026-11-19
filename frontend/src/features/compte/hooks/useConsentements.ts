import { useEffect, useState } from "react";
import {
    lireConsentements,
    modifierConsentement,
    type ConsentementsCompte,
} from "@/features/auth/services/api";
import { messageErreur } from "../utils/messageErreur";

// Les seuls consentements que la personne peut retirer depuis son compte
export type ConsentementFacultatif = "personnalisation" | "localisation";

const CONSENTEMENTS_PAR_DEFAUT: ConsentementsCompte = {
    politique: true,
    personnalisation: false,
    localisation: false,
};

/** Lit et modifie les consentements du compte (même principe que useExplorer). */
export function useConsentements() {
    const [consentements, setConsentements] = useState(CONSENTEMENTS_PAR_DEFAUT);
    const [chargement, setChargement] = useState(true);
    const [enCours, setEnCours] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [erreur, setErreur] = useState<string | null>(null);

    // Chargement initial. "actif" évite de modifier l'état si la page a été quittée entre-temps.
    useEffect(() => {
        let actif = true;
        lireConsentements()
            .then((c) => {
                if (actif) setConsentements(c);
            })
            .catch((e: unknown) => {
                if (actif) setErreur(messageErreur(e));
            })
            .finally(() => {
                if (actif) setChargement(false);
            });
        return () => {
            actif = false;
        };
    }, []);

    // Chaque clic sur un interrupteur est enregistré immédiatement côté API
    async function basculer(type: ConsentementFacultatif) {
        setEnCours(true);
        setMessage(null);
        setErreur(null);
        try {
            setConsentements(await modifierConsentement(type, !consentements[type]));
            setMessage("Votre choix a bien été enregistré.");
        } catch (e: unknown) {
            setErreur(messageErreur(e));
        } finally {
            setEnCours(false);
        }
    }

    async function retirerFacultatifs() {
        setEnCours(true);
        setMessage(null);
        setErreur(null);
        try {
            await modifierConsentement("personnalisation", false);
            setConsentements(await modifierConsentement("localisation", false));
            setMessage("Vos consentements facultatifs ont été retirés.");
        } catch (e: unknown) {
            setErreur(messageErreur(e));
            // Le premier appel a pu réussir : on relit l'état réel pour ne pas afficher un mensonge
            lireConsentements().then(setConsentements).catch(() => { });
        } finally {
            setEnCours(false);
        }
    }

    return { consentements, chargement, enCours, message, erreur, basculer, retirerFacultatifs };
}