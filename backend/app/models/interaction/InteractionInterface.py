from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID


class InteractionInterface(ABC):
    """
    Accès aux données des avis (table avis_vol, US17) et du journal
    des interactions (table interactions, US22).

    Le journal alimente l'approche B (filtrage collaboratif) : chaque type
    d'interaction a un poids calculé par la base (colonne générée `poids`).
    """

    @abstractmethod
    def lire_avis(self, utilisateur_id: UUID, vol_id: UUID) -> Optional[bool]:
        """Avis de l'utilisateur sur ce vol : True (pertinent), False (pas pertinent)
        ou None s'il n'a pas donné d'avis."""

    @abstractmethod
    def donner_avis(self, utilisateur_id: UUID, vol_id: UUID,
                    pertinent: bool, journaliser: bool) -> None:
        """Crée ou remplace l'avis (UPSERT, donc idempotent).
        Si `journaliser` est vrai, remplace aussi l'ancienne ligne d'avis du
        journal par la nouvelle, dans la MÊME transaction.
        Lève VolIntrouvableError si le vol n'existe pas."""

    @abstractmethod
    def retirer_avis(self, utilisateur_id: UUID, vol_id: UUID) -> bool:
        """Idempotent. Supprime l'avis et ses lignes d'avis dans le journal.
        Renvoie True si un avis a été supprimé."""

    @abstractmethod
    def journaliser(self, utilisateur_id: UUID, vol_id: UUID, type_interaction: str,
                    delai_minutes: int = 0) -> bool:
        """Ajoute une ligne au journal. Si `delai_minutes` > 0, n'ajoute rien quand
        la même interaction existe déjà dans ce délai (anti-doublon pour les vues).
        Renvoie True si une ligne a été ajoutée.
        Lève VolIntrouvableError si le vol n'existe pas."""
