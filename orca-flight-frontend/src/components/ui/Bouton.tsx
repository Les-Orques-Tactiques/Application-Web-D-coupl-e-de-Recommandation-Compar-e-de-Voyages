import type { ButtonHTMLAttributes } from "react";

// Deux tailles possibles : "moyenne" (formulaires) et "petite" (en-tête)
type Taille = "moyenne" | "petite";

/**
 * Construit la liste de classes Tailwind d'un bouton.
 * Elle est exportée à part pour qu'un lien <Link> puisse avoir l'apparence d'un bouton
 * (ex. "Créer un compte" dans l'en-tête) sans dupliquer le style.
 *
 * @param taille                  "moyenne" par défaut, ou "petite"
 * @param classesSupplementaires  Classes à ajouter (ex. "w-full" pour la pleine largeur)
 * @returns                       Une chaîne de classes CSS
 */
export function classeBouton(taille: Taille = "moyenne", classesSupplementaires = "") {
  const classesTaille =
    taille === "petite" ? "h-10 rounded-lg px-4 text-sm" : "h-12 rounded-xl px-6 text-[15px]";
  // Les classes "hover:", "focus-visible:" et "disabled:" ne s'appliquent que dans ces états
  // (survol, navigation au clavier, bouton désactivé).
  return `inline-flex items-center justify-center gap-2 bg-principal font-medium text-white transition-colors hover:bg-principal-fonce focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-principal disabled:cursor-not-allowed disabled:opacity-60 ${classesTaille} ${classesSupplementaires}`;
}

// Le bouton accepte toutes les propriétés d'un <button> HTML (onClick, disabled, type…)
// plus notre propriété "taille".
interface PropsBouton extends ButtonHTMLAttributes<HTMLButtonElement> {
  taille?: Taille;
}

/**
 * Composant bouton réutilisable.
 * "...autresProps" récupère toutes les autres propriétés reçues (onClick, disabled…) et les
 * transmet telles quelles au <button> : on n'a pas besoin de les lister une à une.
 * type="button" par défaut : évite qu'un bouton valide un formulaire par accident.
 */
export function Bouton({ taille = "moyenne", className = "", type = "button", ...autresProps }: PropsBouton) {
  return <button type={type} className={classeBouton(taille, className)} {...autresProps} />;
}
