# Makefile — attention : les lignes de commande commencent par une TABULATION, pas des espaces
.PHONY: build up init donnees logs down

build:
	docker compose build

up:
	docker compose up -d db backend

donnees:
	docker compose exec backend python -m service_externe.api.collecte_ignav_2 importer
	docker compose exec backend python -m service_externe.api.charger_referentiel
	docker compose exec backend python -m service_externe.embedding.calculer_embeddings
# Tout d'un coup : build + démarrage + import
init: build up donnees

db:
	docker compose exec db psql -U sae_user -d sae

logs:
	docker compose logs -f backend

down:
	docker compose down

delete_all:
	docker compose down -v