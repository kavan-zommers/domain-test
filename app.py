import os
import openai
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY

@app.route("/transcribe", methods=["POST"])
def transcribe():
    audio_file = request.files["audio"]
    response = openai.Speech.transcribe(audio_file)
    return jsonify({"text": response.data["text"]})

@app.route("/complete_text", methods=["POST"])
def complete_text():
    text = request.json["text"]
    prompt = f"{text}"
    response = openai.Com
