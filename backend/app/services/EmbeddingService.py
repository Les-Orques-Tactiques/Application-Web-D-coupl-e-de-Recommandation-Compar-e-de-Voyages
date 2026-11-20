from app.models.vol.Vol import Vol
from app.models.vol.VolInterface import VolInterface

# Bornes de normalisation : au-delà, la valeur est plafonnée.
PRIX_MAX = 1000.0
DUREE_MAX_MIN = 1440.0   # 24 h
ESCALES_MAX = 3



def normaliser(prix: float, duree_min: float, escales: int, heure_norm: float) -> list[float]:
    """Les 4 dimensions, plafonnées à 1 puis recentrées sur [-1, 1]."""
    brut = [
        min(prix / PRIX_MAX, 1.0),
        min(duree_min / DUREE_MAX_MIN, 1.0),
        min(escales / ESCALES_MAX, 1.0),
        heure_norm,
    ]
    return [2 * x - 1 for x in brut]


def vecteur_vol(vol: Vol) -> list[float]:
    """Vecteur à 4 valeurs dans [-1, 1] : prix, durée, escales, heure de départ."""
    h = vol.heure_depart_aller
    heure_norm = (h.hour * 60 + h.minute) / 1440 if h else 0.5  # 0.5 = neutre si inconnue
    return normaliser(vol.prix, vol.duree_aller_min, vol.escales_aller, heure_norm)


def profil_depuis_preferences(
    budget_max: float | None,
    escales_max: int | None,
    moyenne: list[float],
) -> list[float] | None:
    """Vecteur de requête d'un utilisateur sans historique.
    Part du vol moyen du catalogue, puis vise le minimum sur ce que
    l'utilisateur a renseigné (prix, escales) et sur la durée.
    L'heure reste celle du vol moyen (pas de « meilleure » heure).
    Renvoie None s'il n'y a aucune préférence."""
    if budget_max is None and escales_max is None:
        return None
    v = list(moyenne)
    v[0] = -1.0   # prix : le moins cher possible (le budget est un filtre)
    v[1] = -1.0   # durée : la plus courte possible
    v[2] = -1.0   # escales : le plus direct possible
    return v

class EmbeddingService:
    def __init__(self, vol_dao: VolInterface):
        self.vol_dao = vol_dao

    def calculer_en_attente(self, taille_lot: int = 1000) -> int:
        """Calcule les embeddings manquants, lot par lot. Renvoie le total écrit."""
        total = 0
        while True:
            vols = self.vol_dao.lister_sans_embedding(taille_lot)
            if not vols:
                return total
            total += self.vol_dao.ecrire_embeddings({v.id: vecteur_vol(v) for v in vols})