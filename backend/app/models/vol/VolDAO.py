# app/models/vol/VolDAO.py
from datetime import timedelta
from typing import Optional
from uuid import UUID

from app.database.initdb import get_db_cursor
from app.models.vol.CriteresRecherche import CriteresRecherche
from app.models.vol.Vol import Vol
from app.models.vol.VolInterface import VolInterface

COLONNES = """
    v.id, v.origine, v.destination, v.date_depart, v.date_retour, v.aller_retour,
    v.prix, v.devise, v.compagnie_aller, v.duree_aller_min, v.escales_aller,
    v.compagnie_retour, v.duree_retour_min, v.escales_retour,
    v.bagage_inclus, v.simulee, v.observe_le,
    ao.ville AS ville_origine, ad.ville AS ville_destination,
    (SELECT MIN(s.depart_local) FROM segments_vol s
        WHERE s.vol_id = v.id AND s.sens = 'aller')    AS depart_aller_local,
    (SELECT MAX(s.arrivee_locale) FROM segments_vol s
        WHERE s.vol_id = v.id AND s.sens = 'aller')    AS arrivee_aller_locale
"""
JOINTURE = """
    FROM vols v
    JOIN aeroports ao ON ao.code_iata = v.origine
    JOIN aeroports ad ON ad.code_iata = v.destination
"""

# Liste blanche : la clé vient du client, la valeur est du SQL écrit ici.
# « pertinence » (approche A) n'est pas encore branchée : elle retombe sur le prix.
TRIS = {
    "prix": "v.prix",
    "duree": "v.duree_aller_min",
    "escales": "v.escales_aller",
    "pertinence": "v.prix",
}


class VolDAO(VolInterface):

    def rechercher(self, criteres: CriteresRecherche) -> list[Vol]:
        marge = timedelta(days=criteres.tolerance_jours)
        conditions = [
            "v.origine = %s",
            "v.destination = %s",
            "v.aller_retour = %s",
            "v.date_depart BETWEEN %s AND %s",
            "v.date_depart >= CURRENT_DATE",
        ]
        valeurs: list = [
            criteres.origine,
            criteres.destination,
            criteres.aller_retour,
            criteres.date_depart - marge,
            criteres.date_depart + marge,
        ]

        if criteres.aller_retour and criteres.date_retour is not None:
            conditions.append("v.date_retour BETWEEN %s AND %s")
            valeurs += [criteres.date_retour - marge, criteres.date_retour + marge]

        # Budget par personne (même sens que le formulaire d'onboarding)
        if criteres.budget is not None:
            conditions.append("v.prix <= %s")
            valeurs.append(criteres.budget)

        if criteres.escales_max is not None:
            conditions.append("v.escales_aller <= %s")
            valeurs.append(criteres.escales_max)

        if criteres.duree_max_min is not None:
            conditions.append("v.duree_aller_min <= %s")
            valeurs.append(criteres.duree_max_min)

        # Seulement « bagage inclus » est un filtre ; False/None = pas de contrainte
        if criteres.bagage_inclus:
            conditions.append("v.bagage_inclus IS TRUE")

        if criteres.compagnies:
            conditions.append("LOWER(v.compagnie_aller) = ANY(%s)")
            valeurs.append([c.casefold() for c in criteres.compagnies])

        colonne_tri = TRIS.get(criteres.tri, TRIS["prix"])
        valeurs += [criteres.limite, criteres.decalage]

        with get_db_cursor() as cursor:
            cursor.execute(
                f"""
                SELECT {COLONNES}
                {JOINTURE}
                WHERE {' AND '.join(conditions)}
                ORDER BY {colonne_tri}, v.prix, v.id
                LIMIT %s OFFSET %s;
                """,
                valeurs,
            )
            return [Vol.from_row(row) for row in cursor.fetchall()]

    def find_by_id(self, vol_id: UUID) -> Optional[Vol]:
        with get_db_cursor() as cursor:
            cursor.execute(
                f"SELECT {COLONNES} {JOINTURE} WHERE v.id = %s;",
                (vol_id,),
            )
            row = cursor.fetchone()
            return Vol.from_row(row) if row else None