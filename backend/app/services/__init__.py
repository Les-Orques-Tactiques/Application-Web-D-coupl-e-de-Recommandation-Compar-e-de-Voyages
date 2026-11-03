"""
Package services : logique métier de l'application.

Ce package contient les règles de fonctionnement du projet. Les services
font le lien entre les controllers, qui reçoivent les requêtes, et les
models, qui accèdent aux données.

Chaque service est dédié à un domaine fonctionnel et prend en charge :

- la vérification des données et des règles métier ;
- l'enchaînement des opérations d'un parcours ;
- l'appel aux interfaces des models et aux utilitaires ;
- le déclenchement des erreurs métier, traitées ensuite par les
  gestionnaires d'exceptions.

Les services ne manipulent ni les requêtes HTTP ni le SQL : ils restent
indépendants de l'API et de la base de données.
"""