"""
Package controllers : point d'entrée de l'API.

Ce package définit les routes exposées par l'application. Chaque controller
regroupe les routes d'un domaine fonctionnel et se limite à :

- recevoir les requêtes et valider leur format ;
- transmettre le travail au service concerné ;
- renvoyer la réponse avec le bon code HTTP.

Les controllers ne contiennent pas de logique métier.
"""