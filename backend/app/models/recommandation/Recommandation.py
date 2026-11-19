# app/models/recommandation/Recommandation.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from app.models.vol.Vol import Vol


@dataclass
class Recommandation:
    """Un vol classé par un algorithme de recommandation (US12).

    Correspond à une ligne de resultats_recommandation, avec le vol complet.
    """

    vol: Vol
    rang: int                          # 1 = meilleur résultat
    score: float                       # score final, plus haut = meilleur
    score_a: Optional[float] = None    # approche A (contenu)
    score_b: Optional[float] = None    # approche B (kNN), None tant qu'elle n'existe pas
    explication: Optional[str] = None  # justification courte (255 caractères max)

    @classmethod
    def from_row(cls, row: dict) -> "Recommandation":
        """La ligne contient les colonnes du vol (COLONNES) et celles du résultat.
        Vol.from_row ignore les clés qui ne le concernent pas."""
        return cls(
            vol=Vol.from_row(row),
            rang=row["rang"],
            score=float(row["score"]),
            score_a=float(row["score_a"]) if row.get("score_a") is not None else None,
            score_b=float(row["score_b"]) if row.get("score_b") is not None else None,
            explication=row.get("explication"),
        )

    def to_public_dict(self) -> dict:
        """Le vol au format habituel, plus le classement. score_a et score_b
        restent internes : ils servent à l'évaluation, pas à l'affichage."""
        return {
            **self.vol.to_public_dict(),
            "rang": self.rang,
            "score": round(self.score, 4),
            "explication": self.explication,
        }


@dataclass
class ExecutionRecommandation:
    """Une exécution de l'algorithme (ligne de executions_recommandation)."""

    id: UUID
    approche: str                      # 'A', 'B' ou 'MELANGE'
    duree_ms: float
    nb_resultats: int
    utilisateur_id: Optional[UUID] = None
    recherche_id: Optional[UUID] = None
    alpha: Optional[float] = None      # part de B dans le mélange
    k: Optional[int] = None            # voisins utilisés par kNN
    cpu_ms: Optional[float] = None
    memoire_mo: Optional[float] = None