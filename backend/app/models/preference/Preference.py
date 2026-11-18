from __future__ import annotations

from dataclasses import dataclass, field, fields
from datetime import datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID


class PreferenceInvalide(ValueError):
    """Valeur de préférence incorrecte (le service la traduit en erreur 400)."""


class _NonDefini:
    """Sentinelle : distingue « champ non fourni » (on garde la valeur en base)
    de None (on efface la valeur)."""

    _instance: Optional["_NonDefini"] = None

    def __new__(cls) -> "_NonDefini":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __repr__(self) -> str:
        return "ND"

    def __bool__(self) -> bool:
        return False


ND = _NonDefini()


@dataclass
class Preference:
    """Préférences facultatives d'un utilisateur (table preferences_utilisateur).

    Une seule ligne par utilisateur. Toutes les préférences sont facultatives :
    un utilisateur qui n'a rien saisi a un objet « vide » (voir Preference.vide).
    Le lieu de départ (latitude/longitude) est supprimé en les mettant à None.
    """

    utilisateur_id: UUID
    aeroport_habituel: Optional[str] = None      # code IATA, 3 lettres
    budget_max: Optional[float] = None
    escales_max: Optional[int] = None
    compagnies_preferees: list[str] = field(default_factory=list)
    latitude_depart: Optional[float] = None
    longitude_depart: Optional[float] = None
    modifie_le: Optional[datetime] = None

    @property
    def a_un_lieu_depart(self) -> bool:
        return self.latitude_depart is not None and self.longitude_depart is not None

    @property
    def est_vide(self) -> bool:
        return (
            self.aeroport_habituel is None
            and self.budget_max is None
            and self.escales_max is None
            and not self.compagnies_preferees
            and not self.a_un_lieu_depart
        )

    @classmethod
    def vide(cls, utilisateur_id: UUID) -> "Preference":
        """Préférences d'un utilisateur qui n'a encore rien renseigné."""
        return cls(utilisateur_id=utilisateur_id)

    @classmethod
    def from_row(cls, row: dict) -> "Preference":
        """Construit l'objet depuis une ligne RealDictCursor.

        Les colonnes inconnues sont ignorées ; les colonnes absentes du SELECT
        prennent leur valeur par défaut.
        """
        noms = {f.name for f in fields(cls)}
        donnees = {cle: valeur for cle, valeur in row.items() if cle in noms}
        # CHAR(3) : psycopg peut renvoyer le code avec des espaces
        if donnees.get("aeroport_habituel"):
            donnees["aeroport_habituel"] = donnees["aeroport_habituel"].strip()
        # NUMERIC(10,2) arrive en Decimal : on le convertit pour le JSON
        if isinstance(donnees.get("budget_max"), Decimal):
            donnees["budget_max"] = float(donnees["budget_max"])
        # VARCHAR[] NULL -> liste vide
        if "compagnies_preferees" in donnees:
            donnees["compagnies_preferees"] = list(donnees["compagnies_preferees"] or [])
        return cls(**donnees)

    def to_public_dict(self) -> dict:
        return {
            "utilisateur_id": str(self.utilisateur_id),
            "aeroport_habituel": self.aeroport_habituel,
            "budget_max": self.budget_max,
            "escales_max": self.escales_max,
            "compagnies_preferees": list(self.compagnies_preferees),
            "latitude_depart": self.latitude_depart,
            "longitude_depart": self.longitude_depart,
            "modifie_le": self.modifie_le.isoformat() if self.modifie_le else None,
        }


