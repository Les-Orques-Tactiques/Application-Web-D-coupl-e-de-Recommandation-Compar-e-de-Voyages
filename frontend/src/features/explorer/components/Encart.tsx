import type { ReactNode } from "react";

/** Cadre blanc pour les messages (chargement, liste vide…) */
export function Encart({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-trait bg-white p-6 text-[13px] text-attenue">{children}</div>;
}