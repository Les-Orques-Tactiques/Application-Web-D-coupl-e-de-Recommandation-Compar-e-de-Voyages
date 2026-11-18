import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

// Trois sortes de bandeau : erreur (rose), info et succès (vert menthe)
type Ton = "erreur" | "info" | "succes";

// Tableau de correspondance : pour chaque ton, la couleur de fond, celle de l'icône et l'icône.
// "as const" fige les valeurs pour que TypeScript les connaisse exactement.
const styles = {
  erreur: { fond: "bg-erreur-fond", couleurIcone: "text-erreur", Icone: AlertCircle },
  info: { fond: "bg-menthe", couleurIcone: "text-principal", Icone: Clock },
  succes: { fond: "bg-menthe", couleurIcone: "text-principal", Icone: CheckCircle2 },
} as const;

interface PropsBandeau {
  ton: Ton;
  titre?: string; // facultatif : petit titre en gras
  children: ReactNode; // le message
  className?: string;
}

/**
 * Encart coloré pour afficher un message à la personne (erreur, information, confirmation).
 * role="alert" fait lire immédiatement les erreurs par les lecteurs d'écran ;
 * role="status" annonce poliment les autres messages.
 */
export function Bandeau({ ton, titre, children, className = "" }: PropsBandeau) {
  // On va chercher le style correspondant au ton demandé
  const { fond, couleurIcone, Icone } = styles[ton];
  return (
    <div role={ton === "erreur" ? "alert" : "status"} className={`flex gap-3 rounded-xl p-4 ${fond} ${className}`}>
      <Icone aria-hidden="true" className={`mt-0.5 size-[18px] shrink-0 ${couleurIcone}`} />
      <div className="text-[13px] leading-snug">
        {titre && <p className="mb-1 text-sm font-medium">{titre}</p>}
        <p className="text-attenue">{children}</p>
      </div>
    </div>
  );
}
