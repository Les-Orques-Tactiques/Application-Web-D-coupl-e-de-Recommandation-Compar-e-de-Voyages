from app.models.vol.Vol import Vol
from app.models.vol.VolInterface import VolInterface

# Bornes de normalisation : au-delà, la valeur est plafonnée.
PRIX_MAX = 2000.0
DUREE_MAX_MIN = 1440.0   # 24 h
ESCALES_MAX = 3


def vecteur_vol(vol: Vol) -> list[float]:
    """Vecteur à 4 valeurs dans [-1, 1] : prix, durée, escales, heure de départ.
    Recentré sur 0 : le cosinus ignore la norme, et des valeurs toutes positives
    rendraient presque tous les vols « similaires »."""
    h = vol.heure_depart_aller
    heure_norm = (h.hour * 60 + h.minute) / 1440 if h else 0.5  # 0.5 = neutre si inconnue
    brut = [
        min(vol.prix / PRIX_MAX, 1.0),
        min(vol.duree_aller_min / DUREE_MAX_MIN, 1.0),
        min(vol.escales_aller / ESCALES_MAX, 1.0),
        heure_norm,
    ]
    return [2 * x - 1 for x in brut]


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