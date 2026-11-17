import { useState, type FormEvent } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Bandeau } from "@/components/ui/Bandeau";
import { Bouton } from "@/components/ui/Bouton";
import { Champ } from "@/components/ui/Champ";
import { ErreurApi } from "@/lib/clientApi";
import { seConnecter } from "../api";

/**
 * Choisit le message à montrer selon la réponse du serveur.
 * "erreur: unknown" signifie qu'on ne sait pas d'avance de quel type est l'erreur :
 * "instanceof ErreurApi" vérifie que c'est bien une erreur de notre client API avant de
 * lire son statut.
 */
function messagePourErreur(erreur: unknown): string {
  if (erreur instanceof ErreurApi && erreur.statut === 403) {
    return "Votre compte n’est pas encore activé. Vérifiez votre boîte mail."; // 403 : compte non activé
  }
  if (erreur instanceof ErreurApi && erreur.statut === 401) {
    return "Adresse e-mail ou mot de passe incorrect. Vérifiez vos informations puis réessayez."; // 401 : identifiants faux
  }
  return "Connexion impossible pour le moment. Réessayez dans un instant."; // panne, réseau coupé…
}

/** Formulaire de connexion : e-mail + mot de passe, avec un bandeau d'erreur si la connexion échoue. */
export function FormulaireConnexion() {
  const naviguerVers = useNavigate();
  // Chaque champ a sa propre donnée (ici deux champs seulement, donc pas besoin d'un objet)
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [messageErreur, setMessageErreur] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  /**
   * Exécutée à la validation du formulaire : tente la connexion, et en cas de succès
   * envoie la personne vers l'espace connecté. En cas d'échec, affiche le message d'erreur.
   */
  async function soumettre(evenement: FormEvent) {
    evenement.preventDefault(); // évite le rechargement de la page
    setMessageErreur("");
    setEnvoiEnCours(true);
    try {
      await seConnecter({ email: email.trim(), motDePasse });
      naviguerVers("/explorer"); // À FAIRE : /bienvenue à la première connexion (préférences)
    } catch (erreur) {
      setMessageErreur(messagePourErreur(erreur));
    } finally {
      setEnvoiEnCours(false); // réactive le bouton dans tous les cas
    }
  }

  return (
    <form onSubmit={soumettre} className="mt-6 space-y-5">
      {/* Champ "contrôlé" : sa valeur vient de la donnée React (value) et chaque frappe la met à jour (onChange) */}
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

      {/* Affiché seulement quand messageErreur n'est pas vide */}
      {messageErreur && (
        <Bandeau ton="erreur" titre="Connexion impossible">
          {messageErreur}
        </Bandeau>
      )}
    </form>
  );
}
