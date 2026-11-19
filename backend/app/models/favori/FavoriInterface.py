from abc import ABC, abstractmethod
from uuid import UUID

from app.models.vol.Vol import Vol


class FavoriInterface(ABC):

    @abstractmethod
    def lister(self, utilisateur_id: UUID, limite: int, decalage: int) -> list[Vol]:
        """Vols favoris de l'utilisateur, du plus récent au plus ancien."""

    @abstractmethod
    def ajouter(self, utilisateur_id: UUID, vol_id: UUID, journaliser: bool) -> bool:
        """INSERT ... ON CONFLICT DO NOTHING : idempotent. Renvoie True si le favori
        vient d'être créé, False s'il existait déjà. Si `journaliser` est vrai ET que
        le favori est nouveau, ajoute une ligne 'favori' dans interactions, dans la
        MÊME transaction. Lève VolIntrouvableError si le vol n'existe pas."""

    @abstractmethod
    def retirer(self, utilisateur_id: UUID, vol_id: UUID) -> bool:
        """Idempotent. Supprime le favori et ses lignes 'favori' dans interactions
        (même transaction). Renvoie True si un favori a été supprimé."""