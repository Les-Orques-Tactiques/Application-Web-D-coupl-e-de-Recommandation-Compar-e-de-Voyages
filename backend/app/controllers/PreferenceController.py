from fastapi import APIRouter, Depends, Request

from app.utils.limiter import limiter
from app.models.utilisateur.Utilisateur import Utilisateur
from app.utils.auth import get_current_utilisateur
from app.utils.dependencies import preference_service
from app.models.preference.PreferenceSchema import (
    LieuDepartUpdate,
    PreferencesOnboarding,
    PreferencesOut,
    PreferencesUpdate,
)


class PreferenceController:

    def __init__(self):
        self.router = APIRouter(prefix="/utilisateurs/moi/preferences", tags=["Préférences"])
        # Service partagé, assemblé une seule fois dans app/utils/dependencies.py.
        self.preference_service = preference_service
        self._register_routes()

    # ------------------------------------------------------------------
    # Routes
    # Aucun try/except ici : AeroportInconnuError (400), ConsentementLocalisationRequisError
    # (403), UtilisateurIntrouvableError (404)… sont catchées par les handlers globaux.
    # Routes en `def` : psycopg2 est synchrone, FastAPI les exécute dans un thread.
    # ------------------------------------------------------------------
    def _register_routes(self):

        @limiter.limit("30/minute")
        def lire_preferences(
            request: Request,
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            return self.preference_service.lire(utilisateur.id)

        @limiter.limit("20/minute")
        def modifier_preferences(
            request: Request,
            payload: PreferencesUpdate,
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            # exclude_unset : un champ absent n'est pas touché, un champ à null est effacé
            return self.preference_service.modifier(
                utilisateur.id, payload.model_dump(exclude_unset=True)
            )

        @limiter.limit("10/minute")
        def enregistrer_onboarding(
            request: Request,
            payload: PreferencesOnboarding,
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            # Corps vide {} autorisé : bouton « Passer »
            return self.preference_service.enregistrer_onboarding(
                utilisateur.id, payload.model_dump(exclude_unset=True)
            )

        @limiter.limit("20/minute")
        def modifier_lieu_depart(
            request: Request,
            payload: LieuDepartUpdate,
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            # Le service exige le consentement « localisation » (403 sinon)
            return self.preference_service.modifier(
                utilisateur.id,
                {"latitude_depart": payload.latitude, "longitude_depart": payload.longitude},
            )

        @limiter.limit("20/minute")
        def supprimer_lieu_depart(
            request: Request,
            utilisateur: Utilisateur = Depends(get_current_utilisateur),
        ):
            return self.preference_service.supprimer_lieu_depart(utilisateur.id)

        # ---- routes ----

        self.router.add_api_route(
            "", lire_preferences, methods=["GET"],
            response_model=PreferencesOut,
        )
        self.router.add_api_route(
            "", modifier_preferences, methods=["PATCH"],
            response_model=PreferencesOut,
        )
        self.router.add_api_route(
            "/onboarding", enregistrer_onboarding, methods=["POST"],
            response_model=PreferencesOut,
        )
        self.router.add_api_route(
            "/lieu-depart", modifier_lieu_depart, methods=["PUT"],
            response_model=PreferencesOut,
        )
        self.router.add_api_route(
            "/lieu-depart", supprimer_lieu_depart, methods=["DELETE"],
            response_model=PreferencesOut,
        )


ctrl = PreferenceController()