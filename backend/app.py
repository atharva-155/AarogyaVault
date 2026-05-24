import os
import uuid
import hashlib
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import bcrypt
import psycopg2
from psycopg2.extras import RealDictCursor, register_uuid
from face_match import save_face_image, match_face
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "aarogyavault-secret-key-2024")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=8)
jwt = JWTManager(app)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/aarogyavault")


def get_db():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    register_uuid()
    return conn


def hash_aadhaar(aadhaar: str) -> str:
    return hashlib.sha256(aadhaar.strip().encode()).hexdigest()


def init_db():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";

        CREATE TABLE IF NOT EXISTS agents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            employee_id VARCHAR(50) UNIQUE NOT NULL,
            full_name VARCHAR(200) NOT NULL,
            department VARCHAR(200) NOT NULL,
            email VARCHAR(200) UNIQUE NOT NULL,
            password_hash VARCHAR(200) NOT NULL,
            is_approved BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS citizens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            aadhaar_hash VARCHAR(64) UNIQUE NOT NULL,
            full_name VARCHAR(200) NOT NULL,
            dob DATE NOT NULL,
            gender VARCHAR(20) NOT NULL,
            blood_group VARCHAR(5) NOT NULL,
            phone VARCHAR(15) NOT NULL,
            address TEXT,
            emergency_contact_name VARCHAR(200),
            emergency_contact_phone VARCHAR(15),
            allergies TEXT,
            chronic_conditions TEXT,
            current_medications TEXT,
            insurance_provider VARCHAR(200),
            insurance_policy_number VARCHAR(100),
            organ_donor BOOLEAN DEFAULT FALSE,
            registered_by VARCHAR(100) DEFAULT 'self',
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS emergency_lookups (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            agent_id UUID REFERENCES agents(id),
            citizen_id UUID REFERENCES citizens(id),
            lookup_time TIMESTAMP DEFAULT NOW(),
            reason TEXT
        );
    """)
    conn.commit()
    
    cur.execute("ALTER TABLE citizens ADD COLUMN IF NOT EXISTS face_image VARCHAR(200);")
    conn.commit()

    cur.execute("SELECT COUNT(*) as cnt FROM citizens")
    row = cur.fetchone()
    if row["cnt"] == 0:
        seed_data(cur)
        conn.commit()

    cur.close()
    conn.close()
    print("Database initialized.")


def seed_data(cur):
    citizens = [
        ("234567890123", "Rahul Sharma", "1985-03-12", "Male", "B+", "9876543210",
         "12 MG Road, Indore, MP", "Priya Sharma", "9876543210",
         "Penicillin", "Hypertension", "Amlodipine 5mg",
         "Star Health", "SH-2023-88234", True),
        ("345678901234", "Meera Joshi", "1992-07-22", "Female", "O+", "9988776655",
         "45 Vijay Nagar, Bhopal, MP", "Suresh Joshi", "9988776655",
         "Sulfa drugs", "Type 2 Diabetes", "Metformin 500mg",
         "PMJAY", "PMJAY-MP-443322", False),
        ("456789012345", "Arjun Patel", "1978-11-05", "Male", "A-", "9871234567",
         "7 Palasia, Indore, MP", "Kavita Patel", "9871234567",
         "None", "Asthma", "Salbutamol inhaler",
         "LIC Health", "LIC-H-67890", True),
        ("567890123456", "Sunita Verma", "2001-01-30", "Female", "AB+", "9765432109",
         "23 New Market, Bhopal, MP", "Ramesh Verma", "9765432109",
         "Aspirin", "None", "None",
         None, None, False),
        ("678901234567", "Deepak Yadav", "1965-09-18", "Male", "O-", "9654321098",
         "88 Ratlam Kothi, Indore, MP", "Anjali Yadav", "9654321098",
         "Latex, Ibuprofen", "Coronary Artery Disease, Hypothyroidism",
         "Atorvastatin 10mg, Levothyroxine 50mcg",
         "New India Assurance", "NIA-2022-1122", True),
        ("789012345678", "Priya Nair", "1988-05-14", "Female", "B-", "9543210987",
         "5 Arera Colony, Bhopal, MP", "Rajan Nair", "9543210987",
         "None", "Epilepsy", "Sodium Valproate 500mg",
         "Arogya Sanjeevani", "AS-2021-5566", False),
    ]

    for c in citizens:
        cur.execute("""
            INSERT INTO citizens
            (aadhaar_hash, full_name, dob, gender, blood_group, phone, address,
             emergency_contact_name, emergency_contact_phone, allergies,
             chronic_conditions, current_medications, insurance_provider,
             insurance_policy_number, organ_donor, registered_by)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'self')
        """, (hash_aadhaar(c[0]), c[1], c[2], c[3], c[4], c[5], c[6],
              c[7], c[8], c[9], c[10], c[11], c[12], c[13], c[14]))

    agents = [
        ("GOV-IND-001", "Dr. Rajesh Kumar", "District Hospital Indore",
         "rajesh.kumar@gov.in", "agent123", True),
        ("GOV-BPL-002", "Smt. Anita Singh", "PHC Bhopal",
         "anita.singh@gov.in", "agent123", True),
    ]

    for a in agents:
        pw_hash = bcrypt.hashpw(a[4].encode(), bcrypt.gensalt()).decode()
        cur.execute("""
            INSERT INTO agents (employee_id, full_name, department, email, password_hash, is_approved)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (a[0], a[1], a[2], a[3], pw_hash, a[5]))

    print("Seed data inserted.")


