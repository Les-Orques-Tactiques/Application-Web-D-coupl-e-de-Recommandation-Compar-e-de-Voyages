import { useId, type InputHTMLAttributes, type ReactNode } from "react"; // NOUVEAU : ReactNode
import type { LucideIcon } from "lucide-react";

// Un champ accepte toutes les propriétés d'un <input> HTML, plus les nôtres :
// libelle (texte au-dessus), icone (à gauche), aide (texte sous le champ), erreur (message rouge),
// suffixe (élément cliquable à droite, ex. bouton « afficher le mot de passe »)
// NOUVEAU : "export" pour que ChampMotDePasse puisse réutiliser ce type
export interface PropsChamp extends InputHTMLAttributes<HTMLInputElement> {
  libelle: string;
  icone?: LucideIcon;
  aide?: string;
  erreur?: string;
  suffixe?: ReactNode; // NOUVEAU
}

/**
 * Champ de formulaire complet : libellé + zone de saisie + icône + message d'aide ou d'erreur.
 * Il gère l'accessibilité : le libellé est relié au champ, et le message d'erreur est annoncé
 * aux lecteurs d'écran.
 *
 * Renommages dans la déstructuration :
 *   "icone: Icone"       -> la propriété "icone" devient la variable Icone (majuscule obligatoire
 *                           pour qu'on puisse l'utiliser comme composant : <Icone />)
 *   "required: obligatoire" -> on renomme "required" en français
 */
export function Champ({
  libelle,
  icone: Icone,
  aide,
  erreur,
  suffixe, // NOUVEAU : retiré de autresProps pour ne pas finir sur l'<input>
  className = "",
  id,
  required: obligatoire,
  ...autresProps
}: PropsChamp) {
  const identifiantAutomatique = useId();
  const identifiantChamp = id ?? identifiantAutomatique;
  const identifiantMessage = erreur ? `${identifiantChamp}-erreur` : aide ? `${identifiantChamp}-aide` : undefined;

  return (
    <div className={className}>
      <label htmlFor={identifiantChamp} className="mb-2 block text-[13px] font-semibold">
        {libelle}
        {obligatoire && " *"}
      </label>
      <div className="relative">
        {Icone && (
          <Icone
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-principal"
          />
        )}
        <input
          id={identifiantChamp}
          aria-required={obligatoire}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={identifiantMessage}
          className={`h-12 w-full rounded-xl border bg-white text-[15px] placeholder:text-[#9aa8ab] focus:border-principal focus:outline-2 focus:outline-principal/25 ${Icone ? "pl-11" : "pl-4"
            } ${suffixe ? "pr-12" : "pr-4" // NOUVEAU : place pour le bouton à droite, le texte ne passe pas dessous
            } ${erreur ? "border-erreur" : "border-trait"}`}
          {...autresProps}
        />
        {/* NOUVEAU : élément à droite, centré verticalement comme l'icône de gauche.
            Pas de pointer-events-none ici : il doit rester cliquable. */}
        {suffixe && <div className="absolute right-3 top-1/2 flex -translate-y-1/2">{suffixe}</div>}
      </div>
      {erreur ? (
        <p id={`${identifiantChamp}-erreur`} className="mt-1.5 text-xs text-erreur">
          {erreur}
        </p>
      ) : aide ? (
        <p id={`${identifiantChamp}-aide`} className="mt-1.5 text-xs text-attenue">
          {aide}
        </p>
      ) : null}
    </div>
  );
}
