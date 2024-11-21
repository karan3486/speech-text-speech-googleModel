from flask import Flask, render_template, request, jsonify, send_file
from utility import transcribe_audio, get_reply, generate_tts
from dotenv import load_dotenv
import os

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/transcribe", methods=["POST"])
def transcribe():
    audio_file = request.files["audio"]
    transcription = transcribe_audio(audio_file)
    if transcription.startswith("Error"):
        return jsonify({"error": transcription}), 400
    reply = get_reply(transcription)
    tts_audio_path = generate_tts(reply)
    return jsonify({
        "transcription": transcription,
        "reply": reply,
        "audio_url": f"/audio/{os.path.basename(tts_audio_path)}"
    })

@app.route("/audio/<filename>")
def audio(filename):
    return send_file(f"./static/audio/{filename}")

if __name__ == "__main__":
    app.run(debug=True)
