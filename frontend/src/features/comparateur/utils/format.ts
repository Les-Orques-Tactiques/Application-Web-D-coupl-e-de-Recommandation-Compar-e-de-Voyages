/** 0.35 → "0,35" (format français) */
export function formaterDecimal(valeur: number, decimales = 2): string {
    return valeur.toFixed(decimales).replace(".", ",");
}
