// src/MakeAura.js - Simple Perlin Field
import React, { useRef, useEffect } from "react";
import Sketch from "react-p5";

export default function MakeAura({ sentiment = 0.5, emotion = "neutral" }) {
  let t = 0;
  let particles = [];
  const numParticles = 600;
  
  const currentHue = useRef(30);
  const targetHue = useRef(30);

  useEffect(() => {
    const emotionLower = emotion?.toLowerCase() || "neutral";
    
    if (emotionLower.includes("happy") || emotionLower.includes("joy") || emotionLower === "positive" || emotionLower === "excited") {
      targetHue.current = 50;  // = Yellow-Orange (happy)
    } else if (emotionLower.includes("sad") || emotionLower.includes("disappointed") || emotionLower === "negative") {
      targetHue.current = 140; // =  Green (sad/negative)
    } else if (emotionLower.includes("angry") || emotionLower.includes("frustrated")) {
      targetHue.current = 0;   // = Red (angry)
    } else if (emotionLower === "calm" || emotionLower === "content") {
      targetHue.current = 160; // = Teal/Cyan (calm)
    } else {
      targetHue.current = 30;  // = Orange (neutral)
    }
  }, [emotion]);

  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(window.innerWidth, window.innerHeight).parent(canvasParentRef);
    p5.colorMode(p5.HSB);
    
    // Create particles
    particles = [];
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: p5.random(p5.width),
        y: p5.random(p5.height),
        prevX: p5.random(p5.width),
        prevY: p5.random(p5.height)
      });
    }
  };

  const draw = (p5) => {
    currentHue.current += (targetHue.current - currentHue.current) * 0.05;
    const hue = currentHue.current;
    
    p5.background(0, 0, 10, 0.1);

    // Draw particles following Perlin noise article way 
    for (let particle of particles) {

      const noiseVal = p5.noise(
        particle.x * 0.003,
        particle.y * 0.003,
        t
      );
      
      const angle = noiseVal * p5.TWO_PI * 2;
      
      // Update position
      particle.prevX = particle.x;
      particle.prevY = particle.y;
      particle.x += p5.cos(angle) * 1;
      particle.y += p5.sin(angle) * 1;
      
      if (particle.x < 0) particle.x = p5.width;
      if (particle.x > p5.width) particle.x = 0;
      if (particle.y < 0) particle.y = p5.height;
      if (particle.y > p5.height) particle.y = 0;
      
      // Draw dots/particles
      p5.noStroke();
      p5.fill(hue, 80, 85, 0.8);
      p5.circle(particle.x, particle.y, 3);
    }
    
    t += 0.005;
  };

  return <Sketch setup={setup} draw={draw} />;
}