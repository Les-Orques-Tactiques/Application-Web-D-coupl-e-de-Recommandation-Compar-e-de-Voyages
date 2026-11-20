import json
from typing import Optional
from uuid import UUID
from app.models.vol.Vol import Vol

from app.database.initdb import get_db_cursor
from app.models.recommandation.Recommandation import Recommandation
from app.models.recommandation.RecommandationInterface import RecommandationInterface
from app.models.vol.CriteresRecherche import CriteresRecherche
from app.models.vol.VolDAO import COLONNES, JOINTURE, construire_filtres, vers_litteral_vecteur

class RecommandationDAO(RecommandationInterface):

    def classer_par_similarite(
        self, criteres: CriteresRecherche, embedding: list[float]
    ) -> list[Recommandation]:
        conditions, valeurs = construire_filtres(criteres)
        conditions.append("v.embedding IS NOT NULL")
        vecteur = vers_litteral_vecteur(embedding)

        # <-> = distance euclidienne (L2, 0 = identique) ; 1 / (1 + distance) = similarité dans ]0, 1].
        # Le vecteur apparaît deux fois (SELECT puis ORDER BY), donc deux fois dans les valeurs.
        parametres = [vecteur, *valeurs, vecteur, criteres.limite, criteres.decalage]

        with get_db_cursor() as cursor:
            cursor.execute(
                f"""
                SELECT {COLONNES},
                       1 / (1 + (v.embedding <-> %s::vector)) AS score
                {JOINTURE}
                WHERE {' AND '.join(conditions)}
                ORDER BY v.embedding <-> %s::vector, v.id
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

        # Sans aéroport habituel on garde tous les départs
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
            lignes = cursor.fetchall()

        # Deux lignes avec des id différents peuvent décrire le même vol affiché
        # (même compagnie, même trajet, mêmes horaires, mêmes dates).
        # Le tri (date, prix) place le moins cher en premier : on garde celui-là.
        deja_vus: set[tuple] = set()
        vols: list[Vol] = []
        for ligne in lignes:
            signature = (
                ligne["compagnie_aller"],
                ligne["origine"],
                ligne["destination"],
                ligne["depart_aller_local"],
                ligne["arrivee_aller_locale"],
                ligne["date_retour"],
            )
            if signature in deja_vus:
                continue  # doublon : on l'ignore
            deja_vus.add(signature)
            vols.append(Vol.from_row(ligne))
        return vols

    def moyenne_embedding(self) -> Optional[list[float]]:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT AVG(embedding)::text AS moy FROM vols WHERE embedding IS NOT NULL;")
            ligne = cursor.fetchone()
            return json.loads(ligne["moy"]) if ligne and ligne["moy"] else None

    def profil_depuis_interactions(self, utilisateur_id: UUID) -> Optional[list[float]]:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT i.poids, v.embedding::text AS emb
                FROM interactions i
                JOIN vols v ON v.id = i.vol_id
                WHERE i.utilisateur_id = %s
                  AND i.type IN ('favori', 'avis_pertinent', 'reserver', 'avis_non_pertinent')
                  AND v.embedding IS NOT NULL;
                """,
                (utilisateur_id,),
            )
            lignes = cursor.fetchall()

        positifs = [(l["poids"], json.loads(l["emb"])) for l in lignes if l["poids"] > 0]
        negatifs = [(-l["poids"], json.loads(l["emb"])) for l in lignes if l["poids"] < 0]
        if not positifs:
            return None

        def moyenne_ponderee(paires):
            total = sum(p for p, _ in paires)
            return [sum(p * e[i] for p, e in paires) / total for i in range(4)]

        profil = moyenne_ponderee(positifs)
        if negatifs:
            neg = moyenne_ponderee(negatifs)
            # on s'écarte des vols refusés, en restant dans [-1, 1]
            profil = [max(-1.0, min(1.0, p + 0.5 * (p - n))) for p, n in zip(profil, neg)]
        return profil