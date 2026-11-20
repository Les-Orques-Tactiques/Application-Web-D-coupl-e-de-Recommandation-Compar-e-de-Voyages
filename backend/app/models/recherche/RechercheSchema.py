# app/models/recherche/RechercheSchema.py
"""
Schémas Pydantic : module Recherche de vols.
Entrée : critères de recherche. Sortie : historique (table recherches).
Les résultats d'une recherche sont des VolOut (app/models/vol/VolSchema.py).
"""
import re
from datetime import date, datetime
from typing import Any, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# ----------------------------------------------------------------------------
# Entrée : POST /vols/recherche (corps JSON, car la liste de compagnies
# s'exprime mal en paramètres d'URL)
# ----------------------------------------------------------------------------
class RechercheVolsIn(BaseModel):
    origine: str = Field(..., min_length=3, max_length=3)
    destination: str = Field(..., min_length=3, max_length=3)
    date_depart: date
    aller_retour: bool = True
    date_retour: Optional[date] = None
    pays_destination: Optional[str] = Field(None, min_length=2, max_length=2)
    ville_destination: Optional[str] = Field(None, max_length=100)
    passagers: int = Field(1, ge=1, le=9)
    budget: Optional[float] = Field(None, ge=0, lt=10**8)   # par personne
    escales_max: Optional[int] = Field(None, ge=0, le=5)
    compagnies: list[str] = Field(default_factory=list, max_length=20)
    duree_max_min: Optional[int] = Field(None, ge=1, le=7 * 24 * 60)
    tolerance_jours: int = Field(7, ge=0, le=14)
    tri: Literal["prix", "duree", "escales", "pertinence"] = "prix"
    limite: int = Field(50, ge=1, le=100)
    decalage: int = Field(0, ge=0)

    @field_validator("origine", "destination")
    @classmethod
    def code_iata(cls, v: str) -> str:
        v = v.strip().upper()
        if not re.fullmatch(r"[A-Z]{3}", v):
            raise ValueError("Le code aéroport doit contenir 3 lettres (code IATA).")
        return v

    @field_validator("compagnies")
    @classmethod
    def nettoyer_compagnies(cls, v: list[str]) -> list[str]:
        propres = [" ".join(c.split()) for c in v]
        if any(len(c) > 120 for c in propres):
            raise ValueError("Un nom de compagnie dépasse 120 caractères.")
        return [c for c in propres if c]

    @model_validator(mode="after")
    def coherence_dates(self) -> "RechercheVolsIn":
        if self.date_depart < date.today():
            raise ValueError("La date de départ ne peut pas être dans le passé.")
        if self.aller_retour and self.date_retour is None:
            raise ValueError("La date de retour est requise pour un aller-retour.")
        if self.date_retour is not None and self.date_retour < self.date_depart:
            raise ValueError("Le retour doit suivre le départ.")
        return self


# ----------------------------------------------------------------------------
# Sortie : historique des recherches (US14, US19)
# ----------------------------------------------------------------------------
class RechercheOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    origine: Optional[str] = None
    destination: Optional[str] = None
    pays_destination: Optional[str] = None
    ville_destination: Optional[str] = None
    date_depart: Optional[date] = None
    date_retour: Optional[date] = None
    aller_retour: bool
    nb_passagers: int
    budget_max: Optional[float] = None
    autres_criteres: dict[str, Any] = Field(default_factory=dict)
    relancable: bool                   # False si un aéroport a été supprimé
    cree_le: Optional[datetime] = None