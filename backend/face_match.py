import os
import base64
from pathlib import Path
 
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
 
 
def save_face_image(citizen_id: str, image_data: str) -> str:
    """Save base64 image to disk. Returns filename."""
    if "," in image_data:
        image_data = image_data.split(",")[1]
    img_bytes = base64.b64decode(image_data)
    filename = f"{citizen_id}.jpg"
    filepath = UPLOAD_DIR / filename
    with open(filepath, "wb") as f:
        f.write(img_bytes)
    return filename
 
 
def match_face(query_image_data: str, citizens: list) -> dict:
    """
    Match query face against all citizens.
    Returns ALL matches above 50% confidence, sorted by confidence descending.
    """
    try:
        from deepface import DeepFace
        import tempfile
 
        # Decode query image
        if "," in query_image_data:
            query_image_data = query_image_data.split(",")[1]
        query_bytes = base64.b64decode(query_image_data)
 
        # Save query image to temp file
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp.write(query_bytes)
            query_path = tmp.name
 
        matches = []
 
        for citizen in citizens:
            if not citizen.get("face_image"):
                continue
            face_path = UPLOAD_DIR / citizen["face_image"]
            if not face_path.exists():
                continue
            try:
                result = DeepFace.verify(
                    img1_path=query_path,
                    img2_path=str(face_path),
                    model_name="Facenet512",
                    enforce_detection=False,
                    silent=True
                )
                distance = result.get("distance", 1.0)
                # Convert distance to similarity percentage
                similarity = round(max(0, (1 - distance) * 100), 1)
 
                if similarity >= 50:
                    matches.append({
                        "confidence": similarity,
                        "citizen": citizen
                    })
 
            except Exception:
                continue
 
        # Cleanup temp file
        try:
            os.unlink(query_path)
        except Exception:
            pass
 
        # Sort by confidence descending
        matches.sort(key=lambda x: x["confidence"], reverse=True)
 
        if matches:
            return {
                "found": True,
                "total_matches": len(matches),
                "matches": matches
            }
        else:
            return {
                "found": False,
                "total_matches": 0,
                "matches": [],
                "message": "No match found above 50% confidence. Data not found."
            }
 
    except ImportError:
        return {"error": "DeepFace not installed. Run: pip install deepface tf-keras"}
    except Exception as e:
        return {"error": str(e)}