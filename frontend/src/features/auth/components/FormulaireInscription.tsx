import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Bandeau } from "@/components/ui/Bandeau";
import { Bouton } from "@/components/ui/Bouton";
import { Champ } from "@/components/ui/Champ";
import { ErreurApi } from "@/lib/clientApi";
import { creerCompte } from "../services/api";
import { AIDE_MOT_DE_PASSE, verifierEmail, verifierMotDePasse } from "../utils/validation";
import { messagePourErreur } from "../utils/erreurs";
import { emailEnAttente } from "../utils/stockage";
import { CasesConsentements } from "./CasesConsentements";
import { ChampMotDePasse } from "@/components/ui/ChampMotDePasse";
import type { Consentements, ErreursFormulaire, ValeursFormulaire } from "../utils/types";


/**
 * Vérifie le formulaire avant l'envoi au serveur.
 * Fonction "pure" : elle ne modifie rien, elle lit seulement ses paramètres et renvoie un résultat,
 * ce qui la rend facile à tester.
 *
 * @returns Un objet contenant un message pour chaque champ incorrect ({} si tout est bon)
 */
function verifierFormulaire(valeurs: ValeursFormulaire, consentements: Consentements): ErreursFormulaire {
  const erreurs: ErreursFormulaire = {};

  if (!valeurs.prenom.trim()) erreurs.prenom = "Indiquez votre prénom.";
  if (!valeurs.nom.trim()) erreurs.nom = "Indiquez votre nom.";

  const erreurEmail = verifierEmail(valeurs.email);
  if (erreurEmail) erreurs.email = erreurEmail;

  const erreurMotDePasse = verifierMotDePasse(valeurs.motDePasse);
  if (erreurMotDePasse) erreurs.motDePasse = erreurMotDePasse;
  if (!consentements.conditions) erreurs.conditions = "Vous devez accepter les conditions pour créer un compte.";
  return erreurs;
}

/**
 * Formulaire d'inscription complet : champs, validation, envoi au serveur, puis redirection
 * vers la page d'activation.
 */
export function FormulaireInscription() {
  // useNavigate renvoie une fonction pour changer de page depuis le code
  const naviguerVers = useNavigate();

  // Chaque useState = une donnée dont le changement réaffiche le formulaire.
  // Syntaxe : const [valeur, fonctionPourLaModifier] = useState(valeurDeDepart)
  const [valeurs, setValeurs] = useState<ValeursFormulaire>({ prenom: "", nom: "", email: "", motDePasse: "" });
  // La case obligatoire n'est pas pré-cochée ; la personnalisation l'est, comme sur la maquette
  const [consentements, setConsentements] = useState<Consentements>({
    conditions: false,
    personnalisation: true,
    geolocalisation: false,
  });
  const [erreurs, setErreurs] = useState<ErreursFormulaire>({}); // erreurs par champ
  const [erreurGenerale, setErreurGenerale] = useState(""); // erreur venant du serveur
  const [envoiEnCours, setEnvoiEnCours] = useState(false); // true pendant l'appel au serveur

  /**
   * Fabrique le gestionnaire de saisie d'un champ (même principe que "basculer" plus haut).
   * Chaque frappe met à jour UNE valeur : on recopie les valeurs actuelles avec "...", puis on
   * remplace celle du champ modifié. La forme "(valeursActuelles) => ..." garantit qu'on part de
   * la valeur la plus récente.
   */
  const modifierChamp = (champ: keyof ValeursFormulaire) => (evenement: ChangeEvent<HTMLInputElement>) =>
    setValeurs((valeursActuelles) => ({ ...valeursActuelles, [champ]: evenement.target.value }));

  /**
   * Exécutée quand la personne valide le formulaire (bouton ou touche Entrée) :
   * 1. vérifie les champs ; 2. s'il y a des erreurs, les affiche et s'arrête ;
   * 3. sinon envoie la demande au serveur ; 4. en cas de succès, passe à la page d'activation.
   * "async" permet d'utiliser "await" pour attendre la réponse du serveur.
   */
  async function soumettre(evenement: SubmitEvent<HTMLFormElement>) {
    evenement.preventDefault(); // empêche le rechargement de la page, comportement par défaut d'un formulaire
    const erreursTrouvees = verifierFormulaire(valeurs, consentements);
    setErreurs(erreursTrouvees);
    setErreurGenerale("");
    // Object.keys(...) liste les champs en erreur : s'il y en a au moins un, on n'envoie rien
    if (Object.keys(erreursTrouvees).length > 0) return;

    const emailNettoye = valeurs.email.trim();
    setEnvoiEnCours(true);
    try {
      // On tente l'inscription ; si le serveur refuse, l'exécution saute directement au "catch"
      await creerCompte({ ...valeurs, email: emailNettoye, consentements });
      emailEnAttente.ecrire(emailNettoye); // pour retrouver l'adresse si la page est rechargée
      naviguerVers("/activation", { state: { email: emailNettoye } }); // passe l'adresse à la page suivante
    } catch (erreur) {
      if (erreur instanceof ErreurApi && erreur.statut === 409) {
        // Email déjà utilisé : l'erreur s'affiche sous le champ concerné
        setErreurs({ email: "Un compte existe déjà avec cette adresse e-mail." });
      } else {
        // 429, 400/422, 500, réseau… : messages communs définis dans erreurs.ts
        setErreurGenerale(messagePourErreur(erreur, "inscription"));
      }
    } finally {
      // "finally" s'exécute toujours, succès ou échec : on réactive le bouton
      setEnvoiEnCours(false);
    }
  }

  return (
    // noValidate : on désactive les messages du navigateur, car on affiche les nôtres
    <form onSubmit={soumettre} noValidate className="mt-8 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Champ libelle="Prénom" required autoComplete="given-name" placeholder="Camille" value={valeurs.prenom} onChange={modifierChamp("prenom")} erreur={erreurs.prenom} />
        <Champ libelle="Nom" required autoComplete="family-name" placeholder="Martin" value={valeurs.nom} onChange={modifierChamp("nom")} erreur={erreurs.nom} />
      </div>
      <Champ libelle="Adresse e-mail" required type="email" icone={Mail} autoComplete="email" placeholder="camille.martin@example.fr" value={valeurs.email} onChange={modifierChamp("email")} erreur={erreurs.email} />
      <ChampMotDePasse libelle="Mot de passe" required autoComplete="new-password" value={valeurs.motDePasse} onChange={modifierChamp("motDePasse")} erreur={erreurs.motDePasse} aide={AIDE_MOT_DE_PASSE}/>
      <CasesConsentements valeur={consentements} auChangement={setConsentements} erreurConditions={erreurs.conditions} />

      {/* Le bandeau n'apparaît que si le serveur a renvoyé une erreur */}
      {erreurGenerale && <Bandeau ton="erreur">{erreurGenerale}</Bandeau>}

      {/* disabled : le bouton est inactif pendant l'envoi, pour éviter un double clic */}
      <Bouton type="submit" disabled={envoiEnCours} className="w-full">
        {envoiEnCours ? "Création en cours…" : "Créer mon compte"}
        {!envoiEnCours && <ArrowRight aria-hidden="true" className="size-4" />}
      </Bouton>

      <p className="text-[13px] text-attenue">
        Déjà membre ?{" "}
        <Link to="/connexion" className="font-medium text-principal">
          Me connecter
        </Link>
      </p>
      <p className="text-[11px] text-attenue">
        * Champs obligatoires. Les deux autorisations facultatives sont révocables dans Mon compte.
      </p>
    </form>
  );
}
