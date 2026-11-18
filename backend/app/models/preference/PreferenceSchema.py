"""
Schémas Pydantic : module Préférences
Contrats de validation entrée/sortie pour l'API FastAPI.
Ne pas confondre avec models/preference/Preference.py (représentation interne,
utilisée par le DAO/Service, jamais exposée telle quelle).

Règles de validation alignées sur MiseAJourPreferences (modèle interne) :
le schéma refuse tôt avec un message clair (422), le modèle reste la dernière barrière.
"""

import re
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

ESCALES_MAX_AUTORISE = 5
MAX_COMPAGNIES = 20


def _normaliser_iata(v: str) -> str:
    v = v.strip().upper()
    if len(v) != 3 or not v.isalpha():
        raise ValueError("Le code aéroport doit contenir 3 lettres (code IATA).")
    return v


def _nettoyer_compagnies(v: list[str]) -> list[str]:
    """Retire espaces, vides et doublons (insensible à la casse), garde l'ordre."""
    propres: list[str] = []
    vus: set[str] = set()
    for item in v:
        nom = re.sub(r"\s+", " ", item).strip()
        if not nom:
            continue
        if len(nom) > 120:
            raise ValueError("Un nom de compagnie dépasse 120 caractères.")
        if nom.casefold() not in vus:
            vus.add(nom.casefold())
            propres.append(nom)
    if len(propres) > MAX_COMPAGNIES:
        raise ValueError(f"{MAX_COMPAGNIES} compagnies préférées au maximum.")
    return propres


# ----------------------------------------------------------------------------
# Entrée : champs communs aux préférences facultatives (US5, US6)
# Mise à jour partielle : un champ absent du JSON n'est pas modifié,
# un champ envoyé à null est effacé (toutes les préférences sont facultatives,
# contrairement à nom/prénom qui sont NOT NULL).
# Le lieu de départ n'est PAS ici : il a sa propre route (consentement requis).
# extra="forbid" : un champ inconnu (ex. latitude_depart) est refusé, pas ignoré.
# ----------------------------------------------------------------------------
class _PreferencesBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    aeroport_habituel: Optional[str] = Field(None, min_length=3, max_length=3)
    budget_max: Optional[float] = Field(None, ge=0, lt=10**8, allow_inf_nan=False)
    escales_max: Optional[int] = Field(None, ge=0, le=ESCALES_MAX_AUTORISE)
    compagnies_preferees: Optional[list[str]] = Field(None, max_length=MAX_COMPAGNIES * 2)

    @field_validator("aeroport_habituel")
    @classmethod
    def valider_aeroport(cls, v: Optional[str]) -> Optional[str]:
        return None if v is None else _normaliser_iata(v)

    @field_validator("budget_max")
    @classmethod
    def arrondir_budget(cls, v: Optional[float]) -> Optional[float]:
        return None if v is None else round(v, 2)

    @field_validator("compagnies_preferees")
    @classmethod
    def valider_compagnies(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        return None if v is None else _nettoyer_compagnies(v)


class PreferencesUpdate(_PreferencesBase):
    """Modification des préférences depuis la page profil."""

    @model_validator(mode="after")
    def verifier_au_moins_un_champ(self):
        if not self.model_fields_set:
            raise ValueError("Au moins un champ à modifier est requis.")
        return self


class PreferencesOnboarding(_PreferencesBase):
    """Page de préférences après l'inscription (US5).

    Un corps vide {} est valide : c'est le bouton « Passer ». Dans les deux cas
    (rempli ou passé), le service marque onboarding_termine = TRUE.
    """


# ----------------------------------------------------------------------------
# Entrée : lieu de départ (US10, US11)
# Latitude et longitude sont obligatoires et vont ensemble. Le consentement
# « localisation » est vérifié par le service (403 sinon).
# La suppression (US25) se fait par DELETE, sans corps.
# ----------------------------------------------------------------------------
class LieuDepartUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    latitude: float = Field(..., ge=-90, le=90, allow_inf_nan=False)
    longitude: float = Field(..., ge=-180, le=180, allow_inf_nan=False)


# ----------------------------------------------------------------------------
# Sorties
# ----------------------------------------------------------------------------
class PreferencesOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    utilisateur_id: UUID
    aeroport_habituel: Optional[str] = None
    budget_max: Optional[float] = None
    escales_max: Optional[int] = None
    compagnies_preferees: list[str] = Field(default_factory=list)
    latitude_depart: Optional[float] = None
    longitude_depart: Optional[float] = None
    a_un_lieu_depart: bool = False
    modifie_le: Optional[datetime] = None