@dataclass(frozen=True)
class MiseAJourPreferences:
    """Ce que le Service transmet au DAO pour créer ou modifier les préférences.

    Mise à jour partielle : un champ laissé à ND n'est pas touché en base,
    un champ à None est effacé. Les valeurs sont normalisées et contrôlées dès
    l'entrée (__post_init__). L'existence du code aéroport en base est vérifiée
    par la clé étrangère (et par le service si l'on veut un message clair).
    Le consentement « localisation » est vérifié par le service avant d'écrire
    la latitude/longitude.
    """

    aeroport_habituel: Any = ND
    budget_max: Any = ND
    escales_max: Any = ND
    compagnies_preferees: Any = ND
    latitude_depart: Any = ND
    longitude_depart: Any = ND

    def __post_init__(self) -> None:
        def fixer(nom: str, valeur: Any) -> None:
            object.__setattr__(self, nom, valeur)

        if self.aeroport_habituel is not ND and self.aeroport_habituel is not None:
            code = str(self.aeroport_habituel).strip().upper()
            if len(code) != 3 or not code.isalpha():
                raise PreferenceInvalide("Le code aéroport doit contenir 3 lettres (code IATA).")
            fixer("aeroport_habituel", code)

        if self.budget_max is not ND and self.budget_max is not None:
            try:
                budget = round(float(self.budget_max), 2)
            except (TypeError, ValueError):
                raise PreferenceInvalide("Le budget maximum doit être un nombre.")
            if not (0 <= budget < 10**8):  # NUMERIC(10,2)
                raise PreferenceInvalide("Le budget maximum doit être positif ou nul.")
            fixer("budget_max", budget)

        if self.escales_max is not ND and self.escales_max is not None:
            try:
                escales = int(self.escales_max)
            except (TypeError, ValueError):
                raise PreferenceInvalide("Le nombre d'escales maximum doit être un entier.")
            if not (0 <= escales <= 5):
                raise PreferenceInvalide("Le nombre d'escales maximum doit être entre 0 et 5.")
            fixer("escales_max", escales)

        if self.compagnies_preferees is not ND:
            fixer("compagnies_preferees", self._nettoyer_compagnies(self.compagnies_preferees))

        # Latitude et longitude vont toujours ensemble.
        lat_fournie = self.latitude_depart is not ND
        lon_fournie = self.longitude_depart is not ND
        if lat_fournie != lon_fournie:
            raise PreferenceInvalide("Latitude et longitude doivent être fournies ensemble.")
        if lat_fournie:
            if (self.latitude_depart is None) != (self.longitude_depart is None):
                raise PreferenceInvalide("Latitude et longitude doivent être effacées ensemble.")
            if self.latitude_depart is not None:
                try:
                    lat, lon = float(self.latitude_depart), float(self.longitude_depart)
                except (TypeError, ValueError):
                    raise PreferenceInvalide("Latitude et longitude doivent être des nombres.")
                if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
                    raise PreferenceInvalide("Coordonnées hors limites.")
                fixer("latitude_depart", lat)
                fixer("longitude_depart", lon)

    @staticmethod
    def _nettoyer_compagnies(valeur: Any) -> tuple[str, ...]:
        """Retire espaces, vides et doublons (insensible à la casse), garde l'ordre."""
        if valeur is None:
            return ()
        if isinstance(valeur, str):
            valeur = valeur.split(",")
        if not isinstance(valeur, (list, tuple, set)):
            raise PreferenceInvalide("Les compagnies préférées doivent former une liste.")
        propres: list[str] = []
        vus: set[str] = set()
        for item in valeur:
            nom = str(item).strip()
            if not nom:
                continue
            if len(nom) > 120:
                raise PreferenceInvalide("Un nom de compagnie dépasse 120 caractères.")
            if nom.casefold() not in vus:
                vus.add(nom.casefold())
                propres.append(nom)
        if len(propres) > 20:
            raise PreferenceInvalide("20 compagnies préférées au maximum.")
        return tuple(propres)

    def colonnes(self) -> dict[str, Any]:
        """Colonnes à écrire (celles qui ne sont pas ND), prêtes pour le DAO.

        Les noms viennent des champs de la classe, jamais de l'utilisateur :
        on peut donc les interpoler dans le SQL en toute sécurité.
        """
        resultat: dict[str, Any] = {}
        for f in fields(self):
            valeur = getattr(self, f.name)
            if valeur is ND:
                continue
            if f.name == "compagnies_preferees":
                valeur = list(valeur)  # psycopg adapte list -> VARCHAR[]
            resultat[f.name] = valeur
        return resultat

    @classmethod
    def supprimer_lieu_depart(cls) -> "MiseAJourPreferences":
        """Suppression du lieu de départ : latitude/longitude à NULL."""
        return cls(latitude_depart=None, longitude_depart=None)

    @property
    def est_vide(self) -> bool:
        return not self.colonnes()