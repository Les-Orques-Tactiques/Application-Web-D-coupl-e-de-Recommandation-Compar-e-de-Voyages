/**
 * Logo de l'application : pastille sombre avec un aileron d'orque, puis le nom "Orca Flight"
 * et le nom du groupe en petit. Le dessin est du SVG (image vectorielle écrite en code).
 * TODO : remplacer ce dessin approximatif par le fichier officiel du logo.
 */
export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      {/* aria-hidden : le dessin est décoratif, les lecteurs d'écran l'ignorent */}
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
        <rect width="34" height="34" rx="9" fill="#083f4a" />
        <path d="M9 25 L16.5 8 C17.5 13 21 19 25 25 Z" fill="#fff" />
        <path d="M14 25 L17 18 L19.5 25 Z" fill="#083f4a" />
      </svg>
      <span className="leading-none">
        <span className="block text-xl font-semibold tracking-tight text-encre">Orca Flight</span>
        <span className="mt-0.5 block text-[8px] font-semibold uppercase tracking-[0.14em] text-attenue">
          Les Orques tactiques
        </span>
      </span>
    </span>
  );
}
