# app/services/RechercheService.py
from uuid import UUID

from app.models.recherche.Recherche import Recherche
from app.models.recherche.RechercheInterface import RechercheInterface
from app.models.vol.CriteresRecherche import CriteresRecherche
from app.models.vol.Vol import Vol
from app.services.VolService import VolService
from app.utils.exceptions import (
    RechercheIntrouvableError,
    UtilisateurIntrouvableError,
    ValidationError,
)

LIMITE_HISTORIQUE_MAX = 50


class RechercheService:

    def __init__(self, recherche_dao: RechercheInterface, vol_service: VolService):
        self.recherche_dao = recherche_dao
        self.vol_service = vol_service

    # ------------------------------------------------------------------
    # Recherche + historique
    # ------------------------------------------------------------------
    def rechercher(self, utilisateur_id: UUID, donnees: dict) -> list[Vol]:
        """Recherche de vols pour un utilisateur connecté (US9) : valide les critères,
        interroge la base, puis enregistre la recherche dans l'historique (US14).
        L'enregistrement n'a lieu qu'après une recherche valide.
        Lève ValidationError, ou UtilisateurIntrouvableError."""
        criteres = self.vol_service.construire_criteres(donnees)
        vols = self.vol_service.rechercher_criteres(criteres)
        self._enregistrer(utilisateur_id, criteres)
        return vols

    def relancer(self, utilisateur_id: UUID, recherche_id: UUID) -> list[Vol]:
        """Relance une ancienne recherche (US14). Elle n'est pas ré-enregistrée :
        l'historique ne se remplit pas de doublons. Si les dates sont passées, le
        résultat est vide (le DAO exclut les vols passés) : le front propose de
        modifier les dates.
        Lève RechercheIntrouvableError (404) ou ValidationError si non relançable."""
        recherche = self.lire(utilisateur_id, recherche_id)
        try:
            criteres = recherche.vers_criteres()
        except ValueError as erreur:  # inclut CriteresInvalides
            raise ValidationError({"recherche": [str(erreur)]})
        return self.vol_service.rechercher_criteres(criteres)

    # ------------------------------------------------------------------
    # Historique
    # ------------------------------------------------------------------
    def lister(self, utilisateur_id: UUID, limite: int = 20, decalage: int = 0) -> list[Recherche]:
        """Historique de l'utilisateur, du plus récent au plus ancien (US14, US19)."""
        return self.recherche_dao.lister_par_utilisateur(
            utilisateur_id,
            limite=min(max(limite, 1), LIMITE_HISTORIQUE_MAX),
            decalage=max(decalage, 0),
        )

    def lire(self, utilisateur_id: UUID, recherche_id: UUID) -> Recherche:
        """Une recherche de l'utilisateur. Inconnue ou appartenant à quelqu'un d'autre :
        même erreur 404, pour ne pas révéler son existence."""
        recherche = self.recherche_dao.find_by_id(recherche_id, utilisateur_id)
        if recherche is None:
            raise RechercheIntrouvableError()
        return recherche

    def supprimer(self, utilisateur_id: UUID, recherche_id: UUID) -> None:
        """Retire une recherche de l'historique (US19). Idempotent : pas d'erreur
        si elle n'existe plus."""
        self.recherche_dao.supprimer(recherche_id, utilisateur_id)

    def vider_historique(self, utilisateur_id: UUID) -> int:
        """Efface tout l'historique et renvoie le nombre de lignes supprimées (US19)."""
        return self.recherche_dao.vider_historique(utilisateur_id)

    # ------------------------------------------------------------------
    # Helpers internes
    # ------------------------------------------------------------------
    def _enregistrer(self, utilisateur_id: UUID, criteres: CriteresRecherche) -> Recherche:
        try:
            return self.recherche_dao.enregistrer(utilisateur_id, criteres)
        except ValueError:
            # Le DAO lève ValueError si la clé étrangère utilisateurs est violée.
            raise UtilisateurIntrouvableError("Utilisateur introuvable.")