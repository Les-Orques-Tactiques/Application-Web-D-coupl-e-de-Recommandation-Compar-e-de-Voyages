from typing import Optional
from uuid import UUID

from psycopg2.errors import ForeignKeyViolation

from app.database.initdb import get_db_cursor
from app.models.preference.Preference import MiseAJourPreferences, Preference
from app.models.preference.PreferenceInterface import PreferenceInterface
from app.utils.exceptions import AeroportInconnuError

# Colonnes explicites (pas de SELECT *), identiques pour toutes les méthodes.
COLONNES_PREFERENCES = """
    utilisateur_id, aeroport_habituel, budget_max, escales_max,
    compagnies_preferees, latitude_depart, longitude_depart, modifie_le
"""

# Liste blanche des colonnes modifiables via upsert. Les noms interpolés dans le SQL
# viennent de MiseAJourPreferences.colonnes(), jamais d'une saisie utilisateur ;
# cette vérification est une seconde barrière.
COLONNES_MODIFIABLES = {
    "aeroport_habituel",
    "budget_max",
    "escales_max",
    "compagnies_preferees",
    "latitude_depart",
    "longitude_depart",
}


class PreferenceDAO(PreferenceInterface):

    def find_by_utilisateur(self, utilisateur_id: UUID) -> Optional[Preference]:
        with get_db_cursor() as cursor:
            cursor.execute(
                f"SELECT {COLONNES_PREFERENCES} FROM preferences_utilisateur WHERE utilisateur_id = %s;",
                (utilisateur_id,),
            )
            row = cursor.fetchone()
            return Preference.from_row(row) if row else None

    def upsert(self, utilisateur_id: UUID, maj: MiseAJourPreferences) -> Preference:
        colonnes = maj.colonnes()
        if not set(colonnes) <= COLONNES_MODIFIABLES:
            raise ValueError("Colonne de préférence non autorisée.")

        try:
            # Un seul with : insertion/mise à jour et relecture dans la même transaction.
            with get_db_cursor(commit=True) as cursor:
                if not colonnes:
                    # Rien à écrire : on s'assure seulement que la ligne existe.
                    cursor.execute(
                        """
                        INSERT INTO preferences_utilisateur (utilisateur_id)
                        VALUES (%s)
                        ON CONFLICT (utilisateur_id) DO NOTHING;
                        """,
                        (utilisateur_id,),
                    )
                    cursor.execute(
                        f"SELECT {COLONNES_PREFERENCES} FROM preferences_utilisateur WHERE utilisateur_id = %s;",
                        (utilisateur_id,),
                    )
                else:
                    noms = list(colonnes)
                    # Le tableau est casté explicitement : une liste vide serait sinon
                    # envoyée sans type.
                    placeholders = ", ".join(
                        "%s::varchar[]" if nom == "compagnies_preferees" else "%s" for nom in noms
                    )
                    set_clause = ", ".join(f"{nom} = EXCLUDED.{nom}" for nom in noms)
                    cursor.execute(
                        f"""
                        INSERT INTO preferences_utilisateur (utilisateur_id, {", ".join(noms)})
                        VALUES (%s, {placeholders})
                        ON CONFLICT (utilisateur_id)
                        DO UPDATE SET {set_clause}
                        RETURNING {COLONNES_PREFERENCES};
                        """,
                        [utilisateur_id, *colonnes.values()],
                    )
                row = cursor.fetchone()
                return Preference.from_row(row)
        except ForeignKeyViolation as erreur:
            # Deux clés étrangères possibles : aeroports (code IATA inconnu)
            # ou utilisateurs (compte inexistant).
            contrainte = (erreur.diag.constraint_name or "").lower()
            if "aeroport" in contrainte:
                raise AeroportInconnuError("Aéroport inconnu.")
            raise ValueError("Utilisateur introuvable.")

    def supprimer_lieu_depart(self, utilisateur_id: UUID) -> Optional[Preference]:
        with get_db_cursor(commit=True) as cursor:
            cursor.execute(
                f"""
                UPDATE preferences_utilisateur
                SET latitude_depart = NULL, longitude_depart = NULL
                WHERE utilisateur_id = %s
                RETURNING {COLONNES_PREFERENCES};
                """,
                (utilisateur_id,),
            )
            row = cursor.fetchone()
            return Preference.from_row(row) if row else None