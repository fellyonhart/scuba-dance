// src/App.js
import React, { useRef, useEffect, useState, useCallback } from "react";
import { Pose } from "@mediapipe/pose";
import * as cam from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import "./App.css";

import scubaCatGif from "./assets/scuba-cat.gif";
import musicFile from "./assets/music.mp3";

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;
const GIF_SIZE = 350;
const MIN_FRAME_INTERVAL = 50;

const HAND_ONLY_CONNECTIONS = [
  [15, 17],
  [15, 19],
  [15, 21],
  [17, 19],
  [16, 18],
  [16, 20],
  [16, 22],
  [18, 20]
];

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

    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      const landmarks = results.poseLandmarks;

      drawConnectors(canvasCtx, landmarks, HAND_ONLY_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 2
      });
      const handPointsOnly = [15, 16, 17, 18, 19, 20, 21, 22].map(
        (index) => landmarks[index]
      );
      drawLandmarks(canvasCtx, handPointsOnly, {
        color: "#FF0000",
        lineWidth: 1,
        radius: 4
      });

      const leftWrist = landmarks[15];
      const rightWrist = landmarks[16];

      const isLeftHandVisible =
        leftWrist.visibility > 0.9 && leftWrist.y < 0.95 && leftWrist.y > 0;
      const isRightHandVisible =
        rightWrist.visibility > 0.9 && rightWrist.y < 0.95 && rightWrist.y > 0;
      const isAnyHandVisible = isLeftHandVisible || isRightHandVisible;

      if (isAnyHandVisible && !handDetectedRef.current) {
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
      } else if (!isAnyHandVisible && handDetectedRef.current) {
        console.log("❌ TANGAN HILANG - KICAU MANIA OFF");
        handDetectedRef.current = false;
        setDanceActive(false);
        setInstruction("TUNGGUIN TANGAN MU MUNCUL DI KAMERA...");
        setCatPositions([]);

        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
    } else {
      if (handDetectedRef.current) {
        console.log("🚫 Tidak ada orang di kamera");
        handDetectedRef.current = false;
        setDanceActive(false);
        setInstruction("TUNGGUIN TANGAN MU MUNCUL DI KAMERA...");
        setCatPositions([]);

        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
    }
    canvasCtx.restore();
  }, []);

  // 3. SETUP KAMERA & MEDIA PIPE
  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    pose.setOptions({
      modelComplexity: 0,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults(onResults);

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
            await pose.send({ image: videoRef.current });
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
