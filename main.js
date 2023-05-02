const recordButton = document.getElementById("recordButton");
const statusElement = document.getElementById("status");
const transcriptionElement = document.getElementById("transcription");
const responseElement = document.getElementById("response");

let mediaRecorder;
let chunks = [];

async function postData(url = "", data = {}) {
  const isFormData = data instanceof FormData;
  try {
    const response = await fetch(`http://127.0.0.1:5000${url}`, {
      method: "POST",
      headers: !isFormData
        ? {
            "Content-Type": "application/json"
          }
        : {},
      body: isFormData ? data : JSON.stringify(data)
    });

    // Log the response to the console
    console.log(`Response from ${url}:`, await response.clone().json());

    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    throw error;
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();

    mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      statusElement.textContent = "Processing...";

      const audioBlob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.ogg");

      try {
        const transcriptionResponse = await postData("/transcribe", formData);
        transcriptionElement.textContent = transcriptionResponse.text;

        const completionResponse = await postData("/complete_text", {
          text: transcriptionResponse.text,
        });
        responseElement.textContent = completionResponse.response;

        statusElement.textContent = "Audio has been successfully recorded";
      } catch (error) {
        statusElement.textContent = "Error processing audio";
        console.error("Error processing audio:", error);
      }
    };

    recordButton.textContent = "Stop Recording";
  } catch (error) {
    console.error("Error starting recording:", error);
  }
}

function stopRecording() {
  if (mediaRecorder) {
    mediaRecorder.stop();
    // Stop and release the MediaStream tracks
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    chunks = [];
    recordButton.textContent = "Record";
  }
}

recordButton.addEventListener("click", () => {
  if (recordButton.textContent === "Record") {
    startRecording();
  } else {
    stopRecording();
  }
});
