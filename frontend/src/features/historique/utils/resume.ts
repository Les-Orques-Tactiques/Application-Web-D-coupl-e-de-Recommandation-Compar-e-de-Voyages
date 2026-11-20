import type { RechercheHistorique } from "@/features/explorer";
import { formaterDate } from "@/features/explorer/utils/formatage";

/** Ligne de détail : dates, type de trajet, passagers, budget, escales. */
export function resume(r: RechercheHistorique): string {
    const morceaux: string[] = [];
    if (r.date_depart) {
        morceaux.push(
            r.aller_retour && r.date_retour
                ? `${formaterDate(r.date_depart)} au ${formaterDate(r.date_retour)}`
                : formaterDate(r.date_depart),
        );
    }
    morceaux.push(r.aller_retour ? "aller-retour" : "aller simple");
    morceaux.push(`${r.nb_passagers} passager${r.nb_passagers > 1 ? "s" : ""}`);
    if (r.budget_max !== null) morceaux.push(`max ${r.budget_max} USD`);
    // autres_criteres est un objet libre (JSONB) : on vérifie le type avant de s'en servir
    const escales = r.autres_criteres.escales_max;
    if (escales === 0) morceaux.push("direct");
    else if (typeof escales === "number") morceaux.push(`${escales} escale${escales > 1 ? "s" : ""} max`);
    return morceaux.join(" · ");
}