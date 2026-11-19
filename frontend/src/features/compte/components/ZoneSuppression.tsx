import { useState } from "react";
import { champ, etiquette } from "../utils/classes";

/** Fonction pas encore disponible côté API : on garde l'interface et on prévient la personne. */
export function ZoneSuppression() {
    const [confirmation, setConfirmation] = useState("");
    const [message, setMessage] = useState<string | null>(null);

    return (
        <section className="grid gap-6 rounded-xl bg-erreur-fond p-5 md:grid-cols-2">
            <div>
                <p className="text-[11px] font-semibold tracking-wider text-erreur">DROIT À L’OUBLI</p>
                <h2 className="mt-1 text-base font-semibold text-encre">Supprimer mon compte et mes données</h2>
                <p className="mt-1 text-[12px] text-attenue">
                    La suppression définitive n’est pas encore disponible dans cette version.
                </p>
            </div>
            <div className="grid content-center gap-2">
                <label className={etiquette}>
                    Saisissez SUPPRIMER pour confirmer
                    <input className={champ} placeholder="SUPPRIMER" value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)} />
                </label>
                <button type="button" disabled={confirmation !== "SUPPRIMER"}
                    onClick={() => setMessage("La suppression du compte n’est pas encore disponible.")}
                    className="rounded-lg bg-erreur px-4 py-2 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
                    Supprimer mon compte et mes données
                </button>
                {message && <p role="status" className="text-[12px] text-erreur">{message}</p>}
            </div>
        </section>
    );
}