@app.route("/api/stats")
def stats():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) as cnt FROM citizens")
    citizens_count = cur.fetchone()["cnt"]
    cur.execute("SELECT COUNT(*) as cnt FROM agents WHERE is_approved = TRUE")
    agents_count = cur.fetchone()["cnt"]
    cur.close()
    conn.close()
    return jsonify({"citizens": citizens_count, "agents": agents_count})


@app.route("/api/citizen/register", methods=["POST"])
def register_citizen():
    data = request.json
    required = ["aadhaar_number", "full_name", "dob", "gender", "blood_group", "phone"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    aadhaar = data["aadhaar_number"].strip()
    if len(aadhaar) != 12 or not aadhaar.isdigit():
        return jsonify({"error": "Aadhaar must be exactly 12 digits"}), 400

    conn = get_db()
    cur = conn.cursor()
    try:
        aadhaar_hash = hash_aadhaar(aadhaar)
        cur.execute("SELECT id FROM citizens WHERE aadhaar_hash = %s", (aadhaar_hash,))
        if cur.fetchone():
            return jsonify({"error": "This Aadhaar is already registered"}), 409

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
        return jsonify({"vault_id": str(new_id), "message": "Registration successful"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


@app.route("/api/agent/register", methods=["POST"])
def register_agent():
    data = request.json
    required = ["employee_id", "full_name", "department", "email", "password"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id FROM agents WHERE employee_id = %s OR email = %s",
                    (data["employee_id"], data["email"]))
        if cur.fetchone():
            return jsonify({"error": "Employee ID or email already registered"}), 409

        pw_hash = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt()).decode()
        cur.execute("""
            INSERT INTO agents (employee_id, full_name, department, email, password_hash, is_approved)
            VALUES (%s,%s,%s,%s,%s, FALSE) RETURNING id
        """, (data["employee_id"], data["full_name"], data["department"],
              data["email"], pw_hash))
        conn.commit()
        return jsonify({"message": "Registration submitted. Pending admin approval."}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


@app.route("/api/agent/login", methods=["POST"])
def agent_login():
    data = request.json
    if not data.get("employee_id") or not data.get("password"):
        return jsonify({"error": "Employee ID and password required"}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM agents WHERE employee_id = %s", (data["employee_id"],))
    agent = cur.fetchone()
    cur.close()
    conn.close()

    if not agent:
        return jsonify({"error": "Invalid credentials"}), 401
    if not bcrypt.checkpw(data["password"].encode(), agent["password_hash"].encode()):
        return jsonify({"error": "Invalid credentials"}), 401
    if not agent["is_approved"]:
        return jsonify({"error": "Account pending approval"}), 403

    token = create_access_token(identity={
        "id": str(agent["id"]),
        "employee_id": agent["employee_id"],
        "full_name": agent["full_name"],
        "department": agent["department"]
    })
    return jsonify({
        "token": token,
        "agent": {
            "id": str(agent["id"]),
            "employee_id": agent["employee_id"],
            "full_name": agent["full_name"],
            "department": agent["department"]
        }
    })


@app.route("/api/citizen/lookup")
@jwt_required()
def lookup_citizen():
    aadhaar = request.args.get("aadhaar", "").strip()
    name = request.args.get("name", "").strip()
    conn = get_db()
    cur = conn.cursor()

    if aadhaar:
        cur.execute("SELECT * FROM citizens WHERE aadhaar_hash = %s", (hash_aadhaar(aadhaar),))
        citizen = cur.fetchone()
        cur.close()
        conn.close()
        if not citizen:
            return jsonify({"error": "No record found"}), 404
        d = dict(citizen)
        d["id"] = str(d["id"])
        d["dob"] = str(d["dob"]) if d["dob"] else None
        d["created_at"] = str(d["created_at"]) if d["created_at"] else None
        return jsonify(d)
    elif name:
        cur.execute("SELECT * FROM citizens WHERE LOWER(full_name) LIKE %s", (f"%{name.lower()}%",))
        results = cur.fetchall()
        cur.close()
        conn.close()
        out = []
        for r in results:
            d = dict(r)
            d["id"] = str(d["id"])
            d["dob"] = str(d["dob"]) if d["dob"] else None
            d["created_at"] = str(d["created_at"]) if d["created_at"] else None
            out.append(d)
        return jsonify(out)
    else:
        return jsonify({"error": "Provide aadhaar or name"}), 400


@app.route("/api/citizen/lookup/public")
def public_lookup():
    aadhaar = request.args.get("aadhaar", "").strip()
    if not aadhaar:
        return jsonify({"error": "Aadhaar required"}), 400

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
        return jsonify({"error": "No record found"}), 404
    d = dict(citizen)
    d["id"] = str(d["id"])
    d["dob"] = str(d["dob"]) if d["dob"] else None
    return jsonify(d)


@app.route("/api/citizens/all")
def all_citizens():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM citizens ORDER BY created_at DESC")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["id"] = str(d["id"])
        d["dob"] = str(d["dob"]) if d["dob"] else None
        d["created_at"] = str(d["created_at"]) if d["created_at"] else None
        result.append(d)
    return jsonify(result)


@app.route("/api/lookup/log", methods=["POST"])
@jwt_required()
def log_lookup():
    identity = get_jwt_identity()
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO emergency_lookups (agent_id, citizen_id, reason)
            VALUES (%s, %s, %s)
        """, (identity["id"], data.get("citizen_id"), data.get("reason", "")))
        conn.commit()
        return jsonify({"message": "Logged"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


@app.route("/api/lookups/recent")
@jwt_required()
def recent_lookups():
    identity = get_jwt_identity()
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT el.lookup_time, el.reason, c.full_name as patient_name
        FROM emergency_lookups el
        JOIN citizens c ON el.citizen_id = c.id
        WHERE el.agent_id = %s
        ORDER BY el.lookup_time DESC LIMIT 10
    """, (identity["id"],))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    result = [{"lookup_time": str(r["lookup_time"]), "reason": r["reason"],
               "patient_name": r["patient_name"]} for r in rows]
    return jsonify(result)



@app.route("/api/citizen/upload-face/<citizen_id>", methods=["POST"])
def upload_face(citizen_id):
    data = request.json
    image_data = data.get("image")
    if not image_data:
        return jsonify({"error": "No image provided"}), 400
    try:
        filename = save_face_image(citizen_id, image_data)
        conn = get_db()
        cur = conn.cursor()
        cur.execute("UPDATE citizens SET face_image = %s WHERE id = %s::uuid",
                    (filename, citizen_id))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Face image saved", "filename": filename})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/face-match", methods=["POST"])
def face_match_lookup():
    data = request.json
    image_data = data.get("image")
    if not image_data:
        return jsonify({"error": "No image provided"}), 400
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, full_name, blood_group, allergies, chronic_conditions,
                   current_medications, emergency_contact_name, emergency_contact_phone,
                   organ_donor, gender, dob, face_image
            FROM citizens WHERE face_image IS NOT NULL
        """)
        citizens = cur.fetchall()
        cur.close()
        conn.close()
        citizens_list = []
        for c in citizens:
            d = dict(c)
            d["id"] = str(d["id"])
            d["dob"] = str(d["dob"]) if d["dob"] else None
            citizens_list.append(d)
        result = match_face(image_data, citizens_list)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/citizen/face/<citizen_id>")
def get_face(citizen_id):
    from flask import send_from_directory
    upload_dir = os.path.join(os.path.dirname(__file__), "uploads")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT face_image FROM citizens WHERE id = %s::uuid", (citizen_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row or not row["face_image"]:
        return jsonify({"error": "No face image"}), 404
    return send_from_directory(upload_dir, row["face_image"])



if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
