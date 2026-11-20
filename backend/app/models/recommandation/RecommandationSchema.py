from pydantic import Field

from app.models.vol.VolSchema import VolOut


class RecommandationOut(VolOut):
    rang: int = Field(ge=1)
    score: float = Field(ge=-1, le=1)   # 1 - distance cosinus peut être négatif
    explication: str | None = None