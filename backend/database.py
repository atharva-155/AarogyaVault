import bcrypt
import psycopg2
from psycopg2.extras import RealDictCursor, register_uuid
from config import Config
from utils import hash_aadhaar


def get_db():
    conn = psycopg2.connect(Config.DATABASE_URL, cursor_factory=RealDictCursor)
    register_uuid()
    return conn


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