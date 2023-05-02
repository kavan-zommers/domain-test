const recordButton = document.getElementById("recordButton");
const status = document.getElementById("status");
const transcription = document.getElementById("transcription");
const gptResponse = document.getElementById("gptResponse");

let isRecording = false;
let mediaRecorder;
let recordedChunks = [];

async function postData(url = "", data = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return await response.json();
}

recordButton.addEventListener("click", async () => {
  if (!isRecording) {
    isRecording = true;
    recordButton.textContent = "Stop Recording";
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();

    mediaRecorder.addEventListener("dataavailable", (event) => {
      recordedChunks.push(event.data);
    });

    mediaRecorder.addEventListener("stop", async () => {
      const audioBlob = new Blob(recordedChunks, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", audioBlob);
      status.textContent = "Processing";

      const transcriptionResult = await postData("/transcribe", formData);
      transcription.textContent = transcriptionResult.text;

      const gptResult = await postData("/complete_text", {
        text: transcriptionResult.text
      });
      gptResponse.textContent = gptResult.response;
      status.textContent = "";
    });
  } else {
    isRecording = false;
    recordButton.textContent = "Record";
    mediaRecorder.stop();
    recordedChunks = [];
  }
});
