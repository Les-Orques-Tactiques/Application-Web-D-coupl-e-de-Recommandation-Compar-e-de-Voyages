import {useEffect, useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, LocateFixed, Plane, Wallet, X } from "lucide-react";
import { Bandeau } from "@/components/ui/Bandeau";
import { Bouton } from "@/components/ui/Bouton";
import { Champ } from "@/components/ui/Champ";
import { ErreurApi } from "@/lib/clientApi";
import { useAuth } from "@/features/auth";
import { ChampAeroport } from "@/features/referentiel";
import { definirLieuDepart, enregistrerOnboarding, passerOnboarding } from "../services/preferenceServices";
import { MAX_COMPAGNIES, type ChoixPreferences, type PreferencesModifiables } from "../utils/types";
import { CarteBoussole } from "./CarteBoussole";
import { ChoixTrajet } from "./ChoixTrajet";
import { PastillesBudget } from "./PastillesBudget";
import { aeroportPlusProche } from "@/features/referentiel/services/referentielApi";
import { listerCompagnies } from "@/features/explorer/services/explorationApi";
type EtatLocalisation = "aucune" | "en-cours" | "enregistree" | "refusee" | "sans-consentement" | "erreur";

const LONGUEUR_MAX_COMPAGNIE = 120;

/**
 * Le back ne connaît pas "trajet", seulement "escales_max" (0 à 5, ou null = pas de limite).
 * Record<...> oblige à traiter CHAQUE valeur possible de trajet.
 */
const ESCALES_PAR_TRAJET: Record<ChoixPreferences["trajet"], number | null> = {
  direct: 0,
  "une escale": 1,
  indifferent: null,
};


/** Convertit la saisie du formulaire en corps attendu par le back. */
function versCorpsApi(choix: ChoixPreferences): PreferencesModifiables {
  return {
    aeroport_habituel: choix.aeroport === "" ? null : choix.aeroport,
    budget_max: choix.budget,
    escales_max: ESCALES_PAR_TRAJET[choix.trajet],
    compagnies_preferees: choix.compagnies,
  };
}

/** Traduit les codes d'erreur du contrôleur en messages lisibles. */
function messagePourErreurPreferences(erreur: unknown): string {
  if (erreur instanceof ErreurApi) {
    switch (erreur.statut) {
      case 400: return "Cet aéroport n'est plus disponible. Choisissez-en un autre dans la liste.";
      case 401: return "Votre session a expiré. Reconnectez-vous.";
      case 422: return "Une des valeurs a été refusée. Vérifiez vos choix.";
      case 429: return "Trop de tentatives. Patientez une minute avant de réessayer.";
    }
  }
  return "Impossible d'enregistrer vos préférences pour le moment. Réessayez plus tard.";
}

