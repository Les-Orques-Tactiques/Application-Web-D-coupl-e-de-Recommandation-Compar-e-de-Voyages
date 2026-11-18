import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LocateFixed, PlaneTakeoff, Wallet } from "lucide-react";
import { Bandeau } from "@/components/ui/Bandeau";
import { Bouton } from "@/components/ui/Bouton";
import { Champ } from "@/components/ui/Champ";
import type { Preferences } from "../utils/types";
import { CarteBoussole } from "./CarteBoussole";
import { ChoixTrajet } from "./ChoixTrajet";
import { PastillesBudget } from "./PastillesBudget";

type EtatLocalisation = "aucune" | "recue" | "refusee";

export function FormulairePreferences() {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<Preferences>({
    aeroport: "",
    budget: null,
    trajet: "indifferent",
  });
  const [localisation, setLocalisation] = useState<EtatLocalisation>("aucune");

  // Met à jour un seul champ en gardant les deux autres
  function modifier<Cle extends keyof Preferences>(cle: Cle, valeur: Preferences[Cle]) {
    setPreferences((precedentes) => ({ ...precedentes, [cle]: valeur }));
  }

  function changerAeroport(texte: string) {
    // Un code IATA : trois lettres majuscules
    modifier("aeroport", texte.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3));
  }

  function changerBudget(texte: string) {
    modifier("budget", texte === "" ? null : Math.max(0, Number(texte)));
  }

  function utiliserPosition() {
    navigator.geolocation.getCurrentPosition(
      () => setLocalisation("recue"),
      () => setLocalisation("refusee"),
    );
  }

  function enregistrer(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    // À brancher sur le backend quand la route des préférences existera
    navigate("/explorer");
  }

  return (
    <form onSubmit={enregistrer} className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
      <div className="rounded-3xl border border-trait bg-white p-8 sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[22px] tracking-tight">D'où aimez-vous partir ?</h2>
          <span className="text-xs text-attenue">Facultatif</span>
        </div>
        <Champ
          className="mt-5"
          libelle="Aéroport habituel"
          icone={PlaneTakeoff}
          placeholder="Code IATA, par exemple LYS"
          value={preferences.aeroport}
          onChange={(e) => changerAeroport(e.target.value)}
        />
        <button
          type="button"
          onClick={utiliserPosition}
          className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-principal"
        >
          <LocateFixed aria-hidden="true" className="size-4" />
          Utiliser ma position une seule fois
        </button>

        <h2 className="mt-10 text-[22px] tracking-tight">Votre budget de référence</h2>
        <Champ
          className="mt-5"
          libelle="Maximum par personne · aller-retour"
          icone={Wallet}
          type="number"
          min={0}
          placeholder="Sans limite"
          value={preferences.budget ?? ""}
          onChange={(e) => changerBudget(e.target.value)}
        />
        <PastillesBudget valeur={preferences.budget} onChange={(budget) => modifier("budget", budget)} />

        <h2 className="mt-10 mb-5 text-[22px] tracking-tight">Le trajet qui vous convient</h2>
        <ChoixTrajet valeur={preferences.trajet} onChange={(trajet) => modifier("trajet", trajet)} />
        <p className="mt-3 text-xs text-attenue">
          Une préférence, pas une exclusion : vous pourrez filtrer strictement les résultats.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <Bouton type="submit">
            Enregistrer et explorer <ArrowRight aria-hidden="true" className="size-4" />
          </Bouton>
          <Link to="/explorer" className="text-sm font-semibold text-principal">
            Je préfère passer
          </Link>
        </div>
      </div>

      <div className="space-y-5">
        <CarteBoussole preferences={preferences} />
        <Bandeau ton="info" titre="Votre profil évolue avec vous">
          Avec votre accord, les favoris, les avis de pertinence et les clics vers la réservation ajustent
          dynamiquement vos recommandations.
        </Bandeau>
        {localisation === "refusee" && (
          <Bandeau ton="erreur" titre="Localisation refusée">
            Aucun problème : saisissez un pays, une ville ou un aéroport. La recherche reste entièrement disponible.
          </Bandeau>
        )}
        {localisation === "recue" && (
          <Bandeau ton="succes" titre="Position reçue">
            La recherche de l'aéroport le plus proche arrivera avec le backend. Saisissez le code en attendant.
          </Bandeau>
        )}
        <p className="text-xs leading-relaxed text-attenue">
          Ces choix sont modifiables dans Mon compte. Sans préférences enregistrées, vos critères de recherche
          suffisent pour commencer.
        </p>
      </div>
    </form>
  );
}
