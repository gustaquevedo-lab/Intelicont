#!/usr/bin/env python3
"""
InteliCont - DNIT RUC & Padrón Sync Engine
Downloads official DNIT RUC lists (ruc0.zip - ruc9.zip) and compiles an ultra-fast SQLite DB.
"""
import io
import os
import sqlite3
import sys
import time
import urllib.request
import zipfile

DATA_DIR = os.environ.get("DATA_DIR", "/home/dev-server/apps/intelicont/data")
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, "dnit_rucs.db")
TMP_DB = DB_PATH + ".tmp"

URLS = [
    "https://www.dnit.gov.py/documents/20123/3759873/ruc0.zip/665588c3-2498-3c19-1062-141ed937c8d2?t=1790859279224",
    "https://www.dnit.gov.py/documents/20123/3759873/ruc1.zip/15d1608f-d315-f544-3e56-be9cd363c477?t=1790859280013",
    "https://www.dnit.gov.py/documents/20123/3759873/ruc2.zip/5f5d3f27-a2b5-8c91-0d24-200f20d94cdc?t=1790859280789",
    "https://www.dnit.gov.py/documents/20123/3759873/ruc3.zip/6af8afe1-e779-b45d-d4ff-85e383c4ee48?t=1790859281631",
    "https://www.dnit.gov.py/documents/20123/3759873/ruc4.zip/a5f7b293-19ea-bc6a-254f-539da085ecb7?t=1790859282462",
    "https://www.dnit.gov.py/documents/20123/3759873/ruc5.zip/f49b0887-c162-b0fc-ee6f-8266c05285aa?t=1790859283273",
    "https://www.dnit.gov.py/documents/20123/3759873/ruc6.zip/4b805946-a3c1-0df8-2f4d-a0d924b6edaf?t=1790859284033",
    "https://www.dnit.gov.py/documents/20123/3759873/ruc7.zip/5848f37c-ea11-59af-29f8-1d725b83b4af?t=1790859284827",
    "https://www.dnit.gov.py/documents/20123/3759873/ruc8.zip/5724a89d-e520-9442-8fbd-c375aed043a7?t=1790859285611",
    "https://www.dnit.gov.py/documents/20123/3759873/ruc9.zip/27cde227-ed29-972b-abc9-ad192ac6e4f8?t=1790859286392",
]

def main():
    if os.path.exists(TMP_DB):
        try: os.remove(TMP_DB)
        except Exception: pass

    print(f"Iniciando compilacion de Base de Datos DNIT en {TMP_DB}...")
    conn = sqlite3.connect(TMP_DB)
    c = conn.cursor()
    c.execute("PRAGMA synchronous = OFF;")
    c.execute("PRAGMA journal_mode = MEMORY;")
    c.execute("""
    CREATE TABLE IF NOT EXISTS rucs (
        ruc TEXT PRIMARY KEY,
        razon_social TEXT,
        dv TEXT,
        ruc_anterior TEXT,
        estado TEXT
    );
    """)

    headers = {"User-Agent": "Mozilla/5.0 (InteliCont Fiscal Sync)"}
    total_count = 0

    for idx, url in enumerate(URLS):
        t0 = time.time()
        print(f"[{idx+1}/10] Descargando ruc{idx}.zip...")
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                zip_data = resp.read()
        except Exception as e:
            print(f"Error descargando {url}: {e}", file=sys.stderr)
            continue

        with zipfile.ZipFile(io.BytesIO(zip_data)) as zf:
            for fname in zf.namelist():
                with zf.open(fname) as f:
                    batch = []
                    for line in f:
                        try:
                            decoded = line.decode("utf-8", errors="replace").strip()
                            if not decoded: continue
                            parts = decoded.split("|")
                            if len(parts) >= 5:
                                batch.append((parts[0].strip(), parts[1].strip(), parts[2].strip(), parts[3].strip(), parts[4].strip()))
                        except Exception:
                            continue
                        if len(batch) >= 10000:
                            c.executemany("INSERT OR REPLACE INTO rucs VALUES (?, ?, ?, ?, ?)", batch)
                            total_count += len(batch)
                            batch = []
                    if batch:
                        c.executemany("INSERT OR REPLACE INTO rucs VALUES (?, ?, ?, ?, ?)", batch)
                        total_count += len(batch)

        conn.commit()
        print(f"  -> ruc{idx}.zip procesado ({time.time()-t0:.1f}s)")

    print("Indexando campos de busqueda...")
    c.execute("CREATE INDEX IF NOT EXISTS idx_rucs_razon ON rucs(razon_social);")
    conn.commit()
    conn.close()

    if os.path.exists(DB_PATH):
        try: os.remove(DB_PATH)
        except Exception: pass
    os.rename(TMP_DB, DB_PATH)
    print(f"Finalizado con exito! Total registros: {total_count}. DB: {DB_PATH}")

if __name__ == "__main__":
    main()
