import { useState, type FormEvent } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Bandeau } from "@/components/ui/Bandeau";
import { Bouton } from "@/components/ui/Bouton";
import { Champ } from "@/components/ui/Champ";
import { ErreurApi } from "@/lib/clientApi";
import { seConnecter } from "../api";
import { messagePourErreur } from "../erreurs";

/** Formulaire de connexion : e-mail + mot de passe, avec un bandeau d'erreur si la connexion échoue. */
export function FormulaireConnexion() {
  const naviguerVers = useNavigate();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [messageErreur, setMessageErreur] = useState("");
  // Vrai après un 401 : on propose alors de renvoyer l'email d'activation,
  // car le backend répond 401 aussi bien pour un mauvais mot de passe que pour un compte non activé
  const [proposerRenvoi, setProposerRenvoi] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function soumettre(evenement: FormEvent) {
    evenement.preventDefault(); // évite le rechargement de la page
    setMessageErreur("");
    setProposerRenvoi(false);
    setEnvoiEnCours(true);
    try {
      const utilisateur = await seConnecter({ email: email.trim(), motDePasse });
      // Première connexion : on envoie vers le choix des préférences
      naviguerVers(utilisateur.onboarding_termine ? "/explorer" : "/bienvenue");
    } catch (erreur) {
      setMessageErreur(messagePourErreur(erreur, "connexion"));
      setProposerRenvoi(erreur instanceof ErreurApi && erreur.statut === 401);
    } finally {
      setEnvoiEnCours(false); // réactive le bouton dans tous les cas
    }
  }

  return (
    <form onSubmit={soumettre} className="mt-6 space-y-5">
      <Champ libelle="Adresse e-mail" type="email" icone={Mail} autoComplete="email" placeholder="camille.martin@example.fr" required value={email} onChange={(evenement) => setEmail(evenement.target.value)} />
      <Champ libelle="Mot de passe" type="password" icone={Lock} autoComplete="current-password" required value={motDePasse} onChange={(evenement) => setMotDePasse(evenement.target.value)} />

      <div className="text-right">
        <Link to="/mot-de-passe-oublie" className="text-[13px] font-semibold text-principal">
          Mot de passe oublié ?
        </Link>
      </div>

      <Bouton type="submit" disabled={envoiEnCours} className="w-full">
        {envoiEnCours ? "Connexion…" : "Me connecter"}
        {!envoiEnCours && <ArrowRight aria-hidden="true" className="size-4" />}
      </Bouton>

      <p className="text-[13px] text-attenue">
        Pas encore de compte ?{" "}
        <Link to="/inscription" className="font-medium text-principal">
          Créer mon compte
        </Link>
      </p>

      {messageErreur && (
        <Bandeau ton="erreur" titre="Connexion impossible">
          {messageErreur}
          {proposerRenvoi && (
            <>
              {" "}
              <Link to="/activation/renvoyer" className="font-semibold underline">
                Vous n’avez pas reçu l’email d’activation ?
              </Link>
            </>
          )}
        </Bandeau>
      )}
    </form>
  );
}
