# app/models/vol/VolInterface.py
from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from app.models.vol.CriteresRecherche import CriteresRecherche
from app.models.vol.Vol import Vol


class VolInterface(ABC):

    @abstractmethod
    def rechercher(self, criteres: CriteresRecherche) -> list[Vol]:
        """Vols correspondant aux critères de recherche (US9, US12). Filtre sur la route,
        le type de trajet, la date de départ (± tolerance_jours, jamais dans le passé),
        la date de retour pour un aller-retour, le budget PAR PERSONNE (prix <= budget),
        les escales, la durée et les compagnies.
        `tri` est choisi dans une liste blanche (prix, duree, escales, pertinence) : jamais
        injecté tel quel dans le SQL. Toutes les valeurs passent en paramètres (%s).
        Renvoie [] si rien ne correspond."""

    @abstractmethod
    def find_by_id(self, vol_id: UUID) -> Optional[Vol]:
        """Un vol par son id, avec villes et horaires de l'aller (fiche d'un vol, US20).
        None si inconnu."""

    @abstractmethod
    def lister_sans_embedding(self, limite: int = 1000) -> list[Vol]:
        """Vols dont l'embedding (approche A) n'est pas encore calculé, par lots de
        `limite`. Liste vide quand tout est calculé."""

    @abstractmethod
    def ecrire_embeddings(self, embeddings: dict[UUID, list[float]]) -> int:
        """Écrit plusieurs embeddings dans une seule transaction. Renvoie le nombre
        de vols mis à jour."""
    
    @abstractmethod
    def lister_compagnies(self) -> list[str]:
        """Noms des compagnies présentes dans les vols (aller et retour), sans doublon, triés."""