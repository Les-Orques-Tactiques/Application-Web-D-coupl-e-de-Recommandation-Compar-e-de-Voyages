# app/models/vol/VolInterface.py
from abc import ABC, abstractmethod
from datetime import date
from typing import Optional

from app.models.vol.Vol import Vol
from app.models.vol.CriteresRecherche import CriteresRecherche

class VolInterface(ABC):

    @abstractmethod
    def rechercher(
        self,
        origine: str,
        destination: str,
        date_depart: date,
        aller_retour: bool,
        date_retour: Optional[date] = None,
        passagers: int = 1,
        budget: Optional[float] = None,
        tolerance_jours: int = 0,
        tri: str = "prix",
        limite: int = 50,
    ) -> list[Vol]:
        """Vols correspondant à la recherche (US9, US12). Filtre sur la route, le type
        de trajet, la date de départ (± tolerance_jours, jamais dans le passé), la
        date de retour pour un aller-retour, et le budget (prix * passagers <= budget).
        `tri` est choisi dans une liste blanche (prix, duree, escales) : jamais
        injecté tel quel dans le SQL. Toutes les valeurs passent en paramètres (%s).
        Renvoie [] si rien ne correspond."""

    @abstractmethod
    def find_by_id(self, vol_id) -> Optional[Vol]:
        """Un vol par son id, avec villes et horaires de l'aller (fiche d'un vol, US20).
        None si inconnu."""

    @abstractmethod
    def rechercher(self, criteres: CriteresRecherche) -> list[Vol]:
        """Vols correspondant aux critères de recherche (US9, US12). Filtre sur la route, le type
        de trajet, la date de départ (± tolerance_jours, jamais dans le passé), la
        date de retour pour un aller-retour, et le budget (prix * passagers <= budget).
        `tri` est choisi dans une liste blanche (prix, duree, escales) : jamais
        injecté tel quel dans le SQL. Toutes les valeurs passent en paramètres (%s).
        Renvoie [] si rien ne correspond."""