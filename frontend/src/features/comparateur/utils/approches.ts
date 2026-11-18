import type { ApprocheId } from "./donneesComparateur";

/** Tout ce qu'il faut pour afficher une carte d'approche */
export interface InfoApproche {
    id: ApprocheId;
    surTitre: string;
    titre: string;
    description: string;
    avantage: string;
    limite: string;
}

// Les 3 cartes sont décrites ici : le composant CarteApproche n'est écrit
// qu'une fois et on boucle sur ce tableau dans la page.
export const APPROCHES: InfoApproche[] = [
    {
        id: "A",
        surTitre: "Approche A",
        titre: "Le contenu",
        description:
            "Embeddings des caractéristiques prix, durée, escales et bagages. Similarité cosinus via pgvector entre le profil et les vols.",
        avantage: "Utilisable dès la première connexion, avec vos critères explicites.",
        limite: "Peu de sérendipité : reste proche de vos préférences connues.",
    },
    {
        id: "B",
        surTitre: "Approche B",
        titre: "Les profils proches",
        description:
            "kNN item-based : similarité cosinus entre vols dans une matrice interactions utilisateurs × vols.",
        avantage: "Fait émerger des découvertes inattendues grâce aux comportements proches.",
        limite: "Nécessite de l’historique. Des utilisateurs simulés amorcent la démonstration.",
    },
    {
        id: "HYBRIDE",
        surTitre: "Approche hybride",
        titre: "Le meilleur équilibre",
        description:
            "Combine les scores A et B normalisés sur la même échelle. Le poids α règle la place des découvertes collaboratives.",
        avantage: "Vos critères gardent le cap, les interactions élargissent l’horizon.",
        limite: "Sans historique exploitable, retour à A (α effectif = 0).",
    },
];