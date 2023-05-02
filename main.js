const recordButton = document.getElementById("recordButton");
const status = document.getElementById("status");
const transcription = document.getElementById("transcription");
const gptResponse = document.getElementById("gptResponse");
const recordingStatus = document.getElementById("recordingStatus");

let isRecording = false;
let mediaRecorder;
let recordedChunks = [];

async function postData(url = "", data = {}) {
  const isFormData = data instanceof FormData;
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
}


recordButton.addEventListener("click", async () => {
  if (!isRecording) {
    isRecording = true;
    recordButton.textContent = "Stop Recording";
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();

    mediaRecorder.addEventListener("stop", async () => {
      // Stop the media stream tracks
      stream.getTracks().forEach((track) => track.stop());
    
      recordingStatus.textContent = "Audio has been successfully recorded"; // Add this line
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

