import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { detectFaces } from '../services/faceApiService';

const WebcamView = forwardRef(function WebcamView({ modelsReady }, ref) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  useImperativeHandle(ref, () => ({
    getVideo: () => videoRef.current,
  }));

  useEffect(() => {
    let stream = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setCameraReady(true);
          };
        }
      } catch (err) {
        setCameraError(err.name === 'NotAllowedError'
          ? 'Camera access denied. Please allow camera permissions and reload.'
          : 'Could not access camera. Make sure a webcam is connected.');
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const drawOverlay = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !modelsReady || videoRef.current.paused) {
      animFrameRef.current = requestAnimationFrame(drawOverlay);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      const faces = await detectFaces(video);
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      faces.forEach((face) => {
        const { box } = face;

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        if (face.landmarks) {
          const points = face.landmarks.positions;
          ctx.fillStyle = '#00f0ff';
          points.forEach((pt) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        const label = `${face.gender} ~${face.age}y`;
        ctx.font = '14px Inter, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        const textWidth = ctx.measureText(label).width;
        ctx.fillRect(box.x, box.y - 22, textWidth + 10, 20);
        ctx.fillStyle = '#00f0ff';
        ctx.fillText(label, box.x + 5, box.y - 7);
      });
    } catch {
      // Detection failed for this frame, skip
    }

    animFrameRef.current = requestAnimationFrame(drawOverlay);
  }, [modelsReady]);

  useEffect(() => {
    if (cameraReady && modelsReady) {
      animFrameRef.current = requestAnimationFrame(drawOverlay);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [cameraReady, modelsReady, drawOverlay]);

  if (cameraError) {
    return (
      <div className="webcam-container webcam-error">
        <div className="error-icon">&#x1F4F7;</div>
        <p>{cameraError}</p>
      </div>
    );
  }

  return (
    <div className="webcam-container">
      <div className="video-wrapper">
        <video ref={videoRef} autoPlay muted playsInline />
        <canvas ref={canvasRef} className="overlay-canvas" />
        {cameraReady && modelsReady && (
          <div className="live-badge">
            <span className="live-dot" />
            LIVE
          </div>
        )}
        {!cameraReady && (
          <div className="camera-loading">
            <div className="spinner" />
            <p>Starting camera...</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default WebcamView;
