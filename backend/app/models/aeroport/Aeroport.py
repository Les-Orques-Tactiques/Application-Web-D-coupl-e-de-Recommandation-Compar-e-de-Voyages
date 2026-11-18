from __future__ import annotations

from dataclasses import dataclass, fields
from datetime import datetime
from typing import Optional


@dataclass
class Aeroport:
    """Aéroport du référentiel (table aeroports, US33), identifié par son code IATA.

    nom_pays vient de la jointure avec pays : il est None si le SELECT ne joint
    pas la table, ou si code_pays est NULL (aéroport créé par la collecte Ignav
    avec le code IATA comme nom, pas encore enrichi par OurAirports).
    """

    code_iata: str
    nom: str
    ville: Optional[str] = None
    code_pays: Optional[str] = None
    nom_pays: Optional[str] = None   # alias SQL : p.nom AS nom_pays
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    fuseau: Optional[str] = None
    image_url: Optional[str] = None
    image_credit: Optional[str] = None
    lien_wikipedia: Optional[str] = None
    cree_le: Optional[datetime] = None
    modifie_le: Optional[datetime] = None

    @property
    def libelle(self) -> str:
        """Texte affiché dans l'autocomplétion : « Paris (CDG), France »."""
        lieu = self.ville or self.nom
        pays = f", {self.nom_pays}" if self.nom_pays else ""
        return f"{lieu} ({self.code_iata}){pays}"

    @classmethod
    def from_row(cls, row: dict) -> "Aeroport":
        noms = {f.name for f in fields(cls)}
        donnees = {cle: valeur for cle, valeur in row.items() if cle in noms}
        # CHAR(3) / CHAR(2) : psycopg peut renvoyer des espaces de remplissage
        for cle in ("code_iata", "code_pays"):
            if isinstance(donnees.get(cle), str):
                donnees[cle] = donnees[cle].strip()
        return cls(**donnees)

    def to_public_dict(self) -> dict:
        """Champs utiles au frontend (autocomplétion, cartes de destination).
        Coordonnées pour US10."""
        return {
            "code_iata": self.code_iata,
            "nom": self.nom,
            "ville": self.ville,
            "code_pays": self.code_pays,
            "pays": self.nom_pays,
            "libelle": self.libelle,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "image_url": self.image_url,
            "image_credit": self.image_credit,
            "lien_wikipedia": self.lien_wikipedia,
        }