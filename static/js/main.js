let mediaRecorder;
let audioChunks = [];
let timerInterval;
let timerSeconds = 0;

const chatBox = document.getElementById("chat-box");
const recordButton = document.getElementById("record-button");
const recordingControls = document.getElementById("recording-controls");
const deleteButton = document.getElementById("delete-button");
const sendButton = document.getElementById("send-button");
const recordingTimer = document.getElementById("recording-timer");
const waveAnimation = document.getElementById("wave-animation");

// Add wave animation dynamically
function startWaveAnimation() {
  waveAnimation.innerHTML = `
        <span></span><span></span><span></span><span></span><span></span>
    `;
}

// Stop wave animation
function stopWaveAnimation() {
  waveAnimation.innerHTML = "";
}

// Update recording timer
function updateTimer() {
  timerSeconds++;
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  recordingTimer.innerText = `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

// Start recording
recordButton.addEventListener("click", () => {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      // Use consistent MIME type
      const options = { mimeType: "audio/webm;codecs=opus" };
      mediaRecorder = new MediaRecorder(stream, options);
      audioChunks = [];

      // Show recording controls
      recordButton.classList.add("hidden");
      recordingControls.classList.remove("hidden");

      // Start timer and wave animation
      timerSeconds = 0;
      updateTimer();
      timerInterval = setInterval(updateTimer, 1000);
      startWaveAnimation();

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        clearInterval(timerInterval);
        stopWaveAnimation();

        // Verify that audio data is valid
        if (audioChunks.length === 0) {
          console.error("No audio data available.");
          alert("Recording failed. Please try again.");
          return;
        }

        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        if (audioBlob.size === 0) {
          console.error("Audio Blob is empty.");
          alert("Recording failed. Please try again.");
          return;
        }

        console.log("Recording complete. Blob size:", audioBlob.size);
      };

      mediaRecorder.start();
    })
    .catch((error) => {
      console.error("Error accessing microphone:", error);
      alert("Microphone access is required to record audio.");
    });
});

// Stop recording and reset controls
deleteButton.addEventListener("click", () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }
  audioChunks = []; // Clear recorded audio
  recordingControls.classList.add("hidden");
  recordButton.classList.remove("hidden");
});

// Send recording
sendButton.addEventListener("click", () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }

  const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
  if (audioBlob.size === 0) {
    console.error("Audio Blob is empty. Cannot send.");
    // alert("Recording failed. Please try again.");
    return;
  }

  const formData = new FormData();
  formData.append("audio", audioBlob, "audio.webm");

  // Reset controls
  recordingControls.classList.add("hidden");
  recordButton.classList.remove("hidden");

  // Send audio to server
  fetch("/transcribe", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        addMessage("Error: " + data.error, false);
      } else {
        addMessage(data.transcription, true);
        addMessage(data.reply, false);

        // Add audio response
        const audioElement = document.createElement("audio");
        audioElement.src = data.audio_url + "?t=" + new Date().getTime();
        audioElement.controls = true;
        chatBox.appendChild(audioElement);
        chatBox.scrollTop = chatBox.scrollHeight;
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      addMessage("An error occurred while sending the recording.", false);
    });
});

// Add chat messages
function addMessage(content, isUser = true) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user-message" : "bot-message"}`;
  messageDiv.innerText = content;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}
