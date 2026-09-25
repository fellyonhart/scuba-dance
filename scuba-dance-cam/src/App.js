// src/App.js
import React, { useRef, useEffect, useState, useCallback } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import * as cam from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import "./App.css";

import scubaCatGif from "./assets/scuba-cat.gif";
import musicFile from "./assets/music.mp3";

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;
const GIF_SIZE = 350;
const MIN_FRAME_INTERVAL = 50;
const HAND_DETECT_FRAMES = 3;
const HAND_LOST_FRAMES = 8;

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);

  const [instruction, setInstruction] = useState(
    "TUNGGUIN TANGAN MU MUNCUL DI KAMERA..."
  );
  const [danceActive, setDanceActive] = useState(false);
  const [catPositions, setCatPositions] = useState([]);

  const handDetectedRef = useRef(false);
  const visibleFramesRef = useRef(0);
  const missingFramesRef = useRef(0);
  const processingFrameRef = useRef(false);
  const lastFrameTimeRef = useRef(0);

  // 1. FUNGSI DETEKSI MEDIA PIPE
  const onResults = useCallback((results) => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const canvasCtx = canvasElement.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    const detectedHands = results.multiHandLandmarks || [];
    detectedHands.forEach((landmarks) => {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 2
      });
      drawLandmarks(canvasCtx, landmarks, {
        color: "#FF0000",
        lineWidth: 1,
        radius: 3
      });
    });

    const isAnyHandVisible = detectedHands.some((landmarks) => {
      const wrist = landmarks[0];
      return (
        wrist && wrist.x >= 0 && wrist.x <= 1 && wrist.y >= 0 && wrist.y <= 1
      );
    });

    if (isAnyHandVisible) {
      visibleFramesRef.current += 1;
      missingFramesRef.current = 0;
    } else {
      missingFramesRef.current += 1;
      visibleFramesRef.current = 0;
    }

    if (
      visibleFramesRef.current >= HAND_DETECT_FRAMES &&
      !handDetectedRef.current
    ) {
      console.log("🎉 TANGAN TERDETEKSI - KICAU MANIA ON!");
      handDetectedRef.current = true;
      setDanceActive(true);
      setInstruction("✨ KICAU MANIA AKTIF! ✨");

      const randomPositions = Array.from({ length: 5 }).map(() => ({
        top: Math.random() * (VIDEO_HEIGHT - GIF_SIZE),
        left: Math.random() * (VIDEO_WIDTH - GIF_SIZE),
        rotate: Math.floor(Math.random() * 60) - 30
      }));
      setCatPositions(randomPositions);

      // RESUME AUDIO
      if (audioRef.current) {
        audioRef.current.play().catch((err) => {
          console.warn("⚠️ Audio autoplay blocked - klik layar dulu!", err);
        });
      }
    } else if (
      missingFramesRef.current >= HAND_LOST_FRAMES &&
      handDetectedRef.current
    ) {
      console.log("❌ TANGAN HILANG - KICAU MANIA OFF");
      handDetectedRef.current = false;
      setDanceActive(false);
      setInstruction("TUNGGUIN TANGAN MU MUNCUL DI KAMERA...");
      setCatPositions([]);

      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
    canvasCtx.restore();
  }, []);

  // 3. SETUP KAMERA & MEDIA PIPE
  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      selfieMode: false,
      smoothLandmarks: true,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.65
    });

    hands.onResults(onResults);

    let camera = null;
    if (videoRef.current) {
      camera = new cam.Camera(videoRef.current, {
        onFrame: async () => {
          const now = performance.now();
          if (
            !videoRef.current ||
            processingFrameRef.current ||
            now - lastFrameTimeRef.current < MIN_FRAME_INTERVAL
          )
            return;

          processingFrameRef.current = true;
          lastFrameTimeRef.current = now;
          try {
            await hands.send({ image: videoRef.current });
          } finally {
            processingFrameRef.current = false;
          }
        },
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT
      });
      camera.start();
    }

    const audio = audioRef.current;
    return () => {
      if (camera) camera.stop();
      hands.close();
      if (audio) {
        audio.pause();
      }
    };
  }, [onResults]);

  return (
    <div
      className="App"
      onClick={() => audioRef.current && audioRef.current.load()}
    >
      <div className="container">
        <audio
          ref={audioRef}
          src={musicFile}
          loop
          style={{ display: "none" }}
        />

        <div className={`header ${danceActive ? "detected" : ""}`}>
          {instruction}
        </div>

        <div
          className="video-container"
          style={{
            position: "relative",
            width: VIDEO_WIDTH,
            height: VIDEO_HEIGHT
          }}
        >
          <video
            ref={videoRef}
            className="input_video"
            autoPlay
            playsInline
            muted
            style={{ display: "none" }}
          ></video>

          <canvas
            ref={canvasRef}
            className="output_canvas"
            width={`${VIDEO_WIDTH}px`}
            height={`${VIDEO_HEIGHT}px`}
          ></canvas>

          {catPositions.map((pos, index) => (
            <img
              key={index}
              src={scubaCatGif}
              alt="Animasi"
              className="scuba-cat"
              style={{
                position: "absolute",
                top: `${pos.top}px`,
                left: `${pos.left}px`,
                transform: `rotate(${pos.rotate}deg)`,
                width: `${GIF_SIZE}px`,
                pointerEvents: "none",
                zIndex: 10
              }}
            />
          ))}
        </div>

        <div
          className="feyy-footer"
          style={{ marginTop: "20px", color: "gray" }}
        >
          made from Feyy
        </div>
      </div>
    </div>
  );
}

export default App;
