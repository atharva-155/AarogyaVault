from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from database import init_db
from routes.citizen_routes import citizen_bp
from routes.agent_routes import agent_bp
from routes.lookup_routes import lookup_bp
from routes.face_routes import face_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)

    app.register_blueprint(citizen_bp)
    app.register_blueprint(agent_bp)
    app.register_blueprint(lookup_bp)
    app.register_blueprint(face_bp)

    return app


if __name__ == "__main__":
    init_db()
    app = create_app()
    app.run(debug=True, port=5000)