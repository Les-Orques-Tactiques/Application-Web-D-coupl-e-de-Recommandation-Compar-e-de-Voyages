from fastapi import APIRouter, Depends, Query, Request
from pydantic import Field

from app.models.utilisateur.Utilisateur import Utilisateur
from app.models.vol.VolSchema import VolOut
from app.utils.auth import get_current_utilisateur
from app.utils.dependencies import recommandation_service
from app.utils.limiter import limiter


class RecommandationOut(VolOut):
    rang: int = Field(ge=1)
    score: float = Field(ge=0, le=1)
    explication: str | None = None


class RecommandationController:
    def __init__(self):
        self.router = APIRouter(
            prefix="/recommandations",
            tags=["Recommandations"],
        )
        self._register_routes()

    def _register_routes(self):
        @limiter.limit("30/minute")
        def accueil(
            request: Request,
            limite: int = Query(6, ge=1, le=12),
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            recommandations = recommandation_service.recommander_accueil(
                utilisateur.id, limite
            )
            return [r.to_public_dict() for r in recommandations]

        self.router.add_api_route(
            "", accueil, methods=["GET"],
            response_model=list[RecommandationOut],
        )


ctrl = RecommandationController()
