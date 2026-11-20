"""
Calcule l'embedding (approche A) de tous les vols qui n'en ont pas encore.

Ce que fait le script :
  - remplit la colonne `vols.embedding` (vector(4)) avec, pour chaque vol,
    [prix, durée aller, escales aller, heure de départ], normalisés sur [-1, 1] ;
  - ne touche à rien d'autre : ni au schéma, ni aux autres colonnes,
    ni au code back/front.

Ce que ça change :
  - Recherche (RecommandationService.recommander_recherche) : les vols sont
    comparés au profil de l'utilisateur par distance pgvector (<->), avec
    score = 1 / (1 + distance). Sans embedding, aucun tri par similarité possible.
  - Accueil (recommander_accueil) : aucun effet, le score y est calculé par règles
    (budget, escales, compagnie) sans utiliser les embeddings.

Limite connue : profil_depuis_preferences donne le même vecteur à tous les
utilisateurs, donc le classement est identique pour tout le monde.

À relancer après chaque import de vols :
    docker exec -w /app sae_backend python -m service_externe.embedding.calculer_embeddings
Pour annuler : UPDATE vols SET embedding = NULL;
"""

from app.database.initdb import init_db_pool
from app.utils.dependencies import embedding_service

if __name__ == "__main__":
    init_db_pool()
    n = embedding_service.calculer_en_attente()
    print(f"{n} embeddings calculés.")