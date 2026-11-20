from uuid import UUID
from dataclasses import replace   # à ajouter aux imports en haut

from app.models.preference.Preference import Preference
from app.models.recommandation.Recommandation import Recommandation
from app.models.recommandation.RecommandationInterface import RecommandationInterface
from app.models.vol.Vol import Vol
from app.services.PreferenceService import PreferenceService
from app.models.vol.CriteresRecherche import CriteresRecherche
from app.services.EmbeddingService import profil_depuis_preferences


DEVISE_BUDGET = "USD"


class RecommandationService:
    def __init__(
        self,
        recommandation_dao: RecommandationInterface,
        preference_service: PreferenceService,
    ):
        self.recommandation_dao = recommandation_dao
        self.preference_service = preference_service

    def recommander_accueil(
        self, utilisateur_id: UUID, limite: int = 6
    ) -> list[Recommandation]:
        preferences = self.preference_service.lire(utilisateur_id)
        candidats = self.recommandation_dao.lister_candidats_accueil(
            preferences.aeroport_habituel,
            DEVISE_BUDGET,
        )

        classement = []
        for vol in candidats:
            score, explication = self._evaluer(vol, preferences)
            classement.append((vol, score, explication))

        # Score décroissant, puis prix et durée pour départager les égalités.
        classement.sort(
            key=lambda item: (
                -item[1],
                item[0].prix,
                item[0].duree_aller_min + (item[0].duree_retour_min or 0),
                item[0].date_depart,
                str(item[0].id),
            )
        )

        # Ce bloc remplace l'ancienne compréhension de liste return [...].
        nombre_voulu = max(1, min(limite, 12))
        maximum_par_destination = 2

        selection: list[Recommandation] = []
        compte_par_destination: dict[str, int] = {}
        ids_selectionnes: set[UUID] = set()

        # Conserver l'ordre de pertinence, avec deux offres au maximum
        # par aéroport de destination et sans répéter un même identifiant.
        for vol, score, explication in classement:
            if vol.id in ids_selectionnes:
                continue

            destination = vol.destination.strip().upper()
            nombre_destination = compte_par_destination.get(destination, 0)

            if nombre_destination >= maximum_par_destination:
                continue

            selection.append(
                Recommandation(
                    vol=vol,
                    rang=len(selection) + 1,
                    score=score,
                    score_a=score,
                    explication=explication,
                )
            )
            ids_selectionnes.add(vol.id)
            compte_par_destination[destination] = nombre_destination + 1

            if len(selection) >= nombre_voulu:
                break

        # Si les candidats couvrent trop peu de destinations, renvoyer moins
        # de résultats plutôt que de dépasser le plafond par destination.
        return selection

    def recommander_recherche(
        self, utilisateur_id: UUID, criteres: CriteresRecherche
    ) -> list[Recommandation]:
        """Vols filtrés par les critères, classés par similarité avec le profil.
        Renvoie [] sans préférences exploitables : l'appelant se rabat sur le prix."""
        preferences = self.preference_service.lire(utilisateur_id)
        moyenne = self.recommandation_dao.moyenne_embedding()
        if moyenne is None:
            return []
        profil = profil_depuis_preferences(
            float(preferences.budget_max) if preferences.budget_max is not None else None,
            preferences.escales_max,
            moyenne,
        )
        if profil is None:
            return []
        # Le budget des préférences sert aussi de plafond si la recherche n'en a pas
        if criteres.budget is None and preferences.budget_max is not None:
            criteres = replace(criteres, budget=float(preferences.budget_max))
        if criteres.escales_max is None and preferences.escales_max is not None:
            criteres = replace(criteres, escales_max=preferences.escales_max)
        return self.recommandation_dao.classer_par_similarite(criteres, profil)

    @staticmethod
    def _evaluer(vol: Vol, preferences: Preference) -> tuple[float, str]:
        total = 0.0
        poids_total = 0.0
        raisons = []

        if preferences.aeroport_habituel:
            raisons.append(f"Départ de {preferences.aeroport_habituel}")

        # Budget : tout vol dans le budget reçoit 1 pour ce critère.
        # Au-dessus, le score diminue avec le dépassement.
        if preferences.budget_max is not None:
            budget = preferences.budget_max
            score_budget = 1.0 if vol.prix <= budget else budget / vol.prix
            total += 3.0 * score_budget
            poids_total += 3.0
            if vol.prix <= budget:
                raisons.append("dans votre budget")
            else:
                raisons.append("au-dessus de votre budget")

        # Pour un A/R, contrôler les escales dans les deux sens.
        if preferences.escales_max is not None:
            maximum = preferences.escales_max
            escales_connues = (
                not vol.aller_retour or vol.escales_retour is not None
            )
            if escales_connues:
                escales = max(vol.escales_aller, vol.escales_retour or 0)
                depassement = max(0, escales - maximum)
                score_escales = 1.0 / (1.0 + depassement)
                raisons.append(
                    "escales conformes à votre préférence"
                    if depassement == 0
                    else "plus d’escales que souhaité"
                )
            else:
                score_escales = 0.0
                raisons.append("escales retour non renseignées")
            total += 2.0 * score_escales
            poids_total += 2.0

        # Comparaison textuelle des noms, pas de code numérique arbitraire.
        preferees = {
            " ".join(nom.split()).casefold()
            for nom in preferences.compagnies_preferees
        }
        if preferees:
            compagnies = [vol.compagnie_aller]
            if vol.aller_retour:
                compagnies.append(vol.compagnie_retour or "")
            correspondances = sum(
                " ".join(nom.split()).casefold() in preferees
                for nom in compagnies
            )
            score_compagnie = correspondances / len(compagnies)
            total += score_compagnie
            poids_total += 1.0
            if correspondances:
                raisons.append("compagnie préférée sur au moins un trajet")
            else:
                raisons.append("autre compagnie")

        if poids_total == 0:
            raisons.append("sélection par prix, sans classement personnalisé")
            score = 0.0
        else:
            score = total / poids_total

        if vol.simulee:
            raisons.append("itinéraire simulé")

        return score, "; ".join(raisons)[:255]
  

   