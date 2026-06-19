import bcrypt
from flask_jwt_extended import create_access_token
from database import get_db


def get_approved_agent_count():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) as cnt FROM agents WHERE is_approved = TRUE")
    count = cur.fetchone()["cnt"]
    cur.close()
    conn.close()
    return count


def register_agent(data):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id FROM agents WHERE employee_id = %s OR email = %s",
                    (data["employee_id"], data["email"]))
        if cur.fetchone():
            raise ValueError("Employee ID or email already registered")

        pw_hash = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt()).decode()
        cur.execute("""
            INSERT INTO agents (employee_id, full_name, department, email, password_hash, is_approved)
            VALUES (%s,%s,%s,%s,%s, FALSE) RETURNING id
        """, (data["employee_id"], data["full_name"], data["department"],
              data["email"], pw_hash))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def authenticate_agent(employee_id, password):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM agents WHERE employee_id = %s", (employee_id,))
    agent = cur.fetchone()
    cur.close()
    conn.close()

    if not agent:
        raise ValueError("Invalid credentials")
    if not bcrypt.checkpw(password.encode(), agent["password_hash"].encode()):
        raise ValueError("Invalid credentials")
    if not agent["is_approved"]:
        raise PermissionError("Account pending approval")

    token = create_access_token(identity={
        "id": str(agent["id"]),
        "employee_id": agent["employee_id"],
        "full_name": agent["full_name"],
        "department": agent["department"]
    })
    return {
        "token": token,
        "agent": {
            "id": str(agent["id"]),
            "employee_id": agent["employee_id"],
            "full_name": agent["full_name"],
            "department": agent["department"]
        }
    }