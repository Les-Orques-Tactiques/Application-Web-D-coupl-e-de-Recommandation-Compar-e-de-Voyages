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
    v.heure_depart_aller, v.simulee, v.observe_le,
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
# « pertinence » (approche A) est gérée par RecommandationService : ici, repli sur le prix.
TRIS = {
    "prix": "v.prix",
    "duree": "v.duree_aller_min",
    "escales": "v.escales_aller",
    "pertinence": "v.prix",
}


def construire_filtres(criteres: CriteresRecherche) -> tuple[list[str], list]:
    """Conditions WHERE et valeurs correspondantes, partagées par la recherche
    classique et par les recommandations."""
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

    # Première version : tous les budgets et résultats utilisent USD.
    conditions.append("v.devise = %s")
    valeurs.append("USD")


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

    if criteres.compagnies:
        conditions.append("LOWER(v.compagnie_aller) = ANY(%s)")
        valeurs.append([c.casefold() for c in criteres.compagnies])

    return conditions, valeurs


def vers_litteral_vecteur(valeurs: list[float]) -> str:
    """Format texte attendu par pgvector : '[0.1,0.2,0.3,0.4]'."""
    return "[" + ",".join(f"{float(v):.6f}" for v in valeurs) + "]"


class VolDAO(VolInterface):

    def rechercher(self, criteres: CriteresRecherche) -> list[Vol]:
        conditions, valeurs = construire_filtres(criteres)
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

    # --- Embeddings (approche A) -------------------------------------------

    def lister_sans_embedding(self, limite: int = 1000) -> list[Vol]:
        """Vols dont l'embedding n'est pas encore calculé, par lots."""
        with get_db_cursor() as cursor:
            cursor.execute(
                f"""
                SELECT {COLONNES}
                {JOINTURE}
                WHERE v.embedding IS NULL
                ORDER BY v.id
                LIMIT %s;
                """,
                (limite,),
            )
            return [Vol.from_row(row) for row in cursor.fetchall()]

    def ecrire_embeddings(self, embeddings: dict[UUID, list[float]]) -> int:
        """Écrit plusieurs embeddings dans une seule transaction. Renvoie le nombre de vols mis à jour."""
        if not embeddings:
            return 0
        with get_db_cursor(commit=True) as cursor:
            cursor.executemany(
                "UPDATE vols SET embedding = %s::vector WHERE id = %s;",
                [(vers_litteral_vecteur(v), vol_id) for vol_id, v in embeddings.items()],
            )
            return len(embeddings)
        
    def lister_compagnies(self) -> list[str]:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT compagnie FROM (
                    SELECT compagnie_aller AS compagnie FROM vols
                    UNION
                    SELECT compagnie_retour FROM vols WHERE compagnie_retour IS NOT NULL
                ) c
                ORDER BY compagnie;
                """
            )
            return [row["compagnie"] for row in cursor.fetchall()]