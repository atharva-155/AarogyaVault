from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import services.citizen_service as citizen_service
import services.agent_service as agent_service

citizen_bp = Blueprint("citizen_bp", __name__)


@citizen_bp.route("/api/stats")
def stats():
    return jsonify({
        "citizens": citizen_service.get_citizen_count(),
        "agents": agent_service.get_approved_agent_count()
    })


@citizen_bp.route("/api/citizen/register", methods=["POST"])
def register_citizen():
    data = request.json
    required = ["aadhaar_number", "full_name", "dob", "gender", "blood_group", "phone"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400
    try:
        new_id = citizen_service.create_citizen(data)
        return jsonify({"vault_id": str(new_id), "message": "Registration successful"}), 201
    except ValueError as e:
        status = 409 if "already registered" in str(e) else 400
        return jsonify({"error": str(e)}), status
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@citizen_bp.route("/api/citizen/lookup")
@jwt_required()
def lookup_citizen():
    aadhaar = request.args.get("aadhaar", "").strip()
    name = request.args.get("name", "").strip()

    if aadhaar:
        citizen = citizen_service.find_citizen_by_aadhaar(aadhaar)
        if not citizen:
            return jsonify({"error": "No record found"}), 404
        return jsonify(citizen)
    elif name:
        return jsonify(citizen_service.search_citizens_by_name(name))
    return jsonify({"error": "Provide aadhaar or name"}), 400


@citizen_bp.route("/api/citizen/lookup/public")
def public_lookup():
    aadhaar = request.args.get("aadhaar", "").strip()
    if not aadhaar:
        return jsonify({"error": "Aadhaar required"}), 400
    citizen = citizen_service.get_public_citizen_info(aadhaar)
    if not citizen:
        return jsonify({"error": "No record found"}), 404
    return jsonify(citizen)


@citizen_bp.route("/api/citizens/all")
def all_citizens():
    return jsonify(citizen_service.get_all_citizens())