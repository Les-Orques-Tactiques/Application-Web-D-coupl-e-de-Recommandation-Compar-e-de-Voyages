from uuid import UUID

from psycopg2.errors import ForeignKeyViolation

from app.database.initdb import get_db_cursor
from app.models.favori.FavoriInterface import FavoriInterface
from app.models.vol.Vol import Vol
from app.models.vol.VolDAO import COLONNES, JOINTURE
from app.utils.exceptions import VolIntrouvableError


class FavoriDAO(FavoriInterface):

    def ajouter(self, utilisateur_id: UUID, vol_id: UUID, journaliser: bool) -> bool:
        try:
            with get_db_cursor(commit=True) as cursor:
                cursor.execute(
                    """
                    INSERT INTO favoris (utilisateur_id, vol_id)
                    VALUES (%s, %s)
                    ON CONFLICT DO NOTHING;
                    """,
                    (utilisateur_id, vol_id),
                )
                cree = cursor.rowcount == 1
                if cree and journaliser:
                    # Même transaction que l'INSERT : tout passe ou rien
                    cursor.execute(
                        """
                        INSERT INTO interactions (utilisateur_id, vol_id, type)
                        VALUES (%s, %s, 'favori');
                        """,
                        (utilisateur_id, vol_id),
                    )
                return cree
        except ForeignKeyViolation:
            # Le vol n'existe pas (clé étrangère favoris.vol_id)
            raise VolIntrouvableError(vol_id) from None

    def lister(self, utilisateur_id: UUID, limite: int, decalage: int) -> list[Vol]:
        # JOINTURE finit sur "JOIN aeroports ad ..." : on peut y accrocher favoris.
        with get_db_cursor() as cursor:
            cursor.execute(
                f"""
                SELECT {COLONNES}
                {JOINTURE}
                JOIN favoris f ON f.vol_id = v.id
                WHERE f.utilisateur_id = %s
                ORDER BY f.cree_le DESC, v.id
                LIMIT %s OFFSET %s;
                """,
                (utilisateur_id, limite, decalage),
            )
            return [Vol.from_row(row) for row in cursor.fetchall()]

    def retirer(self, utilisateur_id: UUID, vol_id: UUID) -> bool:
        with get_db_cursor(commit=True) as cursor:
            cursor.execute(
                "DELETE FROM favoris WHERE utilisateur_id = %s AND vol_id = %s;",
                (utilisateur_id, vol_id),
            )
            retire = cursor.rowcount == 1
            if retire:
                # Sinon v_matrice_interactions garderait le +3 d'un favori retiré
                cursor.execute(
                    """
                    DELETE FROM interactions
                    WHERE utilisateur_id = %s AND vol_id = %s AND type = 'favori';
                    """,
                    (utilisateur_id, vol_id),
                )
            return retire