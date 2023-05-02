import os
import openai
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
WHISPER_API_BASE_URL = "https://api.openai.com/v1/whisper/speech"
GPT_API_BASE_URL = "https://api.openai.com/v1/engines/davinci-codex/completions"

app = Flask(__name__)
app.config["DEBUG"] = False
CORS(app, resources={r"/*": {"origins": ["https://www.kavanzommers.com", "http://127.0.0.1:8000"]}})


def transcribe_audio(audio_file):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}"
    }
    
    with open(audio_file, "rb") as f:
        audio_data = f.read()

    response = requests.post(
        WHISPER_API_BASE_URL,
        headers=headers,
        data=audio_data
    )

    response.raise_for_status()
    return response.json()["text"]

def complete_text(prompt):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}"
    }
    
    data = {
        "prompt": prompt,
        "max_tokens": 50,
        "n": 1,
        "stop": None,
        "temperature": 1.0
    }

    response = requests.post(
        GPT_API_BASE_URL,
        headers=headers,
        json=data
    )

    response.raise_for_status()
    return response.json()["choices"][0]["text"]

@app.route("/transcribe", methods=["POST"])
def transcribe_route():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]
    filename = secure_filename(audio_file.filename)
    audio_file.save(filename)

    transcription = transcribe_audio(filename)
    os.remove(filename)

    return jsonify({"text": transcription})

@app.route("/complete_text", methods=["POST"])
def complete_text_route():
    text = request.json.get("text")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    response_text = complete_text(text)
    return jsonify({"response": response_text})

if __name__ == "__main__":
    app.run(debug=True)
