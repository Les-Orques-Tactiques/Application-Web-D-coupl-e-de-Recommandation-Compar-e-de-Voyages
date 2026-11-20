"""
Schémas Pydantic : module Interactions (avis US17, journal US22).
"""

from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AvisIn(BaseModel):
    """Corps de PUT /utilisateurs/moi/avis/{vol_id}."""
    model_config = ConfigDict(extra="forbid")
    pertinent: bool


class AvisOut(BaseModel):
    """None = l'utilisateur n'a pas encore donné d'avis sur ce vol."""
    pertinent: Optional[bool]


class InteractionIn(BaseModel):
    """Corps de POST /utilisateurs/moi/interactions.

    Seuls 'vue' et 'reserver' sont acceptés ici : les favoris et les avis
    ont leurs propres routes, qui tiennent le journal à jour elles-mêmes.
    """
    model_config = ConfigDict(extra="forbid")

    vol_id: UUID
    type: Literal["vue", "reserver"]

class AvisVolOut(BaseModel):
    """Un avis déjà donné : sert à rallumer les pouces au rechargement."""
    vol_id: UUID
    pertinent: bool