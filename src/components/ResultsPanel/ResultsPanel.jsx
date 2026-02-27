import './ResultsPanel.css';
import ProductRecommendations from '../ProductRecommendations/ProductRecommendations.jsx';

function ConfidenceBar({ value, color }) {
  return (
    <div className="confidence-bar">
      <div
        className="confidence-fill"
        style={{ width: `${Math.round(value * 100)}%`, background: color || 'var(--accent)' }}
      />
    </div>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <div className="result-card">
      <h3>
        <span className="card-icon">{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function ExpressionList({ expressions }) {
  if (!expressions) return null;

  const sorted = Object.entries(expressions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  const colors = {
    happy: '#4ade80',
    sad: '#60a5fa',
    angry: '#f87171',
    fearful: '#c084fc',
    disgusted: '#fb923c',
    surprised: '#fbbf24',
    neutral: '#94a3b8',
  };

  return (
    <div className="expression-list">
      {sorted.map(([name, score]) => (
        <div key={name} className="expression-row">
          <span className="expression-label">{name}</span>
          <ConfidenceBar value={score} color={colors[name]} />
          <span className="expression-score">{Math.round(score * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

export default function ResultsPanel({ results, products, productEmbeddings }) {
  if (!results) {
    return (
      <div className="results-panel results-empty">
        <div className="empty-state">
          <div className="empty-icon scanning-pulse">&#x1F4F7;</div>
          <p>Waiting for customer...</p>
          <p className="empty-hint">Position the camera to capture customers as they enter</p>
        </div>
      </div>
    );
  }

  if (results.error) {
    return (
      <div className="results-panel results-error">
        <div className="empty-state">
          <div className="empty-icon">&#x26A0;</div>
          <p>{results.error}</p>
        </div>
      </div>
    );
  }

  const { faceData, clipData, suggestions } = results;
  const customerStyle = clipData?.styles?.[0]?.label || null;

  return (
    <div className="results-panel">
      <h2 className="results-title">Customer Insights</h2>

      <SectionCard title="Recommended Products" icon="&#x1F6CD;">
        {suggestions?.occasion && (
          <p className="occasion-line">
            Likely shopping for: <strong>{suggestions.occasion.label}</strong>
          </p>
        )}
        <ProductRecommendations
          customerStyle={customerStyle}
          products={products}
          productEmbeddings={productEmbeddings}
        />
      </SectionCard>

      <SectionCard title="Customer Profile" icon="&#x1F464;">
        <div className="demographics-grid">
          <div className="demo-item">
            <span className="demo-label">Age</span>
            <span className="demo-value">~{faceData.age} years</span>
          </div>
          <div className="demo-item">
            <span className="demo-label">Gender</span>
            <span className="demo-value">
              {faceData.gender}
              <span className="demo-confidence">
                {Math.round(faceData.genderProbability * 100)}%
              </span>
            </span>
          </div>
        </div>
        {suggestions?.demographicHint && (
          <p className="demographic-hint">{suggestions.demographicHint}</p>
        )}
      </SectionCard>

      {clipData && (
        <SectionCard title="Style Profile" icon="&#x1F455;">
          <div className="clip-list">
            {clipData.styles.map((item) => (
              <div key={item.label} className="clip-row">
                <span className="clip-label">{item.label}</span>
                <ConfidenceBar value={item.score} color="var(--accent-purple)" />
                <span className="clip-score">{Math.round(item.score * 100)}%</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Approach Tip" icon="&#x1F4AC;">
        <div className="dominant-expression">
          {faceData.dominantExpression.label}
          <span className="demo-confidence">
            {Math.round(faceData.dominantExpression.value * 100)}%
          </span>
        </div>
        {suggestions?.approachTip && (
          <div className="approach-tip">
            {suggestions.approachTip}
          </div>
        )}
        <ExpressionList expressions={faceData.expressions} />
      </SectionCard>

      {clipData === null && (
        <div className="clip-loading">
          <span className="spinner-small" />
          <span>Analyzing style...</span>
        </div>
      )}
    </div>
  );
}
