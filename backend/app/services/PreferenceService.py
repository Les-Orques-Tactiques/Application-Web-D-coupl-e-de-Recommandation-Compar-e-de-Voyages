from uuid import UUID

from app.models.preference.Preference import (
    ND,
    MiseAJourPreferences,
    Preference,
    PreferenceInvalide,
)
from app.models.preference.PreferenceInterface import PreferenceInterface
from app.models.utilisateur.UtilisateurInterface import UtilisateurInterface
from app.utils.exceptions import (
    ConsentementLocalisationRequisError,
    UtilisateurIntrouvableError,
    ValidationError, 
    OnboardingDejaTermineError
)

# Seuls ces champs peuvent venir du client ; toute autre clé est ignorée.
CHAMPS_MODIFIABLES = (
    "aeroport_habituel",
    "budget_max",
    "escales_max",
    "compagnies_preferees",
    "latitude_depart",
    "longitude_depart",
)


class PreferenceService:

    def __init__(self, preference_dao: PreferenceInterface, utilisateur_dao: UtilisateurInterface):
        self.preference_dao = preference_dao
        self.utilisateur_dao = utilisateur_dao

    # ------------------------------------------------------------------
    # Lecture
    # ------------------------------------------------------------------
    def lire(self, utilisateur_id: UUID) -> Preference:
        """Ne crée rien en base : sans ligne, renvoie des préférences vides."""
        preference = self.preference_dao.find_by_utilisateur(utilisateur_id)
        return preference if preference is not None else Preference.vide(utilisateur_id)

    # ------------------------------------------------------------------
    # Modification (mise à jour partielle)
    # ------------------------------------------------------------------
    def modifier(self, utilisateur_id: UUID, donnees: dict) -> Preference:
        """Un champ absent de `donnees` n'est pas touché, un champ à None est effacé.
        Lève ValidationError (valeur invalide), AeroportInconnuError (venue du DAO),
        ConsentementLocalisationRequisError (403) ou UtilisateurIntrouvableError."""
        maj = self._construire_maj(donnees)

        # Le consentement n'est exigé que pour ÉCRIRE un lieu ; l'effacer reste toujours permis.
        if maj.latitude_depart is not ND and maj.latitude_depart is not None:
            self._verifier_consentement_localisation(utilisateur_id)

        try:
            return self.preference_dao.upsert(utilisateur_id, maj)
        except ValueError:
            # Le DAO lève ValueError si la clé étrangère utilisateurs est violée.
            raise UtilisateurIntrouvableError("Utilisateur introuvable.")

    def supprimer_lieu_depart(self, utilisateur_id: UUID) -> Preference:
        """Efface latitude/longitude et garde le reste. Idempotent : sans ligne,
        renvoie des préférences vides."""
        preference = self.preference_dao.supprimer_lieu_depart(utilisateur_id)
        return preference if preference is not None else Preference.vide(utilisateur_id)
    
    def enregistrer_onboarding(self, utilisateur_id: UUID, donnees: dict) -> Preference:
        """Page de préférences après la première connexion. Ne se fait qu'une fois :
        un corps vide (« Passer ») crée la ligne vide. Dans tous les cas, l'onboarding
        est marqué terminé. Lève OnboardingDejaTermineError (409) s'il l'est déjà."""
        utilisateur = self.utilisateur_dao.find_by_id(utilisateur_id)
        if utilisateur is None:
            raise UtilisateurIntrouvableError("Utilisateur introuvable.")
        if utilisateur.onboarding_termine:
            raise OnboardingDejaTermineError()

        preference = self.modifier(utilisateur_id, donnees)
        self.utilisateur_dao.marquer_onboarding_termine(utilisateur_id)
        return preference
    # ------------------------------------------------------------------
    # Helpers internes
    # ------------------------------------------------------------------
    @staticmethod
    def _construire_maj(donnees: dict) -> MiseAJourPreferences:
        champs = {nom: donnees[nom] for nom in CHAMPS_MODIFIABLES if nom in donnees}
        try:
            return MiseAJourPreferences(**champs)
        except PreferenceInvalide as erreur:
            raise ValidationError({"preferences": [str(erreur)]})

    def _verifier_consentement_localisation(self, utilisateur_id: UUID) -> None:
        consentements = self.utilisateur_dao.find_consentements(utilisateur_id)
        if not consentements.get("localisation", False):
            raise ConsentementLocalisationRequisError()