from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from app.models.preference.Preference import MiseAJourPreferences, Preference


class PreferenceInterface(ABC):
    """Accès à la table preferences_utilisateur (une ligne par utilisateur).

    Ne gère ni onboarding_termine (UtilisateurInterface.marquer_onboarding_termine)
    ni les consentements (UtilisateurInterface.find_consentements) : le service
    combine les deux DAO. Le lieu de départ (latitude/longitude) passe par upsert,
    comme les autres colonnes.
    """

    @abstractmethod
    def find_by_utilisateur(self, utilisateur_id: UUID) -> Optional[Preference]:
        """None si l'utilisateur n'a jamais enregistré de préférences (aucune ligne).
        Le service renvoie alors Preference.vide(utilisateur_id)."""

    @abstractmethod
    def upsert(self, utilisateur_id: UUID, maj: MiseAJourPreferences) -> Preference:
        """INSERT ... ON CONFLICT (utilisateur_id) DO UPDATE, limité aux colonnes
        de maj.colonnes() (un champ ND n'est pas touché, un champ None est effacé).
        Les noms de colonnes viennent de MiseAJourPreferences, jamais d'une saisie
        utilisateur ; les valeurs sont toujours passées en paramètres %s.
        Si maj.est_vide : INSERT ... ON CONFLICT DO NOTHING (crée la ligne vide).
        Une seule requête (RETURNING) dans UN seul get_db_cursor(commit=True),
        puis renvoie la ligne résultante.
        Lève AeroportInconnuError (app.utils.exceptions) si aeroport_habituel
        viole la clé étrangère vers aeroports (code IATA inexistant)."""

    @abstractmethod
    def supprimer_lieu_depart(self, utilisateur_id: UUID) -> Optional[Preference]:
        """latitude_depart = NULL et longitude_depart = NULL (US25). Les autres
        préférences sont conservées. None si l'utilisateur n'a aucune ligne
        (rien à supprimer)."""