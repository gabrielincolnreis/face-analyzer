import {
  CLIPTextModelWithProjection,
  CLIPVisionModelWithProjection,
  AutoTokenizer,
  AutoProcessor,
  RawImage,
} from '@huggingface/transformers';

const MODEL_ID = 'Xenova/clip-vit-base-patch16';

let tokenizer = null;
let textModel = null;
let processor = null;
let visionModel = null;
let modelsLoaded = false;

export async function loadProductModels(onProgress) {
  if (modelsLoaded) return;

  onProgress?.({ step: 'Product Models', status: 'loading', detail: 'Loading tokenizer...' });
  tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID);

  onProgress?.({ step: 'Product Models', status: 'loading', detail: 'Loading text model...' });
  textModel = await CLIPTextModelWithProjection.from_pretrained(MODEL_ID);

  onProgress?.({ step: 'Product Models', status: 'loading', detail: 'Loading image processor...' });
  processor = await AutoProcessor.from_pretrained(MODEL_ID);

  onProgress?.({ step: 'Product Models', status: 'loading', detail: 'Loading vision model...' });
  visionModel = await CLIPVisionModelWithProjection.from_pretrained(MODEL_ID);

  modelsLoaded = true;
  onProgress?.({ step: 'Product Models', status: 'ready' });
}

export async function computeProductEmbeddings(products, onProgress) {
  if (!modelsLoaded) throw new Error('Product models not loaded');

  const embeddings = new Map();

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    onProgress?.({
      step: 'Indexing Products',
      status: 'indexing',
      current: i + 1,
      total: products.length,
      detail: product.name,
    });

    try {
      const image = await RawImage.read(product.image);
      const imageInputs = await processor(image);
      const { image_embeds } = await visionModel(imageInputs);
      const embedding = Array.from(image_embeds.data);
      embeddings.set(product.id, normalize(embedding));
    } catch (err) {
      console.warn(`Failed to embed product "${product.name}":`, err);
    }
  }

  onProgress?.({
    step: 'Indexing Products',
    status: 'done',
    current: products.length,
    total: products.length,
  });

  return embeddings;
}

export async function searchProducts(query, products, productEmbeddings, topK = 6) {
  if (!modelsLoaded) throw new Error('Product models not loaded');
  if (!query || query.trim().length === 0) return [];

  const textInputs = tokenizer([query], { padding: true, truncation: true });
  const { text_embeds } = await textModel(textInputs);
  const queryEmbedding = normalize(Array.from(text_embeds.data));

  const scored = products
    .filter((p) => productEmbeddings.has(p.id))
    .map((p) => ({
      ...p,
      relevance: cosineSimilarity(queryEmbedding, productEmbeddings.get(p.id)),
    }))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, topK);

  return scored;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

function normalize(vec) {
  let norm = 0;
  for (let i = 0; i < vec.length; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}
