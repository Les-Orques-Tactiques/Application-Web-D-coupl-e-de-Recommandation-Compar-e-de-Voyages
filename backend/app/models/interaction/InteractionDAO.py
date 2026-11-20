from typing import Optional
from uuid import UUID

from psycopg2.errors import ForeignKeyViolation

from app.database.initdb import get_db_cursor
from app.models.interaction.InteractionInterface import InteractionInterface
from app.utils.exceptions import VolIntrouvableError


class InteractionDAO(InteractionInterface):

    def lire_avis(self, utilisateur_id: UUID, vol_id: UUID) -> Optional[bool]:
        with get_db_cursor() as cursor:
            cursor.execute(
                "SELECT pertinent FROM avis_vol WHERE utilisateur_id = %s AND vol_id = %s;",
                (utilisateur_id, vol_id),
            )
            ligne = cursor.fetchone()
        return ligne["pertinent"] if ligne else None

    def donner_avis(self, utilisateur_id: UUID, vol_id: UUID,
                    pertinent: bool, journaliser: bool) -> None:
        type_interaction = "avis_pertinent" if pertinent else "avis_non_pertinent"
        try:
            with get_db_cursor(commit=True) as cursor:
                # UPSERT : un seul avis par (utilisateur, vol), le dernier gagne
                cursor.execute(
                    """
                    INSERT INTO avis_vol (utilisateur_id, vol_id, pertinent)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (utilisateur_id, vol_id)
                    DO UPDATE SET pertinent = EXCLUDED.pertinent, modifie_le = NOW();
                    """,
                    (utilisateur_id, vol_id, pertinent),
                )
                # On efface toujours l'ancien avis du journal : sinon un utilisateur
                # qui passe de « oui » à « non » compterait +3 et -2 en même temps.
                cursor.execute(
                    """
                    DELETE FROM interactions
                    WHERE utilisateur_id = %s AND vol_id = %s
                      AND type IN ('avis_pertinent', 'avis_non_pertinent');
                    """,
                    (utilisateur_id, vol_id),
                )
                if journaliser:
                    cursor.execute(
                        """
                        INSERT INTO interactions (utilisateur_id, vol_id, type)
                        VALUES (%s, %s, %s);
                        """,
                        (utilisateur_id, vol_id, type_interaction),
                    )
        except ForeignKeyViolation:
            # Le vol n'existe pas (clé étrangère avis_vol.vol_id)
            raise VolIntrouvableError() from None

    def retirer_avis(self, utilisateur_id: UUID, vol_id: UUID) -> bool:
        with get_db_cursor(commit=True) as cursor:
            cursor.execute(
                "DELETE FROM avis_vol WHERE utilisateur_id = %s AND vol_id = %s;",
                (utilisateur_id, vol_id),
            )
            retire = cursor.rowcount == 1
            cursor.execute(
                """
                DELETE FROM interactions
                WHERE utilisateur_id = %s AND vol_id = %s
                  AND type IN ('avis_pertinent', 'avis_non_pertinent');
                """,
                (utilisateur_id, vol_id),
            )
            return retire

    def journaliser(self, utilisateur_id: UUID, vol_id: UUID, type_interaction: str,
                    delai_minutes: int = 0) -> bool:
        try:
            with get_db_cursor(commit=True) as cursor:
                # INSERT ... SELECT ... WHERE NOT EXISTS : la vérification anti-doublon
                # et l'insertion se font en une seule requête.
                cursor.execute(
                    """
                    INSERT INTO interactions (utilisateur_id, vol_id, type)
                    SELECT %s, %s, %s::type_interaction
                    WHERE %s <= 0 OR NOT EXISTS (
                        SELECT 1 FROM interactions
                        WHERE utilisateur_id = %s AND vol_id = %s
                          AND type = %s::type_interaction
                          AND cree_le > NOW() - make_interval(mins => %s)
                    );
                    """,
                    (utilisateur_id, vol_id, type_interaction, delai_minutes,
                     utilisateur_id, vol_id, type_interaction, delai_minutes),
                )
                return cursor.rowcount == 1
        except ForeignKeyViolation:
            raise VolIntrouvableError() from None
    
    def lister_avis(self, utilisateur_id: UUID) -> dict[UUID, bool]:
        with get_db_cursor() as cursor:
            cursor.execute(
                "SELECT vol_id, pertinent FROM avis_vol WHERE utilisateur_id = %s;",
                (utilisateur_id,),
            )
            return {ligne["vol_id"]: ligne["pertinent"] for ligne in cursor.fetchall()}