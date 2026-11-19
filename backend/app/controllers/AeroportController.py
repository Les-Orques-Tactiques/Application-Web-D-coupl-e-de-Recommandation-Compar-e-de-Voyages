from fastapi import APIRouter, Depends, Request

from app.models.aeroport.AeroportSchema import AeroportOut, PositionIn, RechercheAeroport
from app.models.utilisateur.Utilisateur import Utilisateur
from app.utils.auth import get_current_utilisateur
from app.utils.dependencies import aeroport_service
from app.utils.exceptions import AeroportIntrouvableError
from app.utils.limiter import limiter


class AeroportController:

    def __init__(self):
        self.router = APIRouter(prefix="/aeroports", tags=["Référentiel"])
        self.aeroport_service = aeroport_service
        self._register_routes()

    # Attention à l'ordre d'enregistrement : les routes fixes (/destinations,
    # /plus-proche) doivent précéder /{code_iata}, sinon elles seraient prises pour un code.
    def _register_routes(self):

        @limiter.limit("60/minute")
        def rechercher_aeroports(request: Request, params: RechercheAeroport = Depends()):
            aeroports = self.aeroport_service.rechercher(params.q, params.limite)
            return [a.to_public_dict() for a in aeroports]

        @limiter.limit("20/minute")
        def lister_destinations(request: Request):
            return [a.to_public_dict() for a in self.aeroport_service.lister_destinations()]

        @limiter.limit("20/minute")
        def plus_proche(
            request: Request,
            position: PositionIn = Depends(),
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            aeroport = self.aeroport_service.plus_proche(position.latitude, position.longitude)
            if aeroport is None:
                raise AeroportIntrouvableError("Aucun aéroport à proximité.")
            return aeroport.to_public_dict()

        @limiter.limit("60/minute")
        def lire_aeroport(request: Request, code_iata: str):
            return self.aeroport_service.lire(code_iata).to_public_dict()

        self.router.add_api_route("", rechercher_aeroports, methods=["GET"],
                                  response_model=list[AeroportOut])
        self.router.add_api_route("/destinations", lister_destinations, methods=["GET"],
                                  response_model=list[AeroportOut])
        self.router.add_api_route("/plus-proche", plus_proche, methods=["GET"],
                                  response_model=AeroportOut)
        self.router.add_api_route("/{code_iata}", lire_aeroport, methods=["GET"],
                                  response_model=AeroportOut)


ctrl = AeroportController()