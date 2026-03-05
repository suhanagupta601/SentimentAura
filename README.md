# SentimentAura

A full-stack web application that performs real-time speech transcription, an AI-powered sentiment and keyword analysis, and Perlin-noise inspired live visualization driven by human speech. 

As the user speaks, their words will appear live on screen. Then, the transcribed audio is analyzed by an LLM for emotional sentiment and key emotions, which inform the Perlin-noise visual (the "aura"). The "aura" is then displayed in correspondence to the scored emotion.

---

## Features

- 🎙 **Audio Transcription**: it streams the user's audio via WebSockets to the live transcription API and displays the transcribed version live, with an autoscrolling feature of the transcription in the UI.


- 🎭 **AI Sentiment & Keyword Extraction**: the transcript segments are sent to the back end, which calls the LLM API to extract a sentiment score (based on a 0 - 1 scale) and keywords. Finally, it returns the formatted JSON to the frontend.

- 🖼️ **Visualization**: a 600-particle Perlin-inspired visual, where color, motion, and intensity react to sentiment/emotional changes.

## Tech-Stack: 
React, JavaScript, Python (FastAPI), WebSockets, p5.js, LLM APIs

### External: 
- **Transcription API:** Used for speech-to-text via WebSockets
- **LLM API:** To determine sentiment analysis and keyword extraction


## Instructions:
1. User clicks **Start** to access the microphone
2. The audio is streamed to the transcription API via WebSockets 
3. The transcripted JSON is streamed back to the frontend
4. Those transcript segments are sent to the backend (`/process_text`)
5. Backend calls LLM API for sentiment & keywords
6. Frontend receives structured AI output
7. Visualization and UI finally update live
