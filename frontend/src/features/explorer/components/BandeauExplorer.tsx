/** Grand bandeau d'accueil : texte à gauche, photo de Lisbonne à droite (sur ordinateur). */
export function BandeauExplorer({ prenom }: { prenom?: string }) {
  return (
    <section className="grid overflow-hidden rounded-3xl bg-profond text-white md:grid-cols-[62%_38%]">
      <div className="p-8">
        <span className="inline-block rounded-full bg-citron px-2.5 py-1 text-[10px] font-bold tracking-wide text-profond">
          VOTRE HORIZON, VOTRE RYTHME
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight lg:text-[37px] lg:leading-tight">
          Bonjour {prenom ?? "voyageur"}, où s’envole-t-on ?
        </h1>
        <p className="mt-3 text-[15px] text-white/70">
          On garde le cap sur vos envies. À vous de choisir la destination.
        </p>
      </div>
      {/* bg-[url(...)] : valeur « arbitraire » Tailwind ; l'image est dans public/images/ */}
      <div
        role="img"
        aria-label="Vue de Lisbonne et du Tage au coucher du soleil"
        className="min-h-48 bg-[url('/images/lisbonne.jpg')] bg-cover bg-center"
      />
    </section>
  );
}