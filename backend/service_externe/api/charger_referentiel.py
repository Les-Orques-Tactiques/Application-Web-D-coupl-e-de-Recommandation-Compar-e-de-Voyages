"""Charge pays + aéroports depuis OurAirports (0 requête Ignav). Relançable."""
import csv
import io

import psycopg2
import requests
from psycopg2.extras import execute_values

from app.settings import settings

BASE = "https://davidmegginson.github.io/ourairports-data/"
SERVICE_REGULIER_SEULEMENT = True  # False = garder aussi les petits terrains

MIGRATION = """
ALTER TABLE pays      ADD COLUMN IF NOT EXISTS lien_wikipedia TEXT;
ALTER TABLE aeroports ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE aeroports ADD COLUMN IF NOT EXISTS image_credit TEXT;
ALTER TABLE aeroports ADD COLUMN IF NOT EXISTS lien_wikipedia TEXT;
ALTER TABLE aeroports ADD COLUMN IF NOT EXISTS image_cherchee_le TIMESTAMPTZ;
"""


def lire_csv(nom):
    rep = requests.get(BASE + nom, timeout=60)
    rep.raise_for_status()
    rep.encoding = "utf-8"
    return csv.DictReader(io.StringIO(rep.text))


def nettoyer_lien(lien):
    lien = (lien or "").strip().replace(" ", "_").replace("%20", "_")
    return lien or None


def charger_pays():
    return {
        r["code"]: (r["name"], nettoyer_lien(r["wikipedia_link"]))
        for r in lire_csv("countries.csv")
        if len(r["code"]) == 2
    }


def charger_aeroports(pays):
    aeroports = {}
    for r in lire_csv("airports.csv"):
        iata = r["iata_code"].strip()
        if len(iata) != 3 or r["iso_country"] not in pays:
            continue
        if SERVICE_REGULIER_SEULEMENT and r["scheduled_service"] != "yes":
            continue
        try:
            lat, lon = float(r["latitude_deg"]), float(r["longitude_deg"])
        except ValueError:
            continue
        aeroports[iata] = (
            iata, r["name"], r["municipality"] or None, r["iso_country"],
            lat, lon, nettoyer_lien(r["wikipedia_link"]),
        )
    return list(aeroports.values())


def main():
    pays = charger_pays()
    aeroports = charger_aeroports(pays)

    conn = psycopg2.connect(settings.dsn)
    with conn, conn.cursor() as cur:
        cur.execute(MIGRATION)

        execute_values(
            cur,
            """INSERT INTO pays (code_pays, nom, lien_wikipedia) VALUES %s
               ON CONFLICT (code_pays) DO UPDATE SET
                   nom = EXCLUDED.nom,
                   lien_wikipedia = EXCLUDED.lien_wikipedia""",
            [(c, nom, lien) for c, (nom, lien) in pays.items()],
        )
        print(f"{len(pays)} pays")

        execute_values(
            cur,
            """INSERT INTO aeroports
                   (code_iata, nom, ville, code_pays, latitude, longitude, lien_wikipedia)
               VALUES %s
               ON CONFLICT (code_iata) DO UPDATE SET
                   nom = EXCLUDED.nom, ville = EXCLUDED.ville,
                   code_pays = EXCLUDED.code_pays,
                   latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
                   lien_wikipedia = EXCLUDED.lien_wikipedia""",
            aeroports,
        )
        print(f"{len(aeroports)} aéroports")
    conn.close()


if __name__ == "__main__":
    main()