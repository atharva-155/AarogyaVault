from database import get_db


def log_lookup(agent_id, citizen_id, reason):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO emergency_lookups (agent_id, citizen_id, reason)
            VALUES (%s, %s, %s)
        """, (agent_id, citizen_id, reason))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def get_recent_lookups(agent_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT el.lookup_time, el.reason, c.full_name as patient_name
        FROM emergency_lookups el
        JOIN citizens c ON el.citizen_id = c.id
        WHERE el.agent_id = %s
        ORDER BY el.lookup_time DESC LIMIT 10
    """, (agent_id,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [{"lookup_time": str(r["lookup_time"]), "reason": r["reason"],
             "patient_name": r["patient_name"]} for r in rows]