# app/models/recherche/Recherche.py
from __future__ import annotations

from dataclasses import dataclass, field, fields
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from app.models.vol.CriteresRecherche import CriteresRecherche


@dataclass
class Recherche:
    """Recherche enregistrée (table recherches, US14, US19) : une ligne par recherche
    d'un utilisateur connecté, pour l'historique et « relancer une recherche ».

    origine, destination et pays_destination passent à NULL si l'aéroport ou le pays
    est supprimé du référentiel (ON DELETE SET NULL) : la recherche n'est alors plus
    relançable (voir peut_etre_relancee).
    Les critères sans colonne dédiée sont dans autres_criteres (JSONB) :
    escales_max, compagnies, bagage_inclus, duree_max_min, tolerance_jours, tri.
    """

    id: UUID
    utilisateur_id: UUID
    aller_retour: bool = False
    nb_passagers: int = 1
    origine: Optional[str] = None
    destination: Optional[str] = None
    pays_destination: Optional[str] = None
    ville_destination: Optional[str] = None
    date_depart: Optional[date] = None
    date_retour: Optional[date] = None
    budget_max: Optional[float] = None
    autres_criteres: dict[str, Any] = field(default_factory=dict)
    cree_le: Optional[datetime] = None

    @property
    def peut_etre_relancee(self) -> bool:
        return (
            self.origine is not None
            and self.destination is not None
            and self.date_depart is not None
        )

    @classmethod
    def from_row(cls, row: dict) -> "Recherche":
        noms = {f.name for f in fields(cls)}
        donnees = {cle: valeur for cle, valeur in row.items() if cle in noms}
        # CHAR(n) : psycopg peut renvoyer des espaces de remplissage
        for cle in ("origine", "destination", "pays_destination","ville_destination"):
            if isinstance(donnees.get(cle), str):
                donnees[cle] = donnees[cle].strip()
        # NUMERIC(10,2) arrive en Decimal
        if isinstance(donnees.get("budget_max"), Decimal):
            donnees["budget_max"] = float(donnees["budget_max"])
        # JSONB : dict côté psycopg2 ; on protège contre NULL
        donnees["autres_criteres"] = dict(donnees.get("autres_criteres") or {})
        return cls(**donnees)

    @staticmethod
    def colonnes_depuis_criteres(criteres: CriteresRecherche) -> dict[str, Any]:
        """Colonnes à insérer dans recherches à partir des critères validés.
        Les noms viennent d'ici, jamais du client : interpolables dans le SQL.
        autres_criteres doit être adapté en JSONB par le DAO (psycopg2.extras.Json)."""
        return {
            "origine": criteres.origine,
            "destination": criteres.destination,
            "date_depart": criteres.date_depart,
            "date_retour": criteres.date_retour,
            "aller_retour": criteres.aller_retour,
            "pays_destination": criteres.pays_destination,
            "ville_destination": criteres.ville_destination,
            "nb_passagers": criteres.passagers,
            "budget_max": criteres.budget,
            "autres_criteres": {
                "escales_max": criteres.escales_max,
                "compagnies": list(criteres.compagnies),
                "bagage_inclus": criteres.bagage_inclus,
                "duree_max_min": criteres.duree_max_min,
                "tolerance_jours": criteres.tolerance_jours,
                "tri": criteres.tri,
            },
        }

    def vers_criteres(self) -> CriteresRecherche:
        """Reconstitue les critères pour relancer la recherche (US14).
        Lève ValueError si la recherche n'est plus relançable. Une date de départ
        passée ne lève rien ici, mais la recherche ne renverra rien (le DAO exclut
        les vols passés) : le front doit proposer de modifier les dates."""
        if not self.peut_etre_relancee:
            raise ValueError("Recherche non relançable : aéroport supprimé ou date absente.")
        extra = self.autres_criteres
        return CriteresRecherche(
            origine=self.origine,
            destination=self.destination,
            date_depart=self.date_depart,
            aller_retour=self.aller_retour,
            date_retour=self.date_retour,
            pays_destination=self.pays_destination,
            ville_destination=self.ville_destination,
            passagers=self.nb_passagers,
            budget=self.budget_max,
            escales_max=extra.get("escales_max"),
            compagnies=tuple(extra.get("compagnies") or ()),
            bagage_inclus=extra.get("bagage_inclus"),
            duree_max_min=extra.get("duree_max_min"),
            tolerance_jours=extra.get("tolerance_jours", 0),
            tri=extra.get("tri", "prix"),
        )

    def to_public_dict(self) -> dict:
        def iso(v):
            return v.isoformat() if v else None

        return {
            "id": str(self.id),
            "origine": self.origine,
            "destination": self.destination,
            "pays_destination": self.pays_destination,
            "ville_destination": self.ville_destination,
            "date_depart": iso(self.date_depart),
            "date_retour": iso(self.date_retour),
            "aller_retour": self.aller_retour,
            "nb_passagers": self.nb_passagers,
            "budget_max": self.budget_max,
            "autres_criteres": self.autres_criteres,
            "relancable": self.peut_etre_relancee,
            "cree_le": iso(self.cree_le),
        }