import './LoadingScreen.css';

export default function LoadingScreen({ faceApiProgress, clipProgress, productProgress }) {
  const faceApiDone = faceApiProgress?.step === 'Done';
  const clipReady = clipProgress?.status === 'ready';
  const productsDone = productProgress?.status === 'done';
  const allReady = faceApiDone && clipReady && productsDone;

  
  const faceApiPercent = faceApiProgress
    ? Math.round((faceApiProgress.current / faceApiProgress.total) * 100)
    : 0;

  let clipPercent = 0;
  if (clipReady) {
    clipPercent = 100;
  } else if (clipProgress?.total) {
    clipPercent = Math.round((clipProgress.loaded / clipProgress.total) * 100);
  }

  let productPercent = 0;
  if (productsDone) {
    productPercent = 100;
  } else if (productProgress?.total) {
    productPercent = Math.round((productProgress.current / productProgress.total) * 100);
  }

  const productStatusText = () => {
    if (productsDone) return 'Ready';
    if (productProgress?.status === 'indexing') {
      return `${productProgress.current}/${productProgress.total} — ${productProgress.detail || ''}`;
    }
    if (productProgress?.status === 'loading') {
      return productProgress.detail || 'Loading...';
    }
    return 'Waiting...';
  };

  if (allReady) return null;

  return (
    <div className="loading-screen">
      <div className="loading-card">
        <h1 className="loading-title">Smart Sales Assistant</h1>
        <p className="loading-subtitle">Preparing your AI sales assistant...</p>

        <div className="loading-step">
          <div className="step-header">
            <span className="step-name">Face Detection Models</span>
            <span className="step-status">
              {faceApiDone ? 'Ready' : faceApiProgress?.step || 'Waiting...'}
            </span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${faceApiDone ? 100 : faceApiPercent}%` }}
            />
          </div>
        </div>

        <div className="loading-step">
          <div className="step-header">
            <span className="step-name">CLIP Vision Model</span>
            <span className="step-status">
              {clipReady
                ? 'Ready'
                : clipProgress?.file
                  ? `${clipProgress.file.split('/').pop()}`
                  : 'Waiting...'}
            </span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill progress-fill-purple"
              style={{ width: `${clipPercent}%` }}
            />
          </div>
        </div>

        <div className="loading-step">
          <div className="step-header">
            <span className="step-name">Product Catalog</span>
            <span className="step-status">{productStatusText()}</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill progress-fill-green"
              style={{ width: `${productsDone ? 100 : productPercent}%` }}
            />
          </div>
        </div>

        <p className="loading-hint">
          First load downloads ~100MB of model data and indexes the product catalog. Subsequent loads use cached models.
        </p>
      </div>
    </div>
  );
}
