from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, Response

from app.models.utilisateur.Utilisateur import Utilisateur
from app.models.vol.VolSchema import VolOut
from app.utils.auth import get_current_utilisateur
from app.utils.dependencies import favori_service
from app.utils.limiter import limiter


class FavoriController:

    def __init__(self):
        self.router = APIRouter(prefix="/utilisateurs/moi/favoris", tags=["Favoris"])
        self.favori_service = favori_service
        self._register_routes()

    # VolIntrouvableError (404) est catchée par les handlers globaux.
    # Ajouter et retirer sont idempotents : rejouer une requête ne produit pas d'erreur.
    def _register_routes(self):

        @limiter.limit("30/minute")
        def lister_favoris(
            request: Request,
            limite: int = Query(50, ge=1, le=100),
            decalage: int = Query(0, ge=0),
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            vols = self.favori_service.lister(utilisateur.id, limite, decalage)
            return [v.to_public_dict() for v in vols]

        @limiter.limit("60/minute")
        def ajouter_favori(
            request: Request,
            vol_id: UUID,
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            self.favori_service.ajouter(utilisateur.id, vol_id)
            return Response(status_code=204)

        @limiter.limit("60/minute")
        def retirer_favori(
            request: Request,
            vol_id: UUID,
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            self.favori_service.retirer(utilisateur.id, vol_id)
            return Response(status_code=204)

        self.router.add_api_route("", lister_favoris, methods=["GET"],
                                  response_model=list[VolOut])
        self.router.add_api_route("/{vol_id}", ajouter_favori, methods=["POST"],
                                  status_code=204)
        self.router.add_api_route("/{vol_id}", retirer_favori, methods=["DELETE"],
                                  status_code=204)


ctrl = FavoriController()