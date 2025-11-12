import React, { useRef, useState } from "react";

// api key
const REACT_APP_DEEPGRAM_API_KEY = "75a568d0d5854317749de01078ab3567024b6bcb";

export default function MicRecorder({ onTranscript }) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");
  
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);

  async function startRecording() {
    try {
      setError("");
      console.log("Starting recording");

      const dgKey = REACT_APP_DEEPGRAM_API_KEY;
      
      if (!dgKey) {
        throw new Error("Deepgram API key not found");
      }

      console.log("API Key found:", dgKey.substring(0, 10) + "...");

      // Request microphone access with specific settings
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      console.log("Microphone access granted");

      // Create Audio Context for raw PCM processing
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });
      audioContextRef.current = audioContext;

      // Connect to Deepgram WebSocket with raw PCM settings
      console.log("🔌 Connecting to Deepgram...");
      const wsUrl = "wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&channels=1&model=nova-2&punctuate=true&interim_results=true";
      const socket = new WebSocket(wsUrl, ["token", dgKey]);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log("onnected to Deepgram");
        setIsRecording(true);

        //  audio processing pipeline
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(audioContext.destination);

        let chunkCount = 0;

        processor.onaudioprocess = (e) => {
          if (socket.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Convert Float32Array to Int16Array (PCM 16-bit)
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {

              const s = Math.max(-1, Math.min(1, inputData[i]));
              pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            socket.send(pcmData.buffer);
            chunkCount++;
            
            if (chunkCount % 10 === 0) {
              console.log(`Sent ${chunkCount} audio chunks (${pcmData.buffer.byteLength} bytes each)`);
            }
          }
        };

        console.log("udio processor started, sending raw PCM data");
      };

      socket.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          console.log("Deepgram response:", data);
          
          // Parse transcript from response
          const transcript = data.channel?.alternatives?.[0]?.transcript;
          const isFinal = data.is_final;
          
          if (transcript && transcript.trim()) {
            console.log("Transcript:", transcript, isFinal ? "(FINAL)" : "(interim)");
            onTranscript(transcript, isFinal);
          } else {
            // Log even empty responses to see if we're getting anything
            console.log("Empty response/no transcript in:", data);
          }
        } catch (err) {
          console.error("Error parsing message:", err, msg.data);
        }
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
        setError("Connection error - check API key and internet");
        setIsRecording(false);
      };

      socket.onclose = (event) => {
        console.log("🔇 Connection closed. Code:", event.code, "Reason:", event.reason);
        if (event.code === 1002) {
          setError("Invalid API key or authentication failed");
        } else if (event.code !== 1000) {
          setError(`Connection closed (Code: ${event.code})`);
        }
        setIsRecording(false);
      };

    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
      setIsRecording(false);
    }
  }

  function stopRecording() {
    console.log("Stopping recording...");

    // Disconnect audio processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
      console.log("Processor disconnected");
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      console.log("Audio context closed");
    }

    // Close WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close(1000, "User stopped recording");
      console.log("WebSocket closed");
    }

    // Stop audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      console.log("Audio stream stopped");
    }

    setIsRecording(false);
  }

  return (
    <div>
      <button
        onClick={isRecording ? stopRecording : startRecording}
        style={{
          padding: "0.75rem 1.5rem",
          fontSize: "1.1rem",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          background: isRecording 
            ? "linear-gradient(135deg,rgba(71, 255, 83, 0.31),rgb(133, 72, 255))"
            : "linear-gradient(135deg,rgb(219, 234, 102),rgb(50, 191, 243))",
          color: "white",
          fontWeight: "bold",
          transition: "transform 0.2s"
        }}
        onMouseOver={(e) => e.target.style.transform = "scale(1.05)"}
        onMouseOut={(e) => e.target.style.transform = "scale(1)"}
      >
        {isRecording ? "⏹ Stop Recording" : "⏺ Start Recording"}
      </button>

      {isRecording && (
        <div style={{ 
          marginTop: "0.5rem", 
          color: "#ff4757",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "0.9rem"
        }}>
          <span style={{
            width: "10px",
            height: "10px",
            background: "red",
            borderRadius: "50%",
            animation: "pulse 1.5s infinite"
          }}></span>
          <strong>Recording - Speak VERY LOUDLY and CLEARLY!</strong>
        </div>
      )}

      {error && (
        <div style={{
          marginTop: "0.5rem",
          padding: "0.75rem",
          background: "rgba(255, 0, 0, 0)",
          border: "1px solid red",
          borderRadius: "6px",
          color: "red",
          fontSize: "0.9rem"
        }}>
        {error}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}