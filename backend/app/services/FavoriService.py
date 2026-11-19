from uuid import UUID

from app.models.favori.FavoriInterface import FavoriInterface
from app.models.utilisateur.UtilisateurInterface import UtilisateurInterface
from app.models.vol.Vol import Vol


class FavoriService:

    def __init__(self, favori_dao: FavoriInterface, utilisateur_dao: UtilisateurInterface):
        self.favori_dao = favori_dao
        self.utilisateur_dao = utilisateur_dao

    def lister(self, utilisateur_id: UUID, limite: int, decalage: int) -> list[Vol]:
        return self.favori_dao.lister(utilisateur_id, limite, decalage)

    def ajouter(self, utilisateur_id: UUID, vol_id: UUID) -> None:
        # Le favori est toujours enregistré ; il n'alimente le profil de
        # recommandation (table interactions) qu'avec le consentement « personnalisation ».
        consentements = self.utilisateur_dao.find_consentements(utilisateur_id)
        self.favori_dao.ajouter(utilisateur_id, vol_id, journaliser=consentements["personnalisation"])

    def retirer(self, utilisateur_id: UUID, vol_id: UUID) -> None:
        self.favori_dao.retirer(utilisateur_id, vol_id)