from fastapi import APIRouter, Request

from app.models.aeroport.AeroportSchema import PaysOut  # adapte le chemin à ton fichier de schémas
from app.utils.dependencies import pays_service
from app.utils.limiter import limiter


class PaysController:

    def __init__(self):
        self.router = APIRouter(prefix="/pays", tags=["Référentiel"])
        self.pays_service = pays_service
        self._register_routes()

    # PaysIntrouvableError (404) est catchée par les handlers globaux.
    def _register_routes(self):

        @limiter.limit("60/minute")
        def lister_pays(request: Request):
            return self.pays_service.lister()

        @limiter.limit("60/minute")
        def lire_pays(request: Request, code_pays: str):
            return self.pays_service.lire(code_pays)

        self.router.add_api_route("", lister_pays, methods=["GET"], response_model=list[PaysOut])
        self.router.add_api_route("/{code_pays}", lire_pays, methods=["GET"], response_model=PaysOut)


ctrl = PaysController()