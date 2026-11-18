"""
Schémas Pydantic : module Aéroport / Pays
Contrats de validation entrée/sortie pour l'API FastAPI.
Ne pas confondre avec models/aeroport/Aeroport.py et models/pays/Pays.py
(représentation interne, utilisée par le DAO/Service).
"""

import re
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ----------------------------------------------------------------------------
# Entrée : recherche d'aéroports pour l'autocomplétion (US9).
# Paramètres de requête : GET /aeroports?q=paris&limite=10
# ----------------------------------------------------------------------------
class RechercheAeroport(BaseModel):
    q: str = Field(..., min_length=2, max_length=100)
    limite: int = Field(10, ge=1, le=20)

    @field_validator("q")
    @classmethod
    def nettoyer_q(cls, v: str) -> str:
        v = re.sub(r"\s+", " ", v).strip()
        if len(v) < 2:
            raise ValueError("Saisissez au moins 2 caractères.")
        return v


# ----------------------------------------------------------------------------
# Sorties
# ----------------------------------------------------------------------------
class PaysOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code_pays: str
    nom: str


class AeroportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code_iata: str
    nom: str
    ville: Optional[str] = None
    code_pays: Optional[str] = None
    pays: Optional[str] = None        # nom du pays (Aeroport.nom_pays dans le modèle)
    libelle: str                      # « Paris (CDG), France »
    latitude: Optional[float] = None  # utile pour US10 (aéroport le plus proche)
    longitude: Optional[float] = None
    image_url: Optional[str] = None       # photo de la destination
    image_credit: Optional[str] = None    # crédit de la photo (CJ08), à afficher avec l'image
    lien_wikipedia: Optional[str] = None

# ----------------------------------------------------------------------------
# Entrée : aéroport le plus proche d'une position (US10)
# GET /aeroports/plus-proche?latitude=48.85&longitude=2.35
# ----------------------------------------------------------------------------
class PositionIn(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)