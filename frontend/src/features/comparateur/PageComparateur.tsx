import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ApprocheId,
  PROFILS_DEMO,
  VolComparaison,
} from "./donneesComparateur";

interface VolClasse extends VolComparaison {
  scoreHybride: number;
  scoreActif: number;
}

function formaterDecimal(valeur: number, decimales = 2): string {
  return valeur.toFixed(decimales).replace(".", ",");
}

export function PageComparateur() {
  const [profilId, setProfilId] = useState<string>("camille");
  const [approcheActive, setApprocheActive] = useState<ApprocheId>("HYBRIDE");
  const [alpha, setAlpha] = useState<number>(0.35);
  const [kVoisins, setKVoisins] = useState<number>(5);
  const [animationRefresh, setAnimationRefresh] = useState<boolean>(false);

  const profilCourant = useMemo(
    () => PROFILS_DEMO.find((p) => p.id === profilId) ?? PROFILS_DEMO[0],
    [profilId]
  );

  // Si l'utilisateur n'a aucun historique (0 interaction), repli automatique sur A (alpha effectif = 0)
  const sansHistorique = profilCourant.nbInteractions === 0;
  const alphaEffectif = sansHistorique ? 0 : alpha;

  const volsClasses = useMemo<VolClasse[]>(() => {
    const avecScores = profilCourant.vols.map((vol) => {
      const scoreHybride =
        (1 - alphaEffectif) * vol.scoreA + alphaEffectif * vol.scoreB;

      let scoreActif = scoreHybride;
      if (approcheActive === "A") scoreActif = vol.scoreA;
      if (approcheActive === "B" && !sansHistorique) scoreActif = vol.scoreB;

      return {
        ...vol,
        scoreHybride,
        scoreActif,
      };
    });

    return [...avecScores].sort((a, b) => b.scoreActif - a.scoreActif);
  }, [profilCourant, alphaEffectif, approcheActive, sansHistorique]);

  const premierVol = volsClasses[0];

  const decouverteB = useMemo(() => {
    if (sansHistorique || profilCourant.vols.length === 0) return null;
    const meilleurB = [...profilCourant.vols].sort(
      (a, b) => b.scoreB - a.scoreB
    )[0];
    return meilleurB;
  }, [profilCourant, sansHistorique]);

  const handleComparer = () => {
    setAnimationRefresh(true);
    window.setTimeout(() => setAnimationRefresh(false), 350);
  };

  const pctContenu = Math.round((1 - alphaEffectif) * 100);
  const pctCollaboratif = Math.round(alphaEffectif * 100);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F6] text-[#112A2C] font-sans antialiased">
      {/* BARRE DE NAVIGATION */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-[#08383A] flex items-center justify-center text-white shadow-xs">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 fill-current"
                aria-hidden="true"
              >
                <path d="M4 16c2.5-5 6.5-8 12-8-1.5 2.5-1.5 5 0 7.5-4.5-.5-8.5.5-12 .5Z" />
              </svg>
            </div>
            <div className="leading-none">
              <span className="block text-lg font-extrabold tracking-tight text-[#08383A]">
                orque
              </span>
              <span className="block text-[9px] font-semibold tracking-[0.14em] text-slate-400 uppercase mt-0.5">
                LES ORQUES TACTIQUES
              </span>
            </div>
          </Link>

          {/* Liens centraux */}
          <nav
            aria-label="Navigation principale"
            className="hidden md:flex items-center gap-7 h-full text-sm font-medium"
          >
            <Link
              to="/explorer"
              className="text-slate-500 hover:text-[#0E7478] transition-colors h-full flex items-center"
            >
              Explorer
            </Link>
            <Link
              to="/explorer"
              className="text-slate-500 hover:text-[#0E7478] transition-colors h-full flex items-center"
            >
              Mes favoris
            </Link>
            <Link
              to="/explorer"
              className="text-slate-500 hover:text-[#0E7478] transition-colors h-full flex items-center"
            >
              Historique
            </Link>
            <span className="text-[#0E7478] font-semibold h-full flex items-center border-b-2 border-[#0E7478]">
              Comparateur
            </span>
          </nav>

          {/* Badge Démo + Profil */}
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-[#E7F2EF] text-[#0E7478] uppercase">
              DÉMO
            </span>
            <div className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-[#08383A] text-white text-xs font-bold flex items-center justify-center">
                {profilCourant.initiales}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                {profilCourant.prenom}
              </span>
              <svg
                viewBox="0 0 20 20"
                className="w-4 h-4 text-slate-400"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* EN-TÊTE DU LABORATOIRE */}
        <section className="space-y-2">
          <p className="text-xs font-bold tracking-[0.12em] text-[#0E7478] uppercase">
            LE LABORATOIRE ORQUE
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#08383A]">
              Trois approches. Un même horizon.
            </h1>
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase bg-[#D9F27E] text-[#1A3812]">
              DONNÉES DE DÉMONSTRATION
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-500">
            Comparez ce qui change dans le classement, et comprenez les compromis.
          </p>
        </section>

        {/* BANDEAU D'INFORMATION */}
        <section
          role="note"
          className="bg-[#E7F2EF] border border-[#CFE4DE] rounded-2xl px-4 py-3.5 flex items-start gap-3.5"
        >
          <div className="mt-0.5 text-[#0E7478] shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 3h6m-5 0v5.172a2 2 0 01-.586 1.414l-4.828 4.828A2 2 0 004 15.828V18a2 2 0 002 2h12a2 2 0 002-2v-2.172a2 2 0 00-.586-1.414l-4.828-4.828A2 2 0 0114 8.172V3"
              />
            </svg>
          </div>
          <div className="text-xs sm:text-sm">
            <p className="font-bold text-[#08383A]">
              Des exemples, pas des mesures réelles
            </p>
            <p className="text-slate-600 mt-0.5">
              Offres, scores, temps, qualité et énergie sont des valeurs illustratives cohérentes pour la maquette. Les métriques portent sur un jeu d&apos;évaluation fictif, pas sur des performances mesurées en production.
            </p>
          </div>
        </section>

        {/* BARRE DE PARAMÈTRES DÉMO */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            {/* Compte démo */}
            <div className="lg:col-span-4 space-y-1.5">
              <label
                htmlFor="select-profil-demo"
                className="block text-xs font-semibold text-slate-600"
              >
                Compte démo pré-rempli
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                  <svg
                    viewBox="0 0 20 20"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 17.25v-1.5a3 3 0 00-3-3h-5.5a3 3 0 00-3 3v1.5M10 9.75a3 3 0 100-6 3 3 0 000 6z"
                    />
                  </svg>
                </span>
                <select
                  id="select-profil-demo"
                  value={profilId}
                  onChange={(e) => setProfilId(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 text-sm font-medium text-[#08383A] bg-[#F8FAFA] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7478]"
                >
                  {PROFILS_DEMO.map((profil) => (
                    <option key={profil.id} value={profil.id}>
                      {profil.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recherche commune */}
            <div className="lg:col-span-5 space-y-1.5">
              <span className="block text-xs font-semibold text-slate-600">
                Même recherche pour les 3 approches
              </span>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-[#08383A] bg-[#F8FAFA] border border-slate-200 rounded-xl">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 text-[#0E7478] shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                  />
                </svg>
                <span className="truncate">{profilCourant.trajetLabel}</span>
              </div>
            </div>

            {/* Évaluation k + Bouton Comparer */}
            <div className="lg:col-span-3 flex items-end gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="select-k"
                  className="block text-xs font-semibold text-slate-600"
                >
                  Évaluation
                </label>
                <select
                  id="select-k"
                  value={kVoisins}
                  onChange={(e) => setKVoisins(Number(e.target.value))}
                  className="px-3 py-2.5 text-sm font-semibold text-[#08383A] bg-[#F8FAFA] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7478]"
                >
                  <option value={3}>k = 3</option>
                  <option value={5}>k = 5</option>
                  <option value={10}>k = 10</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleComparer}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0E7478] hover:bg-[#0B5D60] active:scale-[0.99] text-white text-sm font-semibold transition-all cursor-pointer shadow-xs"
              >
                <span>Comparer</span>
                <svg
                  viewBox="0 0 24 24"
                  className={`w-4 h-4 transition-transform duration-300 ${
                    animationRefresh ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* LES 3 CARTES D'APPROCHES */}
        <section
          aria-label="Les trois approches de recommandation"
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {/* APPROCHE A */}
          <article
            onClick={() => setApprocheActive("A")}
            className={`rounded-2xl p-6 transition-all cursor-pointer border ${
              approcheActive === "A"
                ? "bg-[#08383A] text-white border-[#08383A] shadow-md"
                : "bg-white text-[#112A2C] border-slate-200/80 hover:border-[#0E7478]/50"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-xs font-bold tracking-[0.1em] uppercase ${
                  approcheActive === "A" ? "text-[#9CD4C9]" : "text-[#0E7478]"
                }`}
              >
                APPROCHE A
              </span>
              {approcheActive === "A" && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D9F27E] text-[#1A3812]">
                  Sélectionnée
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold mt-2">Le contenu</h2>
            <p
              className={`text-sm leading-relaxed mt-2.5 ${
                approcheActive === "A" ? "text-slate-200" : "text-slate-600"
              }`}
            >
              Embeddings des caractéristiques prix, durée, escales et bagages. Similarité cosinus via pgvector entre le profil et les vols.
            </p>
            <ul className="mt-5 space-y-2.5 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <span
                  className={`font-bold ${
                    approcheActive === "A" ? "text-[#D9F27E]" : "text-[#0E7478]"
                  }`}
                >
                  +
                </span>
                <span>
                  Utilisable dès la première connexion, avec vos critères explicites.
                </span>
              </li>
              <li
                className={`flex items-start gap-2 ${
                  approcheActive === "A" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                <span className="font-bold">−</span>
                <span>
                  Peu de sérendipité : reste proche de vos préférences connues.
                </span>
              </li>
            </ul>
          </article>

          {/* APPROCHE B */}
          <article
            onClick={() => setApprocheActive("B")}
            className={`rounded-2xl p-6 transition-all cursor-pointer border ${
              approcheActive === "B"
                ? "bg-[#08383A] text-white border-[#08383A] shadow-md"
                : "bg-white text-[#112A2C] border-slate-200/80 hover:border-[#0E7478]/50"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-xs font-bold tracking-[0.1em] uppercase ${
                  approcheActive === "B" ? "text-[#9CD4C9]" : "text-[#0E7478]"
                }`}
              >
                APPROCHE B
              </span>
              {approcheActive === "B" && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D9F27E] text-[#1A3812]">
                  Sélectionnée
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold mt-2">Les profils proches</h2>
            <p
              className={`text-sm leading-relaxed mt-2.5 ${
                approcheActive === "B" ? "text-slate-200" : "text-slate-600"
              }`}
            >
              kNN item-based : similarité cosinus entre vols dans une matrice interactions utilisateurs × vols.
            </p>
            <ul className="mt-5 space-y-2.5 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <span
                  className={`font-bold ${
                    approcheActive === "B" ? "text-[#D9F27E]" : "text-[#0E7478]"
                  }`}
                >
                  +
                </span>
                <span>
                  Fait émerger des découvertes inattendues grâce aux comportements proches.
                </span>
              </li>
              <li
                className={`flex items-start gap-2 ${
                  approcheActive === "B" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                <span className="font-bold">−</span>
                <span>
                  Nécessite de l&apos;historique. Des utilisateurs simulés amorcent la démonstration.
                </span>
              </li>
            </ul>
          </article>

          {/* APPROCHE HYBRIDE */}
          <article
            onClick={() => setApprocheActive("HYBRIDE")}
            className={`rounded-2xl p-6 transition-all cursor-pointer border ${
              approcheActive === "HYBRIDE"
                ? "bg-[#08383A] text-white border-[#08383A] shadow-md"
                : "bg-white text-[#112A2C] border-slate-200/80 hover:border-[#0E7478]/50"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-xs font-bold tracking-[0.1em] uppercase ${
                  approcheActive === "HYBRIDE"
                    ? "text-[#9CD4C9]"
                    : "text-[#0E7478]"
                }`}
              >
                APPROCHE HYBRIDE
              </span>
              {approcheActive === "HYBRIDE" && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D9F27E] text-[#1A3812]">
                  Sélectionnée
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold mt-2">Le meilleur équilibre</h2>
            <p
              className={`text-sm leading-relaxed mt-2.5 ${
                approcheActive === "HYBRIDE"
                  ? "text-slate-200"
                  : "text-slate-600"
              }`}
            >
              Combine les scores A et B normalisés sur la même échelle. Le poids α règle la place des découvertes collaboratives.
            </p>
            <ul className="mt-5 space-y-2.5 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <span
                  className={`font-bold ${
                    approcheActive === "HYBRIDE"
                      ? "text-[#D9F27E]"
                      : "text-[#0E7478]"
                  }`}
                >
                  +
                </span>
                <span>
                  Vos critères gardent le cap, les interactions élargissent l&apos;horizon.
                </span>
              </li>
              <li
                className={`flex items-start gap-2 ${
                  approcheActive === "HYBRIDE"
                    ? "text-slate-300"
                    : "text-slate-500"
                }`}
              >
                <span className="font-bold">−</span>
                <span>
                  Sans historique exploitable, retour à A (α effectif = 0).
                </span>
              </li>
            </ul>
          </article>
        </section>

        {/* CURSEUR ALPHA & FORMULE */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Curseur gauche */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="slider-alpha"
                  className="text-base font-bold text-[#08383A]"
                >
                  Un peu de découverte ?
                </label>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#08383A] text-white">
                  α = {formaterDecimal(alphaEffectif)}
                </span>
              </div>

              <input
                id="slider-alpha"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={alphaEffectif}
                disabled={sansHistorique}
                onChange={(e) => setAlpha(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0E7478] disabled:opacity-50"
              />

              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>0 · 100 % contenu</span>
                <span>1 · 100 % collaboratif</span>
              </div>
            </div>

            {/* Encadré formule droite */}
            <div className="lg:col-span-6 bg-[#E7F2EF] rounded-xl p-4 sm:p-5 space-y-1.5">
              <p className="text-base sm:text-lg font-extrabold text-[#08383A]">
                Score final = (1 − α) × A + α × B
              </p>
              <p className="text-xs sm:text-sm text-slate-600">
                {pctContenu} % contenu + {pctCollaboratif} % collaboratif
                {sansHistorique && " (repli automatique sans historique)"}
              </p>
              {premierVol && (
                <p className="text-xs sm:text-sm font-medium text-[#08383A]">
                  {premierVol.compagnie} :{" "}
                  {formaterDecimal(1 - alphaEffectif)} ×{" "}
                  {formaterDecimal(premierVol.scoreA)} +{" "}
                  {formaterDecimal(alphaEffectif)} ×{" "}
                  {formaterDecimal(premierVol.scoreB)} ={" "}
                  {formaterDecimal(premierVol.scoreHybride, 3)} ≈{" "}
                  <span className="font-bold text-[#0E7478]">
                    {formaterDecimal(premierVol.scoreHybride)}
                  </span>
                </p>
              )}
            </div>
          </div>
        </section>

        {/* GRILLE PRINCIPALE : CLASSEMENT & MÉTRIQUES QUALITÉ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLONNE GAUCHE : CE QUI CHANGE DANS LA SÉLECTION */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-5 shadow-2xs">
            <div>
              <h2 className="text-xl font-extrabold text-[#08383A]">
                Ce qui change dans la sélection
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {volsClasses.length} vols après filtres · Rang{" "}
                {approcheActive === "HYBRIDE"
                  ? "hybride"
                  : `approche ${approcheActive}`}{" "}
                · Scores de similarité, pas des probabilités d&apos;achat.
              </p>
            </div>

            {/* En-tête du tableau */}
            <div className="grid grid-cols-12 text-[11px] font-bold tracking-wider uppercase text-slate-400 border-b border-slate-100 pb-2">
              <div className="col-span-6">VOL / PRIX A/R</div>
              <div className="col-span-2 text-right">A</div>
              <div className="col-span-2 text-right">B</div>
              <div className="col-span-2 text-right">HYBRIDE</div>
            </div>

            {/* Lignes des vols */}
            <div className="space-y-4">
              {volsClasses.map((vol, index) => {
                const largeurBarre = Math.max(
                  8,
                  Math.min(100, Math.round(vol.scoreActif * 100))
                );
                return (
                  <div key={vol.id} className="space-y-2">
                    <div className="grid grid-cols-12 items-center text-sm">
                      <div className="col-span-6 font-bold text-[#08383A] truncate pr-2">
                        {index + 1}. {vol.compagnie} · {vol.escaleLabel} ·{" "}
                        {vol.prixEur} €
                      </div>
                      <div className="col-span-2 text-right text-slate-500 font-medium">
                        {formaterDecimal(vol.scoreA)}
                      </div>
                      <div className="col-span-2 text-right text-slate-500 font-medium">
                        {sansHistorique ? "—" : formaterDecimal(vol.scoreB)}
                      </div>
                      <div className="col-span-2 text-right font-extrabold text-[#0E7478]">
                        {formaterDecimal(vol.scoreHybride)}
                      </div>
                    </div>

                    {/* Barre de progression horizontale */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0E7478] rounded-full transition-all duration-300"
                        style={{ width: `${largeurBarre}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Encadré découverte côté B */}
            {decouverteB && premierVol && (
              <div className="bg-[#E7F2EF] rounded-xl p-4 flex items-start gap-3">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-[#0E7478] shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
                  />
                </svg>
                <div className="text-xs leading-relaxed">
                  <p className="font-bold text-[#08383A]">
                    La découverte côté B : {decouverteB.compagnie}
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    B classe {decouverteB.compagnie} en tête (
                    {formaterDecimal(decouverteB.scoreB)}) grâce aux profils
                    proches. L&apos;hybride conserve {premierVol.compagnie} en
                    premier, en accord avec vos préférences de durée et de cabine.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* COLONNE DROITE : LA QUALITÉ A PLUSIEURS DIMENSIONS */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-5 shadow-2xs">
            <h2 className="text-xl font-extrabold text-[#08383A]">
              La qualité a plusieurs dimensions.
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] font-bold tracking-wider uppercase text-slate-400 border-b border-slate-100">
                    <th className="text-left pb-2.5 font-bold">EXEMPLES DÉMO</th>
                    <th className="text-right pb-2.5 font-bold">A</th>
                    <th className="text-right pb-2.5 font-bold">B</th>
                    <th className="text-right pb-2.5 font-bold">Hybride</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profilCourant.metriques.map((m) => (
                    <tr key={m.label}>
                      <td className="py-3.5 font-semibold text-[#08383A]">
                        {m.label} <span className="text-slate-400">{m.sens}</span>
                      </td>
                      <td className="py-3.5 text-right text-slate-500">
                        {m.valeurA}
                      </td>
                      <td className="py-3.5 text-right text-slate-500">
                        {m.valeurB}
                      </td>
                      <td className="py-3.5 text-right font-bold text-[#0E7478]">
                        {m.valeurHybride}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
              <p>
                Énergie : Wh / 1 000 requêtes, valeurs illustratives sans instrumentation. ↑ Plus élevé préférable · ↓ Plus faible préférable.
              </p>
              <p>
                <strong className="text-[#08383A]">Précision@{kVoisins}</strong>{" "}
                · Part des {kVoisins} suggestions jugées pertinentes sur le jeu d&apos;évaluation fictif.
              </p>
              <p>
                <strong className="text-[#08383A]">NDCG@{kVoisins}</strong> · Qualité du classement : placer les vols les plus pertinents en premier.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION BASSE : COMPLEXITÉ & SOUS LE CAPOT */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Complexité */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-4 shadow-2xs">
            <h2 className="text-lg font-extrabold text-[#08383A]">
              Complexité · Repères théoriques
            </h2>

            <dl className="space-y-2.5 text-xs sm:text-sm">
              <div className="grid grid-cols-12 gap-2">
                <dt className="col-span-3 font-bold text-[#0E7478]">A</dt>
                <dd className="col-span-9 text-slate-600">
                  O(N × d) · comparaison exacte des embeddings
                </dd>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <dt className="col-span-3 font-bold text-[#0E7478]">B</dt>
                <dd className="col-span-9 text-slate-600">
                  Pré-calcul O(I² × U) ; requête O(k × |H|)
                </dd>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <dt className="col-span-3 font-bold text-[#0E7478]">Hybride</dt>
                <dd className="col-span-9 text-slate-600">
                  O(N × d + k × |H|) · combinaison des scores
                </dd>
              </div>
            </dl>

            <p className="text-xs text-slate-400 pt-2 border-t border-slate-100 leading-relaxed">
              N : vols candidats · d : dimensions · I : vols du catalogue · U : utilisateurs · H : historique · k : voisins. Coûts indicatifs, hors index et cache.
            </p>
          </div>

          {/* Sous le capot */}
          <div className="lg:col-span-6 bg-[#E7F2EF] border border-[#CFE4DE] rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h2 className="text-lg font-extrabold text-[#08383A]">
                Sous le capot, sans détour.
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                480 vols importés en JSON · 120 profils fictifs pour amorcer B. Même catalogue et mêmes filtres avant classement. Sans historique : repli sur A.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                React ↔ API FastAPI ↔ PostgreSQL + pgvector
                <br />
                Application découplée · Docker Compose · Git sémantique v0.1.0
              </p>
            </div>

            <p className="text-xs font-bold text-[#0E7478]">
              SAÉ BUT3 5.Real.01 · Maquette interactive de démonstration
            </p>
          </div>
        </section>
      </main>

      {/* PIED DE PAGE */}
      <footer className="bg-white border-t border-slate-200/80 mt-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>Les Orques tactiques · SAÉ BUT3 5.Real.01 · v0.1.0</span>
          <span>
            Offres et montants fictifs de démonstration · Aucune réservation sur Orque
          </span>
          <div className="flex items-center gap-2 text-[#0E7478] font-medium">
            <Link to="/confidentialite" className="hover:underline">
              Confidentialité
            </Link>
            <span className="text-slate-300">·</span>
            <Link to="/conditions" className="hover:underline">
              Conditions d&apos;utilisation
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}