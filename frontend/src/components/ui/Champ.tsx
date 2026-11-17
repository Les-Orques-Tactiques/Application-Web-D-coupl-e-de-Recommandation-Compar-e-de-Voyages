import { useId, type InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

// Un champ accepte toutes les propriétés d'un <input> HTML, plus les nôtres :
// libelle (texte au-dessus), icone (à gauche), aide (texte sous le champ), erreur (message rouge)
interface PropsChamp extends InputHTMLAttributes<HTMLInputElement> {
  libelle: string;
  icone?: LucideIcon;
  aide?: string;
  erreur?: string;
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
  className = "",
  id,
  required: obligatoire,
  ...autresProps
}: PropsChamp) {
  // useId fabrique un identifiant unique, utilisé pour relier <label> et <input>
  const identifiantAutomatique = useId();
  const identifiantChamp = id ?? identifiantAutomatique;
  // Identifiant du message affiché sous le champ (erreur en priorité sur l'aide)
  const identifiantMessage = erreur ? `${identifiantChamp}-erreur` : aide ? `${identifiantChamp}-aide` : undefined;

  return (
    <div className={className}>
      <label htmlFor={identifiantChamp} className="mb-2 block text-[13px] font-semibold">
        {libelle}
        {obligatoire && " *"}
      </label>
      <div className="relative">
        {/* L'icône n'est affichée que si elle est fournie (&& : "si vrai, alors afficher") */}
        {Icone && (
          <Icone
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-principal"
          />
        )}
        <input
          id={identifiantChamp}
          aria-required={obligatoire}
          aria-invalid={erreur ? true : undefined} // signale l'erreur aux lecteurs d'écran
          aria-describedby={identifiantMessage} // relie le champ à son message
          className={`h-12 w-full rounded-xl border bg-white pr-4 text-[15px] placeholder:text-[#9aa8ab] focus:border-principal focus:outline-2 focus:outline-principal/25 ${
            Icone ? "pl-11" : "pl-4" // plus d'espace à gauche quand il y a une icône
          } ${erreur ? "border-erreur" : "border-trait"}`}
          {...autresProps}
        />
      </div>
      {/* Message sous le champ : l'erreur remplace l'aide quand elle existe */}
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
