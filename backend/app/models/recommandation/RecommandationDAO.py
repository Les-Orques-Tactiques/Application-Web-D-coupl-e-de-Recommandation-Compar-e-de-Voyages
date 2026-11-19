# app/models/recommandation/RecommandationDAO.py
from typing import Optional
from uuid import UUID
from app.models.vol.Vol import Vol

from app.database.initdb import get_db_cursor
from app.models.recommandation.Recommandation import Recommandation
from app.models.recommandation.RecommandationInterface import RecommandationInterface
from app.models.vol.CriteresRecherche import CriteresRecherche
from app.models.vol.VolDAO import COLONNES, JOINTURE, construire_filtres


def _vers_litteral_vecteur(valeurs: list[float]) -> str:
    """Format texte attendu par pgvector : '[0.1,0.2,0.3,0.4]'."""
    return "[" + ",".join(f"{float(v):.6f}" for v in valeurs) + "]"


class RecommandationDAO(RecommandationInterface):

    def classer_par_similarite(
        self, criteres: CriteresRecherche, embedding: list[float]
    ) -> list[Recommandation]:
        conditions, valeurs = construire_filtres(criteres)
        conditions.append("v.embedding IS NOT NULL")
        vecteur = _vers_litteral_vecteur(embedding)

        # <=> = distance cosinus (0 = identique) ; 1 - distance = similarité.
        # Le vecteur apparaît deux fois (SELECT puis ORDER BY), donc deux fois dans les valeurs.
        parametres = [vecteur, *valeurs, vecteur, criteres.limite, criteres.decalage]

        with get_db_cursor() as cursor:
            cursor.execute(
                f"""
                SELECT {COLONNES},
                       1 - (v.embedding <=> %s::vector) AS score
                {JOINTURE}
                WHERE {' AND '.join(conditions)}
                ORDER BY v.embedding <=> %s::vector, v.id
                LIMIT %s OFFSET %s;
                """,
                parametres,
            )
            lignes = cursor.fetchall()

        return [
            Recommandation.from_row({**ligne, "rang": criteres.decalage + i + 1,
                                     "score_a": ligne["score"], "score_b": None,
                                     "explication": None})
            for i, ligne in enumerate(lignes)
        ]

    def enregistrer(
        self,
        approche: str,
        duree_ms: float,
        resultats: list[Recommandation],
        utilisateur_id: Optional[UUID] = None,
        recherche_id: Optional[UUID] = None,
    ) -> UUID:
        with get_db_cursor(commit=True) as cursor:
            cursor.execute(
                """
                INSERT INTO executions_recommandation
                    (utilisateur_id, recherche_id, approche, duree_ms, nb_resultats)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id;
                """,
                (utilisateur_id, recherche_id, approche, duree_ms, len(resultats)),
            )
            execution_id = cursor.fetchone()["id"]

            if resultats:
                cursor.executemany(
                    """
                    INSERT INTO resultats_recommandation
                        (execution_id, vol_id, rang, score, score_a, score_b, explication)
                    VALUES (%s, %s, %s, %s, %s, %s, %s);
                    """,
                    [
                        (execution_id, r.vol.id, r.rang, r.score, r.score_a, r.score_b,
                         (r.explication or None) and r.explication[:255])
                        for r in resultats
                    ],
                )
            return execution_id

    def lister_candidats_accueil(
        self,
        origine: Optional[str],
        devise: str,
    ) -> list[Vol]:
        conditions = [
            "v.aller_retour IS TRUE",
            "v.date_depart >= CURRENT_DATE",
            "v.devise = %s",
            "EXISTS (SELECT 1 FROM segments_vol s "
            "WHERE s.vol_id = v.id AND s.sens = 'aller' "
            "AND s.ordre = 1 AND s.depart_utc > NOW())",
        ]
        valeurs = [devise]

        if origine:
            conditions.append("v.origine = %s")
            valeurs.append(origine)

        with get_db_cursor() as cursor:
            cursor.execute(
                f"""
                SELECT {COLONNES}
                {JOINTURE}
                WHERE {' AND '.join(conditions)}
                ORDER BY v.date_depart, v.prix, v.id;
                """,
                valeurs,
            )
            return [Vol.from_row(row) for row in cursor.fetchall()]
