# SentimentAura

A full-stack web application that performs real-time speech transcription, an AI-powered sentiment and keyword analysis, and Perlin inspired live
generative art visualization driven by human speech. 

As users speak, their words appear on screen in real time. Then, the phrase is analyzed by an LLM for emotional sentiment and key emotions, on which the Perlin-noise-based visual "aura" depends. The "aura" is then displayed in the browser. 

This project demonstrates end-to-end orchestration across frontend audio streaming, backend AI inference, and data-driven generative visuals.

---

## Features

- 🎙 **Live Audio Transcription**: streams microphone audio via WebSockets to live transcription API and displays live, autoscrolling trnscript in the UI


- 🧠 **AI Sentiment & Keyword Extraction**: transcript segments are sent to the back end, which securely calls an LLM API to extract a sentiment score and keywords. Finally, it returns the formatted JSON to the frontend.

- 🎨 **Visualization**: Perlin-inspired visual, in which color, motion, and intensity react to sentiment changes.



## Tech-Stack: 
React, JavaScript, Python (FastAPI), WebSockets, p5.js, LLM APIs

### External: 
- **Transcription API:** Real-time speech-to-text via WebSockets
- **LLM API:** Sentiment analysis and keyword extraction


## Instructions:
1. User clicks **Start** → microphone access granted
2. Audio streamed to transcription API via WebSocket
3. Live transcript JSON streamed back to frontend
4. Final transcript segments sent to backend (`/process_text`)
5. Backend calls LLM API for sentiment & keywords
6. Frontend receives structured AI output
7. Visualization and UI update in real time
