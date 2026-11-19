# app/services/VolService.py
from uuid import UUID
from dataclasses import replace
from app.models.vol.CriteresRecherche import CriteresInvalides, CriteresRecherche
from app.models.vol.Vol import Vol
from app.models.vol.VolInterface import VolInterface
from app.services.AeroportService import AeroportService
from app.utils.exceptions import ValidationError, VolIntrouvableError

# Seuls ces champs peuvent venir du client ; toute autre clé est ignorée.
CHAMPS_RECHERCHE = (
    "origine", "destination", "date_depart", "aller_retour", "date_retour",
    "passagers", "budget", "escales_max", "compagnies", "bagage_inclus",
    "duree_max_min", "tolerance_jours", "tri", "limite", "decalage",
)


class VolService:

    def __init__(self, vol_dao: VolInterface, aeroport_service: AeroportService):
        self.vol_dao = vol_dao
        self.aeroport_service = aeroport_service

    def rechercher(self, donnees: dict) -> list[Vol]:
        """Recherche de vols (US9) sans historique (visiteur ou appel interne).
        Lève ValidationError ({champ: [messages]})."""
        return self.rechercher_criteres(self.construire_criteres(donnees))

    def rechercher_criteres(self, criteres: CriteresRecherche) -> list[Vol]:
        """Recherche à partir de critères déjà validés (aussi utilisée pour relancer
        une recherche de l'historique, US14). Vérifie que les codes IATA existent
        (une clé étrangère invalide donnerait sinon une 500), puis interroge la base.
        Lève ValidationError si un code est inconnu."""
        self.aeroport_service.verifier_codes(
            origine=criteres.origine, destination=criteres.destination
        )
        return self.vol_dao.rechercher(criteres)

    def lire(self, vol_id: UUID) -> Vol:
        """Fiche d'un vol (US20). Lève VolIntrouvableError (404) si inconnu."""
        vol = self.vol_dao.find_by_id(vol_id)
        if vol is None:
            raise VolIntrouvableError()
        return vol

    def construire_criteres(self, donnees: dict) -> CriteresRecherche:
        """Convertit les données du client en critères validés.
        Le pays et la ville sont récupérés depuis le référentiel des aéroports."""

        champs = {
            nom: donnees[nom]
            for nom in CHAMPS_RECHERCHE
            if nom in donnees
        }

        if "compagnies" in champs:
            champs["compagnies"] = tuple(champs["compagnies"] or ())

        try:
            criteres = CriteresRecherche(**champs)
        except CriteresInvalides as erreur:
            raise ValidationError({"recherche": [str(erreur)]})

        self.aeroport_service.verifier_codes(
            origine=criteres.origine
        )

        destination = self.aeroport_service.lire(criteres.destination)

        return replace(
            criteres,
            pays_destination=destination.code_pays,
            ville_destination=destination.ville
        )