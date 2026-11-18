"""
Package services : logique métier de l'application.

Ce package contient les règles de fonctionnement du projet. Les services
font le lien entre les controllers, qui reçoivent les requêtes, et les
models, qui accèdent aux données.

Les données reçues sont déjà validées dans leur format par les schémas.
Chaque service se concentre sur :

- les règles métier (état d'un compte, validité d'un jeton, droits) ;
- l'enchaînement des opérations d'un parcours ;
- l'appel aux interfaces des models et aux utilitaires ;
- le déclenchement des erreurs métier, traitées ensuite par les
  gestionnaires d'exceptions.

Les services ne manipulent ni les requêtes HTTP ni le SQL.
"""