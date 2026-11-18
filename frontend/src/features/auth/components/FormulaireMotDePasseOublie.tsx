import { useState, type SubmitEvent } from "react";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Bandeau } from "@/components/ui/Bandeau";
import { Bouton } from "@/components/ui/Bouton";
import { Champ } from "@/components/ui/Champ";
import { demanderReinitialisation } from "../services/api";
import { messagePourErreur } from "../utils/erreurs";
import { verifierEmail } from "../utils/validation";

/**
 * Demande d'un e-mail de réinitialisation.
 * Sécurité : en cas de succès, le message est le même que l'adresse existe ou non.
 * Ainsi, ce formulaire ne permet pas de savoir si un e-mail est inscrit.
 */
export function FormulaireMotDePasseOublie() {
    const [email, setEmail] = useState("");
    const [erreurEmail, setErreurEmail] = useState<string | undefined>();
    const [messageErreur, setMessageErreur] = useState("");
    const [envoye, setEnvoye] = useState(false); // true = on affiche la confirmation
    const [envoiEnCours, setEnvoiEnCours] = useState(false);

    async function soumettre(evenement: SubmitEvent<HTMLFormElement>) {
        evenement.preventDefault();
        setMessageErreur("");

        const erreur = verifierEmail(email);
        setErreurEmail(erreur);
        if (erreur) return;

        setEnvoiEnCours(true);
        try {
            await demanderReinitialisation(email.trim());
            setEnvoye(true);
        } catch (erreurServeur) {
            // Seuls 429, 5xx, réseau ou e-mail mal formé arrivent ici
            setMessageErreur(messagePourErreur(erreurServeur, "oubli"));
        } finally {
            setEnvoiEnCours(false);
        }
    }

    // ----- Après l'envoi : message neutre -----
    if (envoye) {
        return (
            <div className="mt-6 space-y-5">
                <Bandeau ton="succes" titre="Demande envoyée">
                    Si un compte correspond à <strong>{email.trim()}</strong>, vous allez recevoir un e-mail
                    contenant un lien pour choisir un nouveau mot de passe. Pensez à vérifier vos courriers
                    indésirables.
                </Bandeau>

                <p className="text-[13px] text-attenue">
                    Mauvaise adresse ?{" "}
                    <button
                        type="button"
                        onClick={() => setEnvoye(false)}
                        className="font-medium text-principal"
                    >
                        Saisir une autre adresse
                    </button>
                </p>

                <Link to="/connexion" className="inline-flex items-center gap-1 text-[13px] font-semibold text-principal">
                    <ArrowLeft aria-hidden="true" className="size-4" />
                    Retour à la connexion
                </Link>
            </div>
        );
    }

    // ----- Formulaire -----
    return (
        <form onSubmit={soumettre} noValidate className="mt-6 space-y-5">
            <Champ
                libelle="Adresse e-mail"
                type="email"
                icone={Mail}
                autoComplete="email"
                placeholder="camille.martin@example.fr"
                required
                value={email}
                onChange={(evenement) => setEmail(evenement.target.value)}
                erreur={erreurEmail}
            />

            {messageErreur && (
                <Bandeau ton="erreur" titre="Envoi impossible">
                    {messageErreur}
                </Bandeau>
            )}

            <Bouton type="submit" disabled={envoiEnCours} className="w-full">
                {envoiEnCours ? "Envoi…" : "Recevoir le lien"}
                {!envoiEnCours && <ArrowRight aria-hidden="true" className="size-4" />}
            </Bouton>

            <Link to="/connexion" className="inline-flex items-center gap-1 text-[13px] font-semibold text-principal">
                <ArrowLeft aria-hidden="true" className="size-4" />
                Retour à la connexion
            </Link>
        </form>
    );
}
