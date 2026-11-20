from app.database.initdb import init_db_pool
from app.utils.dependencies import embedding_service

if __name__ == "__main__":
    init_db_pool()
    n = embedding_service.calculer_en_attente()
    print(f"{n} embeddings calculés.")