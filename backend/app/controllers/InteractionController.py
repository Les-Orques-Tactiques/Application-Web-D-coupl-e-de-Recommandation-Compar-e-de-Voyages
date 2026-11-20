from uuid import UUID

from fastapi import APIRouter, Depends, Request, Response

from app.models.interaction.InteractionSchema import AvisIn, AvisOut, AvisVolOut, InteractionIn
from app.models.utilisateur.Utilisateur import Utilisateur
from app.utils.auth import get_current_utilisateur
from app.utils.dependencies import interaction_service
from app.utils.limiter import limiter


class InteractionController:
    """
    Routes des avis (US17) et du journal des interactions (US22).

    - GET    /api/utilisateurs/moi/avis/{vol_id}   avis actuel (ou null)
    - PUT    /api/utilisateurs/moi/avis/{vol_id}   donner / changer son avis
    - DELETE /api/utilisateurs/moi/avis/{vol_id}   retirer son avis
    - POST   /api/utilisateurs/moi/interactions    journaliser une vue ou un clic « Réserver »

    VolIntrouvableError (404) est catchée par les handlers globaux.
    """

    def __init__(self):
        self.router = APIRouter(prefix="/utilisateurs/moi", tags=["Interactions"])
        self.interaction_service = interaction_service
        self._register_routes()

    def _register_routes(self):

        @limiter.limit("60/minute")
        def lire_avis(
            request: Request,
            vol_id: UUID,
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            return AvisOut(pertinent=self.interaction_service.lire_avis(utilisateur.id, vol_id))
        
        @limiter.limit("60/minute")
        def lister_avis(
            request: Request,
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            avis = self.interaction_service.lister_avis(utilisateur.id)
            return [AvisVolOut(vol_id=v, pertinent=p) for v, p in avis.items()]
       
        @limiter.limit("60/minute")
        def donner_avis(
            request: Request,
            vol_id: UUID,
            corps: AvisIn,
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            self.interaction_service.donner_avis(utilisateur.id, vol_id, corps.pertinent)
            return Response(status_code=204)

        @limiter.limit("60/minute")
        def retirer_avis(
            request: Request,
            vol_id: UUID,
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            self.interaction_service.retirer_avis(utilisateur.id, vol_id)
            return Response(status_code=204)

        @limiter.limit("120/minute")
        def enregistrer_interaction(
            request: Request,
            corps: InteractionIn,
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            # Toujours 204, même sans consentement : le front n'a pas à savoir
            # si la ligne a été journalisée ou non.
            self.interaction_service.enregistrer(utilisateur.id, corps.vol_id, corps.type)
            return Response(status_code=204)

        self.router.add_api_route("/avis/{vol_id}", lire_avis, methods=["GET"],
                                  response_model=AvisOut)
        self.router.add_api_route("/avis/{vol_id}", donner_avis, methods=["PUT"],
                                  status_code=204)
        self.router.add_api_route("/avis/{vol_id}", retirer_avis, methods=["DELETE"],
                                  status_code=204)
        self.router.add_api_route("/interactions", enregistrer_interaction, methods=["POST"],
                                  status_code=204)
        self.router.add_api_route("/avis", lister_avis, methods=["GET"],
                                  response_model=list[AvisVolOut])


ctrl = InteractionController()
