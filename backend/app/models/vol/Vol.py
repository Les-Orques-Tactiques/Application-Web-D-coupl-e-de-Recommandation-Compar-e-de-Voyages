# app/models/vol/Vol.py
from __future__ import annotations

from dataclasses import dataclass, fields
from datetime import date, datetime, time
from typing import Optional
from uuid import UUID


@dataclass
class Vol:
    """Vol (table vols, US33-US35) : un itinéraire complet, aller simple ou aller-retour.

    ville_origine / ville_destination viennent de la jointure avec aeroports.
    depart_aller_local / arrivee_aller_locale viennent de sous-requêtes sur segments_vol.
    """

    id: UUID
    origine: str
    destination: str
    date_depart: date
    prix: float
    compagnie_aller: str
    duree_aller_min: int
    escales_aller: int = 0
    aller_retour: bool = False
    date_retour: Optional[date] = None
    devise: str = "USD"
    compagnie_retour: Optional[str] = None
    duree_retour_min: Optional[int] = None
    escales_retour: Optional[int] = None
    heure_depart_aller: Optional[time] = None
    simulee: bool = False
    observe_le: Optional[datetime] = None
    ville_origine: Optional[str] = None
    ville_destination: Optional[str] = None
    depart_aller_local: Optional[datetime] = None
    arrivee_aller_locale: Optional[datetime] = None

    @classmethod
    def from_row(cls, row: dict) -> "Vol":
        noms = {f.name for f in fields(cls)}
        donnees = {cle: valeur for cle, valeur in row.items() if cle in noms}
        donnees["prix"] = float(donnees["prix"])  # NUMERIC -> Decimal côté psycopg2
        return cls(**donnees)

    def to_public_dict(self) -> dict:
        def iso(v):
            return v.isoformat() if v else None

        return {
            "id": str(self.id),
            "origine": self.origine,
            "destination": self.destination,
            "ville_origine": self.ville_origine,
            "ville_destination": self.ville_destination,
            "date_depart": iso(self.date_depart),
            "date_retour": iso(self.date_retour),
            "aller_retour": self.aller_retour,
            "prix": self.prix,
            "devise": self.devise,
            "compagnie_aller": self.compagnie_aller,
            "duree_aller_min": self.duree_aller_min,
            "escales_aller": self.escales_aller,
            "compagnie_retour": self.compagnie_retour,
            "duree_retour_min": self.duree_retour_min,
            "escales_retour": self.escales_retour,
            "heure_depart_aller": iso(self.heure_depart_aller),
            "simulee": self.simulee,
            "observe_le": iso(self.observe_le),
            "depart_aller_local": iso(self.depart_aller_local),
            "arrivee_aller_locale": iso(self.arrivee_aller_locale),
        }