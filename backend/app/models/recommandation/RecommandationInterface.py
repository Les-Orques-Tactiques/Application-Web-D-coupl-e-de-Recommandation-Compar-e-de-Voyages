# app/models/recommandation/RecommandationInterface.py
from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID
from app.models.vol.Vol import Vol


from app.models.recommandation.Recommandation import Recommandation
from app.models.vol.CriteresRecherche import CriteresRecherche


class RecommandationInterface(ABC):

    @abstractmethod
    def classer_par_similarite(
        self, criteres: CriteresRecherche, embedding: list[float]
    ) -> list[Recommandation]:
        """Vols filtrés par les critères, classés par similarité cosinus avec
        `embedding` (approche A), du plus proche au plus éloigné. Ignore les vols
        sans embedding. Les rangs commencent à 1 ; l'explication est vide."""

    @abstractmethod
    def enregistrer(
        self,
        approche: str,
        duree_ms: float,
        resultats: list[Recommandation],
        utilisateur_id: Optional[UUID] = None,
        recherche_id: Optional[UUID] = None,
    ) -> UUID:
        """Écrit l'exécution (executions_recommandation) et ses résultats
        (resultats_recommandation) dans la MÊME transaction. Renvoie l'id de l'exécution.""" 

    @abstractmethod
    def lister_candidats_accueil(
        self,
        origine: Optional[str],
        devise: str,
    ) -> list[Vol]:
        """Aller-retour encore à venir, sans destination imposée."""
    
    @abstractmethod
    def moyenne_embedding(self) -> Optional[list[float]]:
        """Vecteur moyen des embeddings du catalogue, ou None si aucun vol n'en a."""
    
    @abstractmethod
    def profil_depuis_interactions(self, utilisateur_id: UUID) -> Optional[list[float]]:
        """Profil de l'utilisateur : moyenne pondérée des embeddings des vols
        favoris, jugés pertinents ou réservés, éloignée des vols jugés non pertinents.
        None s'il n'y a aucune interaction positive."""