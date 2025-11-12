import React, { useState } from "react";
import MakeAura from "./MakeAura";
import MicRecorder from "./MicRecorder";

// in full
export default function App() {
  const [sentiment, setSentiment] = useState(0.5);
  const [emotion, setEmotion] = useState("neutral");
  const [keywords, setKeywords] = useState([]);
  const [transcript, setTranscript] = useState("");
  const [allTranscripts, setAllTranscripts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleTranscript(text, isFinal) {
    console.log("Received transcript:", text, "isFinal:", isFinal);
    
    setTranscript(text);
    
    setAllTranscripts(prev => [...prev, { text, isFinal, timestamp: Date.now() }]);

    if (isFinal && text.trim().length > 3) {
      console.log("Final transcript detected, sending to backend...");
      setIsLoading(true);
      setError("");

      try {
        console.log("📤 Sending to backend:", text);
        
        const res = await fetch("http://localhost:8000/process_text/process_text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        console.log("Response status:", res.status);
        const data = await res.json();
        console.log("Backend response:", data);

        if (data.success) {
          console.log("Analysis successful!");
          setSentiment(data.sentiment);
          setEmotion(data.emotion);
          setKeywords(data.keywords);
        } 
        
        else {
          console.warn("Backend returned error:", data.error);
          setError(data.error);
        }
        
      } catch (e) {
        console.error("Error fetching sentiment:", e);
        setError("Could not connect to backend: " + e.message);
      }

      setIsLoading(false);
    } 
    
    else if (isFinal) {
      console.log("⚠️ Final transcript too short (less than 3 chars):", text);
    }
  }

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      {/* Aura visuals */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}>
        <MakeAura sentiment={sentiment} />
      </div>

      {/* UI */}
      <div
        style={{
          position: "absolute",
          top: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(255,255,255,0.9)",
          padding: "2rem",
          borderRadius: "12px",
          zIndex: 2,
          width: "70%",
          maxWidth: "700px",
          maxHeight: "90vh",
          overflowY: "auto"
        }}
      >
        <h1 style={{ marginBottom: "1rem" }}>Sentiment Aura</h1>

        {/* Microphone Controls */}
        <div style={{ marginBottom: "1.5rem" }}>
          <MicRecorder onTranscript={handleTranscript} />
        </div>

        {/* Errors */}
        {error && (
          <div style={{
            padding: "1rem",
            background: "rgba(227, 12, 12, 0.72)",
            border: "1px solid red",
            borderRadius: "8px",
            marginBottom: "1rem",
            color: "red"
          }}>
             {error}
          </div>
        )}

        {/* Ongoing Transcript */}
        <div style={{ 
          marginBottom: "1.5rem",
          padding: "1rem",
          background: "#f5f5f5",
          borderRadius: "8px",
          minHeight: "60px"
        }}>
          <strong>Transcript:</strong>
          <p style={{ 
            marginTop: "0.5rem",
            fontSize: "1.1rem",
            color: transcript ? "#333" : "#999",
            fontStyle: transcript ? "normal" : "italic"
          }}>
            {transcript}
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{
            padding: "1rem",
            background: "rgba(102, 126, 234, 0.1)",
            borderRadius: "8px",
            marginBottom: "1rem",
            textAlign: "center",
            color: "#667eea"
          }}>
            Analyzing sentiment...
          </div>
        )}

        {/* Results */}
        {!isLoading && (
          <div style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "1fr 1fr"
          }}>
            {/* Sentiment Box */}
            <div style={{
              padding: "1rem",
              background: "#fff",
              borderRadius: "8px",
              border: "1px solid #ddd"
            }}>
              <p style={{ marginBottom: "0.5rem" }}>
                <strong>General Emotion:</strong> <span style={{ 
                  color: emotion === "positive" ? "#2ed573" : 
                         emotion === "negative" ? "#ff4757" : "#667eea",
                  textTransform: "capitalize"
                }}>{emotion}</span>
              </p>
              <div style={{
                width: "100%",
                height: "20px",
                background: "#ddd",
                borderRadius: "10px",
                overflow: "hidden"
              }}>
                <div style={{
                  width: `${sentiment * 100}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #ff4757, #ffa502, #2ed573)",
                  transition: "width 0.5s ease"
                }}></div>
              </div>
              <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#666" }}>
                Sentiment: {(sentiment * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        )}

        {/* Transcript History */}
        <details style={{ marginTop: "1.5rem" }}>
          <summary style={{ 
            cursor: "pointer", 
            color: "#667eea",
            fontWeight: "bold",
            marginBottom: "0.5rem"
          }}>
            Transcript History ({allTranscripts.length})
          </summary>
          <div style={{
            maxHeight: "200px",
            overflowY: "auto",
            padding: "1rem",
            background: "#f5f5f5",
            borderRadius: "8px"
          }}>
            {allTranscripts.length === 0 ? (
              <p style={{ color: "#999", fontStyle: "italic" }}>No transcripts yet</p>
            ) : (
              allTranscripts.map((t, i) => (
                <p 
                  key={i}
                  style={{
                    marginBottom: "0.5rem",
                    padding: "0.5rem",
                    background: t.isFinal ? "white" : "rgba(255,255,255,0.5)",
                    borderRadius: "4px",
                    fontSize: "0.9rem",
                    borderLeft: t.isFinal ? "3px solidrgb(237, 237, 20)" : "3px solid #ddd"
                  }}
                >
                  {t.text} {t.isFinal && "✓"}
                </p>
              ))
            )}
          </div>
        </details>


      </div>
    </div>
  );
}