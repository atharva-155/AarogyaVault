from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import services.lookup_service as lookup_service

lookup_bp = Blueprint("lookup_bp", __name__)


@lookup_bp.route("/api/lookup/log", methods=["POST"])
@jwt_required()
def log_lookup():
    identity = get_jwt_identity()
    data = request.json
    try:
        lookup_service.log_lookup(identity["id"], data.get("citizen_id"), data.get("reason", ""))
        return jsonify({"message": "Logged"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@lookup_bp.route("/api/lookups/recent")
@jwt_required()
def recent_lookups():
    identity = get_jwt_identity()
    return jsonify(lookup_service.get_recent_lookups(identity["id"]))