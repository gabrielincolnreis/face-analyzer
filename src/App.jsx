import { useState, useEffect, useRef } from 'react';
import WebcamView from './components/WebcamView';
import ResultsPanel from './components/ResultsPanel';
import LoadingScreen from './components/LoadingScreen';
import { loadFaceApiModels, detectFaces, extractFaceCrop } from './services/faceApiService';
import { loadClipModel, classifyFace, isClipLoaded } from './services/clipService';
import { generateSuggestions } from './services/suggestionsService';
import { loadProductModels, computeProductEmbeddings } from './services/productMatchingService';
import { SAMPLE_PRODUCTS } from './data/sampleProducts';
import './App.css';

export default function App() {
  const [faceApiProgress, setFaceApiProgress] = useState(null);
  const [clipProgress, setClipProgress] = useState(null);
  const [productProgress, setProductProgress] = useState(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [productEmbeddings, setProductEmbeddings] = useState(null);
  const [results, setResults] = useState(null);
  const webcamRef = useRef(null);
  const analyzingRef = useRef(false);
  const hasAnalyzedRef = useRef(false);

  useEffect(() => {
    async function init() {
      await Promise.all([
        loadFaceApiModels(setFaceApiProgress),
        loadClipModel(setClipProgress),
      ]);

      await loadProductModels(setProductProgress);
      const embeddings = await computeProductEmbeddings(SAMPLE_PRODUCTS, setProductProgress);
      setProductEmbeddings(embeddings);

      setModelsReady(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (!modelsReady) return;

    const interval = setInterval(async () => {
      if (analyzingRef.current) return;
      if (hasAnalyzedRef.current) return;

      const video = webcamRef.current?.getVideo();
      if (!video) return;

      analyzingRef.current = true;

      try {
        const faces = await detectFaces(video);

        if (faces.length === 0) {
          setResults(null);
          hasAnalyzedRef.current = false;
          analyzingRef.current = false;
          return;
        }

        const primaryFace = faces[0];
        setResults({ faceData: primaryFace, clipData: null, suggestions: null });

        const faceCrop = await extractFaceCrop(video, primaryFace.box);

        if (isClipLoaded()) {
          const clipData = await classifyFace(faceCrop);
          const suggestions = generateSuggestions(primaryFace, clipData);
          setResults((prev) =>
            prev ? { ...prev, clipData, suggestions } : prev
          );
        }
        hasAnalyzedRef.current = true;
      } catch (err) {
        console.error('Analysis cycle failed:', err);
      }

      analyzingRef.current = false;
    }, 3000);

    return () => clearInterval(interval);
  }, [modelsReady]);

  const allLoaded =
    faceApiProgress?.step === 'Done' &&
    clipProgress?.status === 'ready' &&
    productProgress?.status === 'done';

  return (
    <div className="app">
      {!allLoaded && (
        <LoadingScreen
          faceApiProgress={faceApiProgress}
          clipProgress={clipProgress}
          productProgress={productProgress}
        />
      )}

      <header className="app-header">
        <h1>Smart Sales Assistant</h1>
        <span className="header-badge">100% Local AI</span>
      </header>

      <main className="app-main">
        <WebcamView ref={webcamRef} modelsReady={modelsReady} />
        <ResultsPanel
          results={results}
          products={SAMPLE_PRODUCTS}
          productEmbeddings={productEmbeddings}
        />
      </main>

      <footer className="app-footer">
        <p>
          All processing happens locally in your browser. No images are uploaded or stored anywhere.
        </p>
        <p className="footer-disclaimer">
          AI predictions are estimations and should be used as general guidance only.
        </p>
      </footer>
    </div>
  );
}
