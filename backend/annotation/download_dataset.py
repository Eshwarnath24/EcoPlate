import os
import requests
from supabase import create_client

# ---------------- SUPABASE CONFIG ----------------
SUPABASE_URL = "https://dirhzoukitvjdchzxdmj.supabase.co"
SUPABASE_KEY = "sb_publishable_u2ktihPjJokpEK-IAyWKtg_Oj5MmXoe"

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------------- DATASET FOLDERS ----------------
BASE_DIR = "ecoplate_images"
BEFORE_DIR = os.path.join(BASE_DIR, "before")
AFTER_DIR = os.path.join(BASE_DIR, "after")

os.makedirs(BEFORE_DIR, exist_ok=True)
os.makedirs(AFTER_DIR, exist_ok=True)

# ---------------- FETCH ALL COMPLETED PLATES ----------------
# Pagination ensures that records are not missed if the dataset grows.
rows = []
page_size = 500
start = 0

while True:
    batch = (
        sb.table("plates")
        .select("id,before_url,after_url")
        .eq("status", "completed")
        .order("id", desc=False)
        .range(start, start + page_size - 1)
        .execute()
        .data
    )

    rows.extend(batch)

    if len(batch) < page_size:
        break

    start += page_size

print(f"Total completed plates: {len(rows)}")

# ---------------- DOWNLOAD IMAGES IN ID ORDER ----------------
session = requests.Session()
downloaded = 0
failed = 0

for row in rows:
    plate_id = row["id"]

    for kind, folder in [
        ("before", BEFORE_DIR),
        ("after", AFTER_DIR),
    ]:
        url = row[f"{kind}_url"]

        if not url:
            print(f"MISSING URL: {plate_id} ({kind})")
            failed += 1
            continue

        filepath = os.path.join(folder, f"{plate_id}.jpg")

        try:
            response = session.get(url, timeout=60)
            response.raise_for_status()

            if not response.content:
                raise ValueError("Empty response")

            with open(filepath, "wb") as f:
                f.write(response.content)

            downloaded += 1
            print(f"Downloaded: {kind}/{plate_id}.jpg")

        except Exception as e:
            print(f"FAILED: {plate_id} ({kind}) - {e}")
            failed += 1

# ---------------- SUMMARY ----------------
print("\n========== DOWNLOAD SUMMARY ==========")
print(f"Completed plates : {len(rows)}")
print(f"Images downloaded: {downloaded}")
print(f"Images failed    : {failed}")
print(f"Dataset location : {os.path.abspath(BASE_DIR)}")
print("======================================")