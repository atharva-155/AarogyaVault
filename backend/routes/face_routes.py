import os
from flask import Blueprint, request, jsonify, send_from_directory
from database import get_db
from face_match import save_face_image, match_face

face_bp = Blueprint("face_bp", __name__)


@face_bp.route("/api/citizen/upload-face/<citizen_id>", methods=["POST"])
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


@face_bp.route("/api/face-match", methods=["POST"])
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


@face_bp.route("/api/citizen/face/<citizen_id>")
def get_face(citizen_id):
    # NOTE: this file is now one level deeper than app.py was,
    # so we go up two levels to reach backend/uploads
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT face_image FROM citizens WHERE id = %s::uuid", (citizen_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row or not row["face_image"]:
        return jsonify({"error": "No face image"}), 404
    return send_from_directory(upload_dir, row["face_image"])