from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, Response

from app.models.recherche.RechercheSchema import RechercheOut
from app.models.utilisateur.Utilisateur import Utilisateur
from app.models.vol.VolSchema import VolOut
from app.utils.auth import get_current_utilisateur
from app.utils.dependencies import recherche_service
from app.utils.limiter import limiter


class RechercheController:

    def __init__(self):
        self.router = APIRouter(prefix="/utilisateurs/moi/recherches", tags=["Historique"])
        self.recherche_service = recherche_service
        self._register_routes()

    # RechercheIntrouvableError (404) est catchée par les handlers globaux : une
    # recherche d'un autre utilisateur donne le même 404 qu'une recherche inexistante.
    def _register_routes(self):

        @limiter.limit("30/minute")
        def lister_recherches(
            request: Request,
            limite: int = Query(20, ge=1, le=50),
            decalage: int = Query(0, ge=0),
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            recherches = self.recherche_service.lister(utilisateur.id, limite, decalage)
            return [r.to_public_dict() for r in recherches]

        @limiter.limit("20/minute")
        def relancer_recherche(
            request: Request,
            recherche_id: UUID,
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            vols = self.recherche_service.relancer(utilisateur.id, recherche_id)
            return [v.to_public_dict() for v in vols]

        @limiter.limit("20/minute")
        def supprimer_recherche(
            request: Request,
            recherche_id: UUID,
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            self.recherche_service.supprimer(utilisateur.id, recherche_id)
            return Response(status_code=204)

        @limiter.limit("5/minute")
        def vider_historique(
            request: Request,
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            return {"supprimees": self.recherche_service.vider_historique(utilisateur.id)}

        self.router.add_api_route("", lister_recherches, methods=["GET"],
                                  response_model=list[RechercheOut])
        self.router.add_api_route("/{recherche_id}/relancer", relancer_recherche,
                                  methods=["POST"], response_model=list[VolOut])
        self.router.add_api_route("/{recherche_id}", supprimer_recherche,
                                  methods=["DELETE"], status_code=204)
        self.router.add_api_route("", vider_historique, methods=["DELETE"])


ctrl = RechercheController()