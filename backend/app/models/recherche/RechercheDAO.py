# app/models/recherche/RechercheDAO.py
from typing import Optional
from uuid import UUID

from psycopg2 import errors
from psycopg2.extras import Json

from app.database.initdb import get_db_cursor
from app.models.recherche.Recherche import Recherche
from app.models.recherche.RechercheInterface import RechercheInterface
from app.models.vol.CriteresRecherche import CriteresRecherche

# Colonnes explicites. La ville est lue sur l'aéroport (toujours à jour) ;
# la colonne ville_destination de la table sert de repli si l'aéroport a été supprimé.
COLONNES = """
    r.id, r.utilisateur_id, r.origine, r.destination, r.pays_destination,
    COALESCE(ad.ville, r.ville_destination) AS ville_destination,
    r.date_depart, r.date_retour, r.aller_retour, r.nb_passagers,
    r.budget_max, r.autres_criteres, r.cree_le
"""
JOINTURE = "FROM recherches r LEFT JOIN aeroports ad ON ad.code_iata = r.destination"


class RechercheDAO(RechercheInterface):

    def enregistrer(self, utilisateur_id: UUID, criteres: CriteresRecherche) -> Recherche:
        colonnes = Recherche.colonnes_depuis_criteres(criteres)
        colonnes["autres_criteres"] = Json(colonnes["autres_criteres"])  # JSONB
        noms = ["utilisateur_id", *colonnes.keys()]
        valeurs = [utilisateur_id, *colonnes.values()]

        # Les noms de colonnes viennent de Recherche.colonnes_depuis_criteres,
        # jamais du client : on peut les interpoler. Les valeurs passent en %s.
        sql = f"""
            WITH ajout AS (
                INSERT INTO recherches ({', '.join(noms)})
                VALUES ({', '.join(['%s'] * len(noms))})
                RETURNING *
            )
            SELECT {COLONNES}
            FROM ajout r
            LEFT JOIN aeroports ad ON ad.code_iata = r.destination;
        """
        try:
            with get_db_cursor(commit=True) as cursor:
                cursor.execute(sql, valeurs)
                return Recherche.from_row(cursor.fetchone())
        except errors.ForeignKeyViolation:
            raise ValueError("Utilisateur introuvable.")

    def lister_par_utilisateur(
        self, utilisateur_id: UUID, limite: int = 20, decalage: int = 0
    ) -> list[Recherche]:
        with get_db_cursor() as cursor:
            cursor.execute(
                f"""
                SELECT {COLONNES}
                {JOINTURE}
                WHERE r.utilisateur_id = %s
                ORDER BY r.cree_le DESC, r.id
                LIMIT %s OFFSET %s;
                """,
                (utilisateur_id, limite, decalage),
            )
            return [Recherche.from_row(row) for row in cursor.fetchall()]

    def find_by_id(self, recherche_id: UUID, utilisateur_id: UUID) -> Optional[Recherche]:
        with get_db_cursor() as cursor:
            cursor.execute(
                f"""
                SELECT {COLONNES}
                {JOINTURE}
                WHERE r.id = %s AND r.utilisateur_id = %s;
                """,
                (recherche_id, utilisateur_id),
            )
            row = cursor.fetchone()
            return Recherche.from_row(row) if row else None

    def supprimer(self, recherche_id: UUID, utilisateur_id: UUID) -> bool:
        with get_db_cursor(commit=True) as cursor:
            cursor.execute(
                "DELETE FROM recherches WHERE id = %s AND utilisateur_id = %s;",
                (recherche_id, utilisateur_id),
            )
            return cursor.rowcount > 0

    def vider_historique(self, utilisateur_id: UUID) -> int:
        with get_db_cursor(commit=True) as cursor:
            cursor.execute(
                "DELETE FROM recherches WHERE utilisateur_id = %s;",
                (utilisateur_id,),
            )
            return cursor.rowcount