export function FormulairePreferences() {
  const navigate = useNavigate();
  const { utilisateur, setUtilisateur } = useAuth();
  const [preferences, setPreferences] = useState<ChoixPreferences>({
    aeroport: "",
    budget: null,
    trajet: "indifferent",
    compagnies: [],
  });
  const [saisieCompagnie, setSaisieCompagnie] = useState("");
  const [localisation, setLocalisation] = useState<EtatLocalisation>("aucune");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [messageErreur, setMessageErreur] = useState("");
  const [libelleAeroport, setLibelleAeroport] = useState("");

  const [compagniesDisponibles, setCompagniesDisponibles] = useState<string[]>([]);

  useEffect(() => {
    let actif = true;
    listerCompagnies()
      .then((liste) => { if (actif) setCompagniesDisponibles(liste); })
      .catch(() => { /* sans liste, la saisie libre reste possible */ });
    return () => { actif = false; };
  }, []);

  function modifier<Cle extends keyof ChoixPreferences>(cle: Cle, valeur: ChoixPreferences[Cle]) {
    setPreferences((precedentes) => ({ ...precedentes, [cle]: valeur }));
  }

  function changerBudget(texte: string) {
    modifier("budget", texte === "" ? null : Math.max(0, Number(texte)));
  }

  /** Ajoute la saisie en cours à la liste (sans doublon, 20 max). Renvoie la liste à jour. */
  function ajouterCompagnie(): string[] {
    const nom = saisieCompagnie.trim().slice(0, LONGUEUR_MAX_COMPAGNIE);
    setSaisieCompagnie("");
    const actuelles = preferences.compagnies;
    if (!nom || actuelles.length >= MAX_COMPAGNIES) return actuelles;
    if (actuelles.some((c) => c.toLowerCase() === nom.toLowerCase())) return actuelles;
    const misesAJour = [...actuelles, nom];
    modifier("compagnies", misesAJour);
    return misesAJour;
  }

  function retirerCompagnie(nom: string) {
    modifier("compagnies", preferences.compagnies.filter((c) => c !== nom));
  }

  // La position est envoyée au back (PUT /lieu-depart). L'arrondi est fait dans le service.
// Récupère la position, l'enregistre et sélectionne l'aéroport le plus proche.
async function utiliserPosition() {
  if (!("geolocation" in navigator)) {
    setLocalisation("refusee");
    return;
  }

  setLocalisation("en-cours");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        // On arrondit les coordonnées à environ 1 km de précision.
        // Les mêmes coordonnées sont utilisées pour les deux appels API.
        const latitude = Math.round(position.coords.latitude * 100) / 100;
        const longitude = Math.round(position.coords.longitude * 100) / 100;

        // 1. Enregistrer la position de départ dans les préférences.
        await definirLieuDepart({ latitude, longitude });

        // 2. Rechercher l'aéroport le plus proche.
        const aeroport = await aeroportPlusProche(latitude, longitude);
        // console.log("aeroport", aeroport);
        // 3. Remplir automatiquement le champ « Aéroport habituel ».
        modifier("aeroport", aeroport.code_iata);
        setLibelleAeroport(aeroport.libelle);

        setLocalisation("enregistree");
      } catch (erreur) {
        if (erreur instanceof ErreurApi && erreur.statut === 403) {
          setLocalisation("sans-consentement");
        } else {
          setLocalisation("erreur");
        }
      }
    },
    () => setLocalisation("refusee"),
    { timeout: 10000 },
  );
}

  /**
   * Le back passe onboarding_termine à TRUE, mais l'utilisateur gardé dans le contexte
   * n'est pas mis à jour tout seul. Sans cette ligne, la garde renverrait vers /onboarding.
   */
  function terminerOnboarding() {
    if (utilisateur) setUtilisateur({ ...utilisateur, onboarding_termine: true });
    navigate("/explorer", { replace: true });
  }

  // Envoie la saisie (ou un corps vide pour « Passer »), puis termine l'onboarding
  async function envoyer(appel: () => Promise<unknown>) {
    setMessageErreur("");
    setEnvoiEnCours(true);
    try {
      await appel();
      terminerOnboarding();
    } catch (erreur) {
      // 409 : onboarding déjà terminé (double clic, deuxième onglet). Rien à corriger : on continue.
      if (erreur instanceof ErreurApi && erreur.statut === 409) {
        terminerOnboarding();
        return;
      }
      setMessageErreur(messagePourErreurPreferences(erreur));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  // Branché sur POST /onboarding
  function enregistrer(evenement: SubmitEvent<HTMLFormElement>) {
    evenement.preventDefault();
    // Une compagnie tapée mais pas encore validée (sans Entrée) est incluse dans l'envoi
    const compagnies = ajouterCompagnie();
    void envoyer(() => enregistrerOnboarding(versCorpsApi({ ...preferences, compagnies })));
  }

  return (
    <form onSubmit={enregistrer} className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
      <div className="rounded-3xl border border-trait bg-white p-8 sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[22px] tracking-tight">D'où aimez-vous partir ?</h2>
          <span className="text-xs text-attenue">Facultatif</span>
        </div>
        <div className="mt-5">
          <ChampAeroport
            libelle="Aéroport habituel"
            code={preferences.aeroport}
            libelleCode={libelleAeroport}
            onChoisir={(a) => {
              modifier("aeroport", a.code_iata);
              setLibelleAeroport(a.libelle);
            }}
            onEffacer={() => {
              modifier("aeroport", "");
              setLibelleAeroport("");
            }}
          />
        </div>
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
          libelle="Maximum par personne · aller-retour · USD"
          icone={Wallet}
          type="number"
          min={0}
          placeholder="Sans limite"
          value={preferences.budget ?? ""}
          onChange={(e) => changerBudget(e.target.value)}
        />
        <PastillesBudget valeur={preferences.budget} onChange={(budget) => modifier("budget", budget)} />

        <h2 className="mt-10 text-[22px] tracking-tight">Vos compagnies préférées</h2>
        <Champ
          className="mt-5"
          libelle="Ajouter une compagnie"
          icone={Plane}
          list="liste-compagnies"
          placeholder="Choisissez ou tapez une compagnie"
          value={saisieCompagnie}
          onChange={(e) => setSaisieCompagnie(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              ajouterCompagnie();
            }
          }}
        />
        <datalist id="liste-compagnies">
          {compagniesDisponibles
            .filter((c) => !preferences.compagnies.includes(c))
            .map((c) => <option key={c} value={c} />)}
        </datalist>
        {preferences.compagnies.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {preferences.compagnies.map((nom) => (
              <li
                key={nom}
                className="flex items-center gap-1.5 rounded-full border border-trait px-3 py-1 text-[13px]"
              >
                {nom}
                <button
                  type="button"
                  onClick={() => retirerCompagnie(nom)}
                  aria-label={`Retirer ${nom}`}
                  className="text-attenue hover:text-principal"
                >
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-attenue">
          {preferences.compagnies.length}/{MAX_COMPAGNIES} compagnies. Appuyez sur Entrée pour ajouter chaque nom.
        </p>

        <h2 className="mt-10 mb-5 text-[22px] tracking-tight">Le trajet qui vous convient</h2>
        <ChoixTrajet valeur={preferences.trajet} onChange={(trajet) => modifier("trajet", trajet)} />
        <p className="mt-3 text-xs text-attenue">
          Une préférence, pas une exclusion : vous pourrez filtrer strictement les résultats.
        </p>

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
          {/* Un simple <Link> ne prévenait pas le back : sans cet appel,
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