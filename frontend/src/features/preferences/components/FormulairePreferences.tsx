import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, LocateFixed, PlaneTakeoff, Wallet } from "lucide-react";
import { Bandeau } from "@/components/ui/Bandeau";
import { Bouton } from "@/components/ui/Bouton";
import { Champ } from "@/components/ui/Champ";
import { ErreurApi } from "@/lib/clientApi"; // NOUVEAU
import { useAuth } from "@/features/auth"; // NOUVEAU
import { definirLieuDepart, enregistrerOnboarding, passerOnboarding } from "../services/preferenceServices"; // NOUVEAU
import type { ChoixPreferences, PreferencesModifiables } from "../utils/types"; // MODIFIÉ
import { CarteBoussole } from "./CarteBoussole";
import { ChoixTrajet } from "./ChoixTrajet";
import { PastillesBudget } from "./PastillesBudget";

// MODIFIÉ : plus d'états, car la position est maintenant envoyée au back
type EtatLocalisation = "aucune" | "en-cours" | "enregistree" | "refusee" | "sans-consentement" | "erreur";

/**
 * NOUVEAU : le back ne connaît pas "trajet", seulement "escales_max" (0 à 5, ou null = pas de limite).
 * Record<...> oblige à traiter CHAQUE valeur possible de trajet : si ChoixTrajet propose
 * d'autres options (ex. "une_escale"), TypeScript le signalera et il suffira d'ajouter la ligne.
 */
const ESCALES_PAR_TRAJET: Record<ChoixPreferences["trajet"], number | null> = {
  direct: 0,
  "une escale": 1,
  indifferent: null,
};

/** NOUVEAU : convertit la saisie du formulaire en corps attendu par le back. */
function versCorpsApi(choix: ChoixPreferences): PreferencesModifiables {
  return {
    aeroport_habituel: choix.aeroport === "" ? null : choix.aeroport,
    budget_max: choix.budget,
    escales_max: ESCALES_PAR_TRAJET[choix.trajet],
  };
}

/** NOUVEAU : traduit les codes d'erreur du contrôleur en messages lisibles. */
function messagePourErreurPreferences(erreur: unknown): string {
  if (erreur instanceof ErreurApi) {
    switch (erreur.statut) {
      case 400: return "Cet aéroport est inconnu. Vérifiez le code IATA (par exemple LYS ou CDG).";
      case 401: return "Votre session a expiré. Reconnectez-vous.";
      case 422: return "Une des valeurs a été refusée. Vérifiez vos choix.";
      case 429: return "Trop de tentatives. Patientez une minute avant de réessayer.";
    }
  }
  return "Impossible d'enregistrer vos préférences pour le moment. Réessayez plus tard.";
}

