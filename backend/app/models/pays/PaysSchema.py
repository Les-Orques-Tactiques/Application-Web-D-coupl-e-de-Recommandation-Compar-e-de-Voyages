from pydantic import BaseModel, ConfigDict, Field


class PaysOut(BaseModel):
    """Pays renvoyé par l'API (champs de Pays.to_public_dict)."""

    model_config = ConfigDict(from_attributes=True)

    code_pays: str = Field(min_length=2, max_length=2, description="ISO 3166-1 alpha-2, ex. FR")
    nom: str