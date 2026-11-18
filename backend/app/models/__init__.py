"""
Package models : couche d'accès aux données de VoyageComparé.

Ce package regroupe les entités métier de l'application et tout ce qui
permet de les enregistrer et de les récupérer dans la base de données.

Il est organisé en sous-dossiers, un par entité (utilisateurs, jetons,
tokens révoqués, pays, e-mails). Chaque sous-dossier suit la même logique :

- une classe métier qui représente l'entité ;
- un schéma de validation des données échangées avec l'API, lorsque c'est
  nécessaire ;
- une interface qui définit les opérations attendues sur l'entité ;
- un DAO (Data Access Object) qui implémente ces opérations et dialogue
  avec la base de données.

Les services dépendent des interfaces et non des DAO, ce qui permet de
changer l'implémentation ou de la remplacer par un faux objet dans les tests.
"""