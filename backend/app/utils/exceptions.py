"""
Exceptions métier centralisées.

Deux familles :
  - ValidationError : erreurs de validation multi-champs, avec détail
    structuré {champ: [messages]}. Utile pour des règles que Pydantic
    seul ne peut pas exprimer (validations croisées entre champs, ou
    dépendant de l'état en base — ex: unicité, cohérence de dates).
  - Exceptions nommées par domaine : une erreur métier précise, mappée
    à un code HTTP unique dans le controller correspondant.
"""

class ValidationError(Exception):
    """
    Exception métier levée par les services quand les données ne respectent
    pas les règles de validation. `erreurs` est un dict {champ: [messages]},
    exploité par le controller pour renvoyer une réponse 400 structurée.
    """
    def __init__(self, erreurs: dict):
        self.erreurs = erreurs
        super().__init__(str(erreurs))

class RessourceIntrouvableError(Exception):
    """Erreur générique 404 — utilisable directement, ou sous-classée par domaine."""
    pass

class ConflitError(Exception):
    """Erreur générique 409 — utilisable directement, ou sous-classée par domaine."""
    pass

class AccesRefuseError(Exception):
    """Erreur générique 403 — utilisable directement, ou sous-classée par domaine."""
    pass


class JetonInvalideError(RessourceIntrouvableError):
    """Lien inconnu ou révoqué ; sert aussi à ne pas révéler l'état d'un lien de suivi. (404)"""


class JetonExpireError(RessourceIntrouvableError):
    """Lien de validation expiré : la page propose d'en demander un nouveau.
    (410, handler dédié ; sans lui, retombe sur 404)"""


class JetonDejaUtiliseError(ConflitError):
    """Lien de validation déjà utilisé : la page renvoie vers le lien de suivi. (409)"""


# ----------------------------------------------------------------------------
# Domaine : utilisateur
# ----------------------------------------------------------------------------
class EmailDejaUtiliseError(ConflitError):
    pass

class IdentifiantsInvalidesError(Exception):
    """Reste une Exception simple (pas 403/404/409) : mappée en 401 dans le controller."""
    pass

class UtilisateurIntrouvableError(RessourceIntrouvableError):
    pass



class ConsentementRequisError(ValidationError):
    """Levée quand l'activation du compte est tentée sans consentement au traitement des données."""
    def __init__(self, message: str = "L'acceptation du traitement des données est obligatoire."):
        super().__init__({"consentement_donnees": [message]})

# ----------------------------------------------------------------------------
# Domaine : préférences
# ----------------------------------------------------------------------------
class AeroportInconnuError(ValidationError):
    """Code IATA absent de la table aeroports (violation de la clé étrangère).
    Sous-classe de ValidationError : le controller renvoie déjà un 400 structuré."""
    def __init__(self, message: str = "Aéroport inconnu."):
        super().__init__({"aeroport_habituel": [message]})


class ConsentementLocalisationRequisError(AccesRefuseError):
    """Enregistrement du lieu de départ sans le consentement « localisation ». (403)
    À ne pas confondre avec ConsentementRequisError (activation du compte)."""
    def __init__(self, message: str = "Le consentement à la localisation est nécessaire pour enregistrer votre lieu de départ."):
        super().__init__(message)
        
class OnboardingDejaTermineError(ConflitError):
    """Onboarding déjà effectué : il ne se fait qu'une fois. (409)"""
    def __init__(self, message: str = "L'onboarding est déjà terminé."):
        super().__init__(message)

# ----------------------------------------------------------------------------
# Domaine : référentiel et recherche
# ----------------------------------------------------------------------------
class PaysIntrouvableError(RessourceIntrouvableError):
    """Code pays absent du référentiel. (404)"""
    def __init__(self, message: str = "Pays introuvable."):
        super().__init__(message)


class AeroportIntrouvableError(RessourceIntrouvableError):
    """Code IATA absent de la table aeroports. (404)"""
    def __init__(self, message: str = "Aéroport introuvable."):
        super().__init__(message)


class VolIntrouvableError(RessourceIntrouvableError):
    """Vol inconnu (fiche d'un vol, US20). (404)"""
    def __init__(self, message: str = "Vol introuvable."):
        super().__init__(message)

# ----------------------------------------------------------------------------
# Domaine : historique
# ----------------------------------------------------------------------------
class RechercheIntrouvableError(RessourceIntrouvableError):
    """Recherche inconnue ou appartenant à un autre utilisateur (même réponse). (404)"""
    def __init__(self, message: str = "Recherche introuvable."):
        super().__init__(message)