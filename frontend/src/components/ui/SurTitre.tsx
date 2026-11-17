import type { ReactNode } from "react";

/**
 * Petit titre en capitales placé au-dessus d'un titre de page, par exemple
 * « 01 / REJOINDRE ORCA FLIGHT ». Le passage en majuscules est fait par la classe CSS
 * "uppercase" : on écrit le texte normalement dans le code.
 */
export function SurTitre({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-principal">{children}</p>;
}
