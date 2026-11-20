# app/models/vol/VolSchema.py
from datetime import date, datetime, time
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class VolOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    origine: str
    destination: str
    ville_origine: Optional[str] = None
    ville_destination: Optional[str] = None
    date_depart: date
    date_retour: Optional[date] = None
    aller_retour: bool
    prix: float
    devise: str
    compagnie_aller: str
    duree_aller_min: int
    escales_aller: int
    compagnie_retour: Optional[str] = None
    duree_retour_min: Optional[int] = None
    escales_retour: Optional[int] = None
    heure_depart_aller: Optional[time] = None
    simulee: bool
    observe_le: Optional[datetime] = None
    depart_aller_local: Optional[datetime] = None
    arrivee_aller_locale: Optional[datetime] = None