export function FormulairePreferences() {
  const navigate = useNavigate();
  const { utilisateur, setUtilisateur } = useAuth(); // NOUVEAU
  const [preferences, setPreferences] = useState<ChoixPreferences>({
    aeroport: "",
    budget: null,
    trajet: "indifferent",
  });
  const [localisation, setLocalisation] = useState<EtatLocalisation>("aucune");
  const [envoiEnCours, setEnvoiEnCours] = useState(false); // NOUVEAU
  const [messageErreur, setMessageErreur] = useState(""); // NOUVEAU

  function modifier<Cle extends keyof ChoixPreferences>(cle: Cle, valeur: ChoixPreferences[Cle]) {
    setPreferences((precedentes) => ({ ...precedentes, [cle]: valeur }));
  }

  function changerAeroport(texte: string) {
    modifier("aeroport", texte.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3));
  }

  function changerBudget(texte: string) {
    modifier("budget", texte === "" ? null : Math.max(0, Number(texte)));
  }

  // NOUVEAU : la position est envoyée au back (PUT /lieu-depart)
  function utiliserPosition() {
    if (!("geolocation" in navigator)) {
      setLocalisation("refusee");
      return;
    }
    setLocalisation("en-cours");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await definirLieuDepart({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocalisation("enregistree");
        } catch (erreur) {
          // 403 : la case « localisation » n'a pas été cochée à l'inscription
          setLocalisation(erreur instanceof ErreurApi && erreur.statut === 403 ? "sans-consentement" : "erreur");
        }
      },
      () => setLocalisation("refusee"), // la personne a refusé dans le navigateur
    );
  }

  /**
   * NOUVEAU : le back passe onboarding_termine à TRUE, mais l'utilisateur gardé dans le contexte
   * n'est pas mis à jour tout seul. Sans cette ligne, PageAccueil renverrait vers /bienvenue.
   */
  function terminerOnboarding() {
    if (utilisateur) setUtilisateur({ ...utilisateur, onboarding_termine: true });
    navigate("/explorer", { replace: true });
  }

  // NOUVEAU : envoie la saisie (ou un corps vide pour « Passer »), puis termine l'onboarding
  async function envoyer(appel: () => Promise<unknown>) {
    setMessageErreur("");
    setEnvoiEnCours(true);
    try {
      await appel();
      terminerOnboarding();
    } catch (erreur) {
      setMessageErreur(messagePourErreurPreferences(erreur));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  // MODIFIÉ : branché sur POST /onboarding
  function enregistrer(evenement: SubmitEvent<HTMLFormElement>) {
    evenement.preventDefault();
    // Le back exige exactement 3 lettres : on prévient avant l'envoi plutôt qu'après un 422
    if (preferences.aeroport.length > 0 && preferences.aeroport.length < 3) {
      setMessageErreur("Le code aéroport doit contenir 3 lettres, ou rester vide.");
      return;
    }
    void envoyer(() => enregistrerOnboarding(versCorpsApi(preferences)));
  }

  return (
    <form onSubmit={enregistrer} className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
      <div className="rounded-3xl border border-trait bg-white p-8 sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[22px] tracking-tight">D'où aimez-vous partir ?</h2>
          <span className="text-xs text-attenue">Facultatif</span>
        </div>
        <Champ
          className="mt-5"
          libelle="Aéroport habituel"
          icone={PlaneTakeoff}
          placeholder="Code IATA, par exemple LYS"
          value={preferences.aeroport}
          onChange={(e) => changerAeroport(e.target.value)}
        />
        <button
          type="button"
          onClick={utiliserPosition}
          disabled={localisation === "en-cours"}
          className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-principal disabled:opacity-60"
        >
          <LocateFixed aria-hidden="true" className="size-4" />
          {localisation === "en-cours" ? "Localisation…" : "Utiliser ma position"}
        </button>

        <h2 className="mt-10 text-[22px] tracking-tight">Votre budget de référence</h2>
        <Champ
          className="mt-5"
          libelle="Maximum par personne · aller-retour"
          icone={Wallet}
          type="number"
          min={0}
          placeholder="Sans limite"
          value={preferences.budget ?? ""}
          onChange={(e) => changerBudget(e.target.value)}
        />
        <PastillesBudget valeur={preferences.budget} onChange={(budget) => modifier("budget", budget)} />

        <h2 className="mt-10 mb-5 text-[22px] tracking-tight">Le trajet qui vous convient</h2>
        <ChoixTrajet valeur={preferences.trajet} onChange={(trajet) => modifier("trajet", trajet)} />
        <p className="mt-3 text-xs text-attenue">
          Une préférence, pas une exclusion : vous pourrez filtrer strictement les résultats.
        </p>

        {/* NOUVEAU : erreur renvoyée par le back */}
        {messageErreur && (
          <Bandeau ton="erreur" titre="Enregistrement impossible" className="mt-8">
            {messageErreur}
          </Bandeau>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <Bouton type="submit" disabled={envoiEnCours}>
            {envoiEnCours ? "Enregistrement…" : "Enregistrer et explorer"}
            {!envoiEnCours && <ArrowRight aria-hidden="true" className="size-4" />}
          </Bouton>
          {/* MODIFIÉ : un simple <Link> ne prévenait pas le back. Sans cet appel,
              onboarding_termine resterait faux et la personne reviendrait ici à chaque connexion. */}
          <button
            type="button"
            disabled={envoiEnCours}
            onClick={() => void envoyer(passerOnboarding)}
            className="text-sm font-semibold text-principal disabled:opacity-60"
          >
            Je préfère passer
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <CarteBoussole preferences={preferences} />
        <Bandeau ton="info" titre="Votre profil évolue avec vous">
          Avec votre accord, les favoris, les avis de pertinence et les clics vers la réservation ajustent
          dynamiquement vos recommandations.
        </Bandeau>
        {/* MODIFIÉ : un bandeau par résultat possible de la localisation */}
        {localisation === "refusee" && (
          <Bandeau ton="erreur" titre="Localisation refusée">
            Aucun problème : saisissez un aéroport. La recherche reste entièrement disponible.
          </Bandeau>
        )}
        {localisation === "sans-consentement" && (
          <Bandeau ton="erreur" titre="Localisation non autorisée">
            Vous n'avez pas accepté l'utilisation de votre position à l'inscription. Vous pourrez l'activer
            dans Mon compte, ou saisir un aéroport.
          </Bandeau>
        )}
        {localisation === "erreur" && (
          <Bandeau ton="erreur" titre="Position non enregistrée">
            Un problème est survenu. Réessayez, ou saisissez un aéroport.
          </Bandeau>
        )}
        {localisation === "enregistree" && (
          <Bandeau ton="succes" titre="Position enregistrée">
            Votre point de départ est mémorisé. Vous pourrez le supprimer à tout moment dans Mon compte.
          </Bandeau>
        )}
        <p className="text-xs leading-relaxed text-attenue">
          Ces choix sont modifiables dans Mon compte. Sans préférences enregistrées, vos critères de recherche
          suffisent pour commencer.
        </p>
      </div>
    </form>
  );
}
