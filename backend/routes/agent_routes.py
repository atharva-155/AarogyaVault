from flask import Blueprint, request, jsonify
import services.agent_service as agent_service

agent_bp = Blueprint("agent_bp", __name__)


@agent_bp.route("/api/agent/register", methods=["POST"])
def register_agent():
    data = request.json
    required = ["employee_id", "full_name", "department", "email", "password"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400
    try:
        agent_service.register_agent(data)
        return jsonify({"message": "Registration submitted. Pending admin approval."}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@agent_bp.route("/api/agent/login", methods=["POST"])
def agent_login():
    data = request.json
    if not data.get("employee_id") or not data.get("password"):
        return jsonify({"error": "Employee ID and password required"}), 400
    try:
        result = agent_service.authenticate_agent(data["employee_id"], data["password"])
        return jsonify(result)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 401