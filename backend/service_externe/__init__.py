"""
Package service_externe : communication avec les systèmes tiers.

Ce package isole tout ce qui dépend de l'extérieur de l'application
(sources de données de vols, serveur d'envoi d'e-mails). Le reste du code
n'a pas à connaître le fonctionnement de ces services, ce qui permet de
les remplacer sans modifier la logique métier.
"""