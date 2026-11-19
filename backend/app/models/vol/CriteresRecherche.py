# app/models/vol/CriteresRecherche.py
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Optional


class CriteresInvalides(ValueError):
    """Critères de recherche incorrects (le service la traduit en ValidationError)."""


TRIS_AUTORISES = ("prix", "duree", "escales", "pertinence")


@dataclass(frozen=True)
class CriteresRecherche:
    origine: str
    destination: str
    date_depart: date
    pays_destination: Optional[str] = None
    ville_destination: Optional[str] = None
    aller_retour: bool = False
    date_retour: Optional[date] = None
    passagers: int = 1
    budget: Optional[float] = None
    escales_max: Optional[int] = None
    compagnies: tuple[str, ...] = ()
    bagage_inclus: Optional[bool] = None
    duree_max_min: Optional[int] = None
    tolerance_jours: int = 0
    tri: str = "prix"
    limite: int = 50
    decalage: int = 0   # pagination (OFFSET)

    def __post_init__(self) -> None:
        # Normalisation des codes IATA
        object.__setattr__(self, "origine", self.origine.strip().upper())
        object.__setattr__(self, "destination", self.destination.strip().upper())
        
        if self.pays_destination:
            object.__setattr__(
                self,
                "pays_destination",
                self.pays_destination.strip()
            )

        if self.ville_destination:
            object.__setattr__(
                self,
                "ville_destination",
                self.ville_destination.strip()
            )
        if self.origine == self.destination:
            raise CriteresInvalides("L'origine et la destination doivent être différentes.")
        if self.aller_retour and self.date_retour is None:
            raise CriteresInvalides("La date de retour est obligatoire pour un aller-retour.")
        if self.date_retour and self.date_retour < self.date_depart:
            raise CriteresInvalides("Le retour ne peut pas précéder le départ.")
        if not (1 <= self.passagers <= 9):
            raise CriteresInvalides("Le nombre de passagers doit être entre 1 et 9.")
        if self.tri not in TRIS_AUTORISES:
            raise CriteresInvalides("Tri inconnu.")
        if not (1 <= self.limite <= 100) or self.decalage < 0:
            raise CriteresInvalides("Pagination invalide.")
        if not (0 <= self.tolerance_jours <= 14):
            raise CriteresInvalides("La tolérance doit être entre 0 et 14 jours.")