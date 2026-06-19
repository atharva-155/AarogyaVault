from database import get_db
from utils import hash_aadhaar


def get_citizen_count():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) as cnt FROM citizens")
    count = cur.fetchone()["cnt"]
    cur.close()
    conn.close()
    return count


def create_citizen(data):
    aadhaar = data["aadhaar_number"].strip()
    if len(aadhaar) != 12 or not aadhaar.isdigit():
        raise ValueError("Aadhaar must be exactly 12 digits")

    conn = get_db()
    cur = conn.cursor()
    try:
        aadhaar_hash = hash_aadhaar(aadhaar)
        cur.execute("SELECT id FROM citizens WHERE aadhaar_hash = %s", (aadhaar_hash,))
        if cur.fetchone():
            raise ValueError("This Aadhaar is already registered")

        cur.execute("""
            INSERT INTO citizens
            (aadhaar_hash, full_name, dob, gender, blood_group, phone, address,
             emergency_contact_name, emergency_contact_phone, allergies,
             chronic_conditions, current_medications, insurance_provider,
             insurance_policy_number, organ_donor, registered_by)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING id
        """, (
            aadhaar_hash,
            data["full_name"], data["dob"], data["gender"], data["blood_group"],
            data["phone"], data.get("address", ""),
            data.get("emergency_contact_name", ""),
            data.get("emergency_contact_phone", ""),
            data.get("allergies", "None"),
            data.get("chronic_conditions", "None"),
            data.get("current_medications", "None"),
            data.get("insurance_provider"),
            data.get("insurance_policy_number"),
            data.get("organ_donor", False),
            data.get("registered_by", "self")
        ))
        new_id = cur.fetchone()["id"]
        conn.commit()
        return new_id
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def find_citizen_by_aadhaar(aadhaar):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM citizens WHERE aadhaar_hash = %s", (hash_aadhaar(aadhaar),))
    citizen = cur.fetchone()
    cur.close()
    conn.close()
    return _serialize(citizen) if citizen else None


def search_citizens_by_name(name):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM citizens WHERE LOWER(full_name) LIKE %s", (f"%{name.lower()}%",))
    results = cur.fetchall()
    cur.close()
    conn.close()
    return [_serialize(r) for r in results]


def get_public_citizen_info(aadhaar):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, full_name, blood_group, allergies, chronic_conditions,
               current_medications, emergency_contact_name, emergency_contact_phone,
               organ_donor, gender, dob
        FROM citizens WHERE aadhaar_hash = %s
    """, (hash_aadhaar(aadhaar),))
    citizen = cur.fetchone()
    cur.close()
    conn.close()
    if not citizen:
        return None
    d = dict(citizen)
    d["id"] = str(d["id"])
    d["dob"] = str(d["dob"]) if d["dob"] else None
    return d


def get_all_citizens():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM citizens ORDER BY created_at DESC")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [_serialize(r) for r in rows]


def _serialize(row):
    d = dict(row)
    d["id"] = str(d["id"])
    d["dob"] = str(d["dob"]) if d["dob"] else None
    d["created_at"] = str(d["created_at"]) if d.get("created_at") else None
    return d