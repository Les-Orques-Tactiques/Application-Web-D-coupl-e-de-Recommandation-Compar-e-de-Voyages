from typing import Optional
from uuid import UUID

from app.models.interaction.InteractionInterface import InteractionInterface
from app.models.utilisateur.UtilisateurInterface import UtilisateurInterface

# Une même vue n'est comptée qu'une fois par période : recharger la fiche
# d'un vol dix fois ne doit pas lui donner dix fois plus de poids.
DELAI_ENTRE_DEUX_VUES_MIN = 30


class InteractionService:
    """
    Avis (US17) et journal des interactions (US22).

    RGPD : comme pour les favoris, l'avis est toujours enregistré (c'est une donnée
    que l'utilisateur voit et gère), mais le journal qui sert à la recommandation
    n'est alimenté que si le consentement « personnalisation » est accordé.
    """

    def __init__(self, interaction_dao: InteractionInterface,
                 utilisateur_dao: UtilisateurInterface):
        self.interaction_dao = interaction_dao
        self.utilisateur_dao = utilisateur_dao

    def _personnalisation_acceptee(self, utilisateur_id: UUID) -> bool:
        return self.utilisateur_dao.find_consentements(utilisateur_id)["personnalisation"]

    def lire_avis(self, utilisateur_id: UUID, vol_id: UUID) -> Optional[bool]:
        return self.interaction_dao.lire_avis(utilisateur_id, vol_id)

    def donner_avis(self, utilisateur_id: UUID, vol_id: UUID, pertinent: bool) -> None:
        self.interaction_dao.donner_avis(
            utilisateur_id, vol_id, pertinent,
            journaliser=self._personnalisation_acceptee(utilisateur_id),
        )

    def retirer_avis(self, utilisateur_id: UUID, vol_id: UUID) -> None:
        self.interaction_dao.retirer_avis(utilisateur_id, vol_id)

    def enregistrer(self, utilisateur_id: UUID, vol_id: UUID, type_interaction: str) -> bool:
        """Journalise une vue ou un clic « Réserver ».
        Sans consentement, rien n'est enregistré (et ce n'est pas une erreur)."""
        if not self._personnalisation_acceptee(utilisateur_id):
            return False
        delai = DELAI_ENTRE_DEUX_VUES_MIN if type_interaction == "vue" else 0
        return self.interaction_dao.journaliser(utilisateur_id, vol_id, type_interaction, delai)
    
    def lister_avis(self, utilisateur_id: UUID) -> dict[UUID, bool]:
        return self.interaction_dao.lister_avis(utilisateur_id)