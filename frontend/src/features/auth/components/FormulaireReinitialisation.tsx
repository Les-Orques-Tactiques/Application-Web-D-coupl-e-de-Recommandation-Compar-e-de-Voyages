import { useState, type SubmitEvent } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Bandeau } from "@/components/ui/Bandeau";
import { Bouton } from "@/components/ui/Bouton";
import { Champ } from "@/components/ui/Champ";
import { ErreurApi } from "@/lib/clientApi";
import { reinitialiserMotDePasse } from "../services/api";
import { useAuth } from "../contexte/useAuth";
import { messagePourErreur } from "../utils/erreurs";
import { AIDE_MOT_DE_PASSE, verifierMotDePasse } from "../utils/validation";
import { ErreursChamps } from "../utils/types";

/** Affiché quand le lien est absent, invalide, expiré ou déjà utilisé. */
function LienInvalide() {
    return (
        <div className="mt-6 space-y-5">
            <Bandeau ton="erreur" titre="Lien invalide ou expiré">
                Ce lien de réinitialisation ne fonctionne plus. Il a peut-être expiré ou déjà été utilisé.
            </Bandeau>
            <Link to="/mot-de-passe-oublie" className="text-[13px] font-semibold text-principal">
                Demander un nouveau lien
            </Link>
        </div>
    );
}

/**
 * Choix d'un nouveau mot de passe à partir du lien reçu par e-mail (/reinitialisation?jeton=…).
 * En cas de succès : redirection vers /connexion avec un message de confirmation.
 */
export function FormulaireReinitialisation() {
    const naviguerVers = useNavigate();
    const [parametres] = useSearchParams();
    const jeton = parametres.get("jeton"); // null si le paramètre est absent de l'URL
    const { setUtilisateur } = useAuth();

    const [motDePasse, setMotDePasse] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [erreurs, setErreurs] = useState<ErreursChamps>({});
    const [messageErreur, setMessageErreur] = useState("");
    // Sans jeton dans l'URL, inutile d'afficher le formulaire
    const [lienInvalide, setLienInvalide] = useState(!jeton);
    const [envoiEnCours, setEnvoiEnCours] = useState(false);

    // Retour anticipé APRÈS tous les hooks (règle des hooks de React)
    if (lienInvalide || !jeton) return <LienInvalide />;

    async function soumettre(evenement: SubmitEvent<HTMLFormElement>) {
        evenement.preventDefault();
        if (!jeton) return; // pour TypeScript : jeton est ici forcément une chaîne
        setMessageErreur("");

        // 1. Vérifications locales (mêmes règles que le back)
        const erreursTrouvees: ErreursChamps = {};
        const erreurMotDePasse = verifierMotDePasse(motDePasse);
        if (erreurMotDePasse) erreursTrouvees.motDePasse = erreurMotDePasse;
        if (confirmation !== motDePasse) erreursTrouvees.confirmation = "Les deux mots de passe ne correspondent pas.";
        setErreurs(erreursTrouvees);
        if (Object.keys(erreursTrouvees).length > 0) return;

        // 2. Envoi au serveur
        setEnvoiEnCours(true);
        try {
            await reinitialiserMotDePasse(jeton, motDePasse);
            // Le back révoque les anciennes sessions (mot_de_passe_change_le) :
            // on vide aussi le contexte au cas où la personne était connectée dans cet onglet.
            setUtilisateur(null);
            naviguerVers("/connexion", {
                replace: true, // le bouton Retour ne ramène pas vers un lien déjà utilisé
                state: { message: "Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter." },
            });
        } catch (erreur) {
            if (erreur instanceof ErreurApi && erreur.statut === 400) {
                setLienInvalide(true); // jeton refusé : on propose un nouveau lien
            } else {
                setMessageErreur(messagePourErreur(erreur, "reinitialisation"));
            }
        } finally {
            setEnvoiEnCours(false);
        }
    }

    return (
        <form onSubmit={soumettre} noValidate className="mt-6 space-y-5">
            <Champ
                libelle="Nouveau mot de passe"
                type="password"
                icone={Lock}
                autoComplete="new-password"
                required
                value={motDePasse}
                onChange={(evenement) => setMotDePasse(evenement.target.value)}
                erreur={erreurs.motDePasse}
                aide={AIDE_MOT_DE_PASSE}
            />
            <Champ
                libelle="Confirmer le mot de passe"
                type="password"
                icone={Lock}
                autoComplete="new-password"
                required
                value={confirmation}
                onChange={(evenement) => setConfirmation(evenement.target.value)}
                erreur={erreurs.confirmation}
            />

            {messageErreur && (
                <Bandeau ton="erreur" titre="Modification impossible">
                    {messageErreur}
                </Bandeau>
            )}

            <Bouton type="submit" disabled={envoiEnCours} className="w-full">
                {envoiEnCours ? "Enregistrement…" : "Changer mon mot de passe"}
                {!envoiEnCours && <ArrowRight aria-hidden="true" className="size-4" />}
            </Bouton>
        </form>
    );
}