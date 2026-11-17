import type { ChangeEvent } from "react";
import { CaseACocher } from "@/components/ui/CaseACocher";
import type { Consentements } from "../types";

// Ce composant ne garde aucun état : il reçoit la valeur actuelle et prévient le parent
// (via auChangement) quand elle change. Le parent reste "propriétaire" des données.
interface PropsCasesConsentements {
  valeur: Consentements;
  auChangement: (nouvelleValeur: Consentements) => void;
  erreurConditions?: string; // message affiché si la case obligatoire n'est pas cochée
}

/** Les trois cases de confidentialité de l'inscription (une obligatoire, deux facultatives). */
export function CasesConsentements({ valeur, auChangement, erreurConditions }: PropsCasesConsentements) {
  /**
   * Fabrique la fonction à brancher sur une case précise.
   * C'est une "fonction qui renvoie une fonction" : basculer("personnalisation") renvoie le
   * gestionnaire à exécuter quand cette case change.
   *
   * { ...valeur, [consentement]: ... } copie l'objet actuel puis remplace une seule propriété
   * (la clé entre crochets est calculée). On ne modifie jamais l'objet d'origine : React
   * détecte un changement quand on lui donne un NOUVEL objet.
   */
  const basculer = (consentement: keyof Consentements) => (evenement: ChangeEvent<HTMLInputElement>) =>
    auChangement({ ...valeur, [consentement]: evenement.target.checked });

  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 text-[13px] font-semibold">Vos choix de confidentialité</legend>
      <CaseACocher checked={valeur.conditions} onChange={basculer("conditions")} erreur={erreurConditions}>
        J’accepte les conditions d’utilisation et la politique de confidentialité. * Obligatoire pour créer le compte.
      </CaseACocher>
      <CaseACocher checked={valeur.personnalisation} onChange={basculer("personnalisation")}>
        J’autorise l’utilisation de mes actions (favoris, avis, clics de réservation) pour personnaliser mes
        recommandations. (facultatif)
      </CaseACocher>
      <CaseACocher checked={valeur.geolocalisation} onChange={basculer("geolocalisation")}>
        J’autorise la géolocalisation ponctuelle pour suggérer un aéroport de départ. Je peux toujours le saisir
        manuellement. (facultatif)
      </CaseACocher>
    </fieldset>
  );
}
