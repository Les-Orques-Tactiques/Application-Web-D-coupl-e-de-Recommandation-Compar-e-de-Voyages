"""
Assemblage central des DAO et Services (composition root).

Chaque DAO et Service n'est instancié qu'UNE SEULE FOIS ici, puis
réutilisé partout ailleurs (controllers, auth.py) par simple import.
"""

from app.models.utilisateur.UtilisateurDAO import UtilisateurDAO
from app.models.jeton.JetonDAO import JetonDAO
from app.models.token_revoque.TokenRevoqueDAO import TokenRevoqueDAO
from app.models.email.EmailServiceDAO import EmailEnvoyeDAO
from app.models.preference.PreferenceDAO import PreferenceDAO
from app.models.pays.PaysDAO import PaysDAO
from app.models.aeroport.AeroportDAO import AeroportDAO
from app.models.vol.VolDAO import VolDAO
from app.models.recherche.RechercheDAO import RechercheDAO
from app.services.UtilisateurService import UtilisateurService
from app.services.AuthentificationService import AuthService
from app.services.PreferenceService import PreferenceService
from app.services.PaysService import PaysService
from app.services.AeroportService import AeroportService
from app.services.VolService import VolService
from app.services.RechercheService import RechercheService
from app.models.favori.FavoriDAO import FavoriDAO
from app.services.FavoriService import FavoriService
# ----------------------------------------------------------------------------
# DAO : une instance chacun, sans état (chaque appel passe par le pool de
# connexions), donc sans risque à partager. Le pool doit être initialisé
# (init_db_pool) au démarrage de l'appli, avant la première requête.
# ----------------------------------------------------------------------------
utilisateur_dao = UtilisateurDAO()
jeton_dao = JetonDAO()
token_revoque_dao = TokenRevoqueDAO()
email_dao = EmailEnvoyeDAO()
preference_dao = PreferenceDAO()
pays_dao = PaysDAO()
aeroport_dao = AeroportDAO()
vol_dao = VolDAO()
recherche_dao = RechercheDAO()
favori_dao = FavoriDAO()
favori_service = FavoriService(favori_dao, utilisateur_dao)

# ----------------------------------------------------------------------------
# Services :
#  - UtilisateurService : comptes (inscription, activation par jeton email,
#    réinitialisation du mot de passe, profil, consentements). L'envoi d'email
#    est un appel direct à backend/smtp_email.py, sans injection.
#  - AuthService : sessions (connexion, JWT, rafraîchissement, révocation).
#  - PreferenceService : préférences de recherche (lecture, mise à jour
#    partielle, suppression du lieu de départ). Reçoit aussi utilisateur_dao
#    pour vérifier le consentement « localisation ».
#  - PaysService / AeroportService : référentiel en lecture seule (US9, US10).
#  - VolService : recherche et fiche d'un vol (US9, US20). Reçoit
#    aeroport_service pour valider les codes IATA avant d'interroger la base.
#  - RechercheService : historique des recherches (US14, US19). Reçoit
#    vol_service pour exécuter et relancer les recherches.
# L'ordre compte : un service doit être créé avant ceux qui en dépendent.
# ----------------------------------------------------------------------------
utilisateur_service = UtilisateurService(utilisateur_dao=utilisateur_dao, jeton_dao=jeton_dao)
auth_service = AuthService(utilisateur_dao=utilisateur_dao, token_revoque_dao=token_revoque_dao)
preference_service = PreferenceService(preference_dao=preference_dao, utilisateur_dao=utilisateur_dao)
pays_service = PaysService(pays_dao=pays_dao)
aeroport_service = AeroportService(aeroport_dao=aeroport_dao)
vol_service = VolService(vol_dao=vol_dao, aeroport_service=aeroport_service)
recherche_service = RechercheService(recherche_dao=recherche_dao, vol_service=vol_service)