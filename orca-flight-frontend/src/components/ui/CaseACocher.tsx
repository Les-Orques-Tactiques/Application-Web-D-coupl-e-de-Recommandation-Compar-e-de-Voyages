import type { InputHTMLAttributes, ReactNode } from "react";
import { Check } from "lucide-react";

// Omit<..., "type"> : on reprend les propriétés d'un <input> sauf "type" (ici toujours "checkbox")
interface PropsCaseACocher extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  children: ReactNode; // le texte placé à droite de la case
  erreur?: string;
}

/**
 * Case à cocher stylée comme sur la maquette (carré qui devient teal avec une coche blanche).
 * La vraie case HTML est conservée (accessibilité, clavier) mais rendue invisible par
 * "appearance-none", puis redessinée en CSS.
 * La classe "peer" sur la case permet à l'icône voisine de réagir à son état :
 * "peer-checked:opacity-100" = devient visible quand la case est cochée.
 */
export function CaseACocher({ children, erreur, className = "", ...autresProps }: PropsCaseACocher) {
  return (
    <div className={className}>
      <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-snug text-attenue">
        <span className="relative mt-0.5 shrink-0">
          <input
            type="checkbox"
            className="peer size-5 appearance-none rounded-md border border-[#b9cbc9] bg-white checked:border-principal checked:bg-principal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-principal"
            {...autresProps}
          />
          <Check
            aria-hidden="true"
            strokeWidth={3}
            className="pointer-events-none absolute inset-0 m-auto size-3.5 text-white opacity-0 peer-checked:opacity-100"
          />
        </span>
        <span>{children}</span>
      </label>
      {erreur && <p className="mt-1.5 pl-8 text-xs text-erreur">{erreur}</p>}
    </div>
  );
}
