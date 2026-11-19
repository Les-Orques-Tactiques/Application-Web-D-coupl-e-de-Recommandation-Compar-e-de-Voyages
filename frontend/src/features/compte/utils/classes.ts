// Classes Tailwind réutilisées par plusieurs cartes : un seul endroit à modifier.
export const carte = "rounded-xl border border-trait bg-white p-5";
export const titreCarte = "mb-4 text-base font-semibold text-encre";
export const etiquette = "grid gap-1 text-[12px] font-medium text-encre";
export const champ =
    "h-10 w-full min-w-0 rounded-lg border border-trait bg-white px-3 text-[13px] font-normal text-encre focus:border-principal focus:outline-none read-only:bg-fond";
export const boutonPrincipal =
    "inline-flex items-center justify-center gap-2 rounded-lg bg-principal px-4 py-2 text-[13px] font-medium text-white hover:bg-principal-fonce disabled:cursor-wait disabled:opacity-60";
export const boutonSecondaire =
    "inline-flex items-center justify-center gap-2 rounded-lg border border-principal px-4 py-2 text-[13px] font-medium text-principal hover:bg-menthe disabled:opacity-60";
export const messageStatut = "text-[12px] text-principal";