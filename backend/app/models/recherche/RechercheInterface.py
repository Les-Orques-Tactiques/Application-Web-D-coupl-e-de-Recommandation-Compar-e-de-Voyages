# app/models/recherche/RechercheInterface.py
from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from app.models.recherche.Recherche import Recherche
from app.models.vol.CriteresRecherche import CriteresRecherche


class RechercheInterface(ABC):

    @abstractmethod
    def enregistrer(self, utilisateur_id: UUID, criteres: CriteresRecherche) -> Recherche:
        """Enregistre une recherche dans l'historique (US14) et renvoie la ligne créée
        (RETURNING). Les colonnes viennent de Recherche.colonnes_depuis_criteres ;
        autres_criteres est adapté en JSONB (psycopg2.extras.Json). Les valeurs
        passent toujours en paramètres (%s).
        Lève ValueError si la clé étrangère utilisateurs est violée (comme
        PreferenceInterface.upsert), le service la traduit en UtilisateurIntrouvableError."""

    @abstractmethod
    def lister_par_utilisateur(
        self, utilisateur_id: UUID, limite: int = 20, decalage: int = 0
    ) -> list[Recherche]:
        """Historique d'un utilisateur, du plus récent au plus ancien (US14, US19),
        avec pagination. ville_destination vient de la jointure sur aeroports
        (LEFT JOIN : la recherche reste listée si l'aéroport a été supprimé).
        Renvoie [] si l'historique est vide."""

    @abstractmethod
    def find_by_id(self, recherche_id: UUID, utilisateur_id: UUID) -> Optional[Recherche]:
        """Une recherche par son id, SEULEMENT si elle appartient à l'utilisateur
        (WHERE id = %s AND utilisateur_id = %s). None si inconnue ou si elle
        appartient à quelqu'un d'autre : on ne révèle pas son existence.
        Sert à relancer une ancienne recherche (US14)."""

    @abstractmethod
    def supprimer(self, recherche_id: UUID, utilisateur_id: UUID) -> bool:
        """Supprime une recherche de l'historique (US19), avec le même filtre sur
        l'utilisateur. Renvoie True si une ligne a été supprimée, False sinon
        (idempotent : pas d'erreur si elle n'existe plus).
        Les interactions liées gardent leur ligne (recherche_id passe à NULL)."""

    @abstractmethod
    def vider_historique(self, utilisateur_id: UUID) -> int:
        """Supprime tout l'historique de l'utilisateur et renvoie le nombre de lignes
        supprimées (US19, droit à l'effacement)."""