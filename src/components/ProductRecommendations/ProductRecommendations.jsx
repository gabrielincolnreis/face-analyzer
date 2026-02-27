import { useState, useCallback, useEffect, useRef } from 'react';
import './ProductRecommendations.css';
import { searchProducts } from '../../services/productMatchingService';

const PRESETS = [
  { id: 'date', label: 'Date Night', query: 'stylish outfit for a romantic date night out' },
  { id: 'office', label: 'Office Meeting', query: 'professional outfit for a business meeting at the office' },
  { id: 'weekend', label: 'Weekend Casual', query: 'comfortable casual outfit for a relaxed weekend' },
  { id: 'workout', label: 'Workout', query: 'athletic sportswear for exercise and gym workout' },
  { id: 'party', label: 'Party', query: 'bold fashionable outfit for a fun night out party' },
  { id: 'travel', label: 'Travel', query: 'comfortable practical outfit for traveling' },
];

const SLIDER_AXIS = [
  {
    id: 'formality',
    labelLeft: 'Casual',
    labelRight: 'Formal',
    textLeft: 'casual relaxed everyday clothing',
    textRight: 'formal professional elegant clothing',
  },
  {
    id: 'boldness',
    labelLeft: 'Conservative',
    labelRight: 'Bold',
    textLeft: 'conservative modest simple clothing',
    textRight: 'bold daring fashion-forward statement clothing',
  },
];

function buildQuery(customerStyle, sliders, activePreset, freeText) {
  if (freeText.trim()) return freeText.trim();

  const preset = PRESETS.find((p) => p.id === activePreset);
  if (preset) return preset.query;

  const base = customerStyle
    ? `${customerStyle.toLowerCase()} clothing`
    : 'clothing';

  const modifiers = SLIDER_AXIS.map((axis) => {
    const val = sliders[axis.id];
    if (val < 35) return axis.textLeft;
    if (val > 65) return axis.textRight;
    return null;
  }).filter(Boolean);

  if (modifiers.length === 0) return base;
  return `${base}, ${modifiers.join(', ')}`;
}

export default function ProductRecommendations({ customerStyle, products, productEmbeddings }) {
  const [sliders, setSliders] = useState({ formality: 50, boldness: 50 });
  const [activePreset, setActivePreset] = useState(null);
  const [freeText, setFreeText] = useState('');
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const runSearch = useCallback(async (query) => {
    if (!productEmbeddings || productEmbeddings.size === 0) return;
    setSearching(true);
    try {
      const results = await searchProducts(query, products, productEmbeddings, 6);
      setMatchedProducts(results);
    } catch (err) {
      console.error('Product search failed:', err);
    }
    setSearching(false);
  }, [products, productEmbeddings]);

  useEffect(() => {
    if (!productEmbeddings || productEmbeddings.size === 0) return;

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      const query = buildQuery(customerStyle, sliders, activePreset, freeText);
      runSearch(query);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [customerStyle, sliders, activePreset, freeText, productEmbeddings, runSearch]);

  const handleSlider = (id, value) => {
    setActivePreset(null);
    setFreeText('');
    setSliders((prev) => ({ ...prev, [id]: Number(value) }));
  };

  const handlePreset = (presetId) => {
    setActivePreset((prev) => (prev === presetId ? null : presetId));
    setFreeText('');
  };

  const handleFreeTextSubmit = (e) => {
    e.preventDefault();
    setActivePreset(null);
    const query = buildQuery(customerStyle, sliders, activePreset, freeText);
    runSearch(query);
  };

  return (
    <div className="product-recommendations">
      <div className="search-controls">
        <form className="search-form" onSubmit={handleFreeTextSubmit}>
          <input
            type="text"
            className="search-input"
            placeholder="e.g. &quot;I want good clothes for my first date&quot;"
            value={freeText}
            onChange={(e) => {
              setFreeText(e.target.value);
              setActivePreset(null);
            }}
          />
        </form>

        <div className="preset-buttons">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`preset-btn ${activePreset === preset.id ? 'active' : ''}`}
              onClick={() => handlePreset(preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="style-sliders">
          {SLIDER_AXIS.map((axis) => (
            <div key={axis.id} className="slider-row">
              <span className="slider-label-left">{axis.labelLeft}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliders[axis.id]}
                className="style-slider"
                onChange={(e) => handleSlider(axis.id, e.target.value)}
              />
              <span className="slider-label-right">{axis.labelRight}</span>
            </div>
          ))}
        </div>
      </div>

      {searching && (
        <div className="product-searching">
          <span className="spinner-small" />
          <span>Finding matching products...</span>
        </div>
      )}

      {matchedProducts.length > 0 && (
        <div className="product-grid">
          {matchedProducts.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image-wrapper">
                <img src={product.image} alt={product.name} loading="lazy" />
                <span className="relevance-badge">
                  {Math.round(product.relevance * 100)}%
                </span>
              </div>
              <div className="product-info">
                <span className="product-name">{product.name}</span>
                <span className="product-brand">{product.brand}</span>
                <span className="product-price">${product.price.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!searching && matchedProducts.length === 0 && productEmbeddings?.size > 0 && (
        <p className="no-products-hint">Adjust filters or type a query to find matching products.</p>
      )}
    </div>
  );
}
