import type { CriteresRecherche } from "@/features/explorer";

// Valeurs de secours si l'URL contient n'importe quoi (?passagers=abc)
const PASSAGERS_PAR_DEFAUT = 1;
const BUDGET_PAR_DEFAUT = 220;

/** Critères → paramètres d'URL. Les booléens ne sont écrits que s'ils sont vrais. */
export function versParametres(c: CriteresRecherche): URLSearchParams {
  const p = new URLSearchParams({
    origine: c.origine,
    destination: c.destination,
    depart: c.date_depart,
    passagers: String(c.nb_passagers),
    budget: String(c.budget_max),
  });
  // La seule présence de "retour" signifie « aller-retour »
  if (c.aller_retour && c.date_retour) p.set("retour", c.date_retour);
  if (c.direct_seulement) p.set("direct", "1");
  if (c.bagage_requis) p.set("bagage", "1");
  return p;
}

/** Paramètres d'URL → critères, ou null s'il manque l'essentiel. */
export function depuisParametres(p: URLSearchParams): CriteresRecherche | null {
  const origine = p.get("origine");
  const destination = p.get("destination");
  const date_depart = p.get("depart");
  if (!origine || !destination || !date_depart) return null;

  const date_retour = p.get("retour"); // string | null
  return {
    origine,
    destination,
    aller_retour: date_retour !== null,
    date_depart,
    date_retour,
    // Number("abc") → NaN, Number(null) → 0 ; dans les deux cas on prend la valeur de secours
    nb_passagers: Number(p.get("passagers")) || PASSAGERS_PAR_DEFAUT,
    budget_max: Number(p.get("budget")) || BUDGET_PAR_DEFAUT,
    direct_seulement: p.get("direct") === "1",
    bagage_requis: p.get("bagage") === "1",
  };
}