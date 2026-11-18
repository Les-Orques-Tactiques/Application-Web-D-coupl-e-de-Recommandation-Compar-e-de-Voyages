from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.models.recherche.RechercheSchema import RechercheVolsIn
from app.models.utilisateur.Utilisateur import Utilisateur
from app.models.vol.VolSchema import VolOut
from app.utils.auth import get_current_utilisateur
from app.utils.dependencies import recherche_service, vol_service
from app.utils.limiter import limiter


class VolController:

    def __init__(self):
        self.router = APIRouter(prefix="/vols", tags=["Vols"])
        self.vol_service = vol_service
        self.recherche_service = recherche_service
        self._register_routes()

    def _register_routes(self):

        @limiter.limit("30/minute")
        def rechercher_vols(
            request: Request,
            payload: RechercheVolsIn,
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            # model_dump() SANS exclude_unset : les défauts du schéma (aller_retour,
            # tolérance, tri) doivent être transmis. La recherche est aussi enregistrée
            # dans l'historique de l'utilisateur.
            vols = self.recherche_service.rechercher(utilisateur.id, payload.model_dump())
            return [v.to_public_dict() for v in vols]

        @limiter.limit("60/minute")
        def lire_vol(
            request: Request,
            vol_id: UUID,
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            return self.vol_service.lire(vol_id).to_public_dict()

        self.router.add_api_route("/recherche", rechercher_vols, methods=["POST"],
                                  response_model=list[VolOut])
        self.router.add_api_route("/{vol_id}", lire_vol, methods=["GET"],
                                  response_model=VolOut)


ctrl = VolController()