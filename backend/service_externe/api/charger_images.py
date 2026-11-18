"""Remplit aeroports.image_url avec l'image de la VILLE (Wikipédia). Relançable."""
import time
from urllib.parse import quote, urlparse

import psycopg2
import requests

from app.settings import settings

HEADERS = {"User-Agent": "SAE-Voyages/1.0 (projet etudiant IUT; contact: gabin23082005@gmail.com)"}
PAUSE = 0.2


def resume(session, host, titre):
    api = f"https://{host}/api/rest_v1/page/summary/{quote(titre.replace(' ', '_'), safe='')}"
    rep = session.get(api, timeout=15)
    if rep.status_code == 404:
        return None
    rep.raise_for_status()
    d = rep.json()
    if d.get("type") == "disambiguation":
        return None
    img = d.get("thumbnail") or d.get("originalimage")
    if not img:
        return None
    page = d.get("content_urls", {}).get("desktop", {}).get("page")
    return img["source"], page


def chercher_image(session, ville, pays_nom, lien_aeroport):
    # 1) page de la ville, 2) "Ville, Pays", 3) repli : page de l'aéroport
    for titre in (ville, f"{ville}, {pays_nom}"):
        res = resume(session, "en.wikipedia.org", titre)
        if res:
            return res
    if lien_aeroport:
        u = urlparse(lien_aeroport)
        titre = u.path.split("/wiki/")[-1]
        if titre:
            return resume(session, u.netloc, titre)
    return None


def main():
    session = requests.Session()
    session.headers.update(HEADERS)
    conn = psycopg2.connect(settings.dsn)

    with conn.cursor() as cur:
        cur.execute("""
            SELECT a.ville, a.code_pays, p.nom, MIN(a.lien_wikipedia)
            FROM aeroports a JOIN pays p ON p.code_pays = a.code_pays
            WHERE a.ville IS NOT NULL
              AND a.image_url IS NULL AND a.image_cherchee_le IS NULL
            GROUP BY a.ville, a.code_pays, p.nom
        """)
        villes = cur.fetchall()
    print(f"{len(villes)} villes à traiter")

    for i, (ville, code_pays, pays_nom, lien) in enumerate(villes, 1):
        try:
            res = chercher_image(session, ville, pays_nom, lien)
        except requests.RequestException as e:
            print(f"{ville} : erreur réseau ({e}), on réessaiera")
            continue
        image, page = res if res else (None, None)
        credit = f"Wikipédia : {page}" if page else None
        with conn, conn.cursor() as cur:
            cur.execute(
                """UPDATE aeroports
                   SET image_url = %s, image_credit = %s, image_cherchee_le = NOW()
                   WHERE ville = %s AND code_pays = %s""",
                (image, credit, ville, code_pays),
            )
        if i % 50 == 0:
            print(f"{i}/{len(villes)}")
        time.sleep(PAUSE)
    conn.close()


if __name__ == "__main__":
    main()