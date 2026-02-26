import { pipeline } from '@huggingface/transformers';

let classifier = null;
let loading = false;

const STYLE_LABELS = [
  'a person wearing casual streetwear',
  'a person wearing formal business attire',
  'a person wearing sporty athletic clothes',
  'a person wearing trendy fashion-forward clothes',
  'a person wearing classic minimalist style',
  'a person wearing bohemian or artistic clothes',
  'a person wearing luxury or designer clothes',
  'a person wearing outdoor rugged clothes',
];

const OCCASION_LABELS = [
  'a person dressed for a day at the office',
  'a person dressed for a casual weekend outing',
  'a person dressed for a date or night out',
  'a person dressed for exercise or sport',
  'a person dressed for an outdoor adventure',
  'a person dressed for a formal event or wedding',
  'a person dressed for travel',
];

const STYLE_DISPLAY = {
  'a person wearing casual streetwear': 'Casual / Streetwear',
  'a person wearing formal business attire': 'Formal / Business',
  'a person wearing sporty athletic clothes': 'Sporty / Athletic',
  'a person wearing trendy fashion-forward clothes': 'Trendy / Fashion-Forward',
  'a person wearing classic minimalist style': 'Classic / Minimalist',
  'a person wearing bohemian or artistic clothes': 'Bohemian / Artistic',
  'a person wearing luxury or designer clothes': 'Luxury / Designer',
  'a person wearing outdoor rugged clothes': 'Outdoor / Rugged',
};

const OCCASION_DISPLAY = {
  'a person dressed for a day at the office': 'Office / Work',
  'a person dressed for a casual weekend outing': 'Casual Weekend',
  'a person dressed for a date or night out': 'Date / Night Out',
  'a person dressed for exercise or sport': 'Exercise / Sport',
  'a person dressed for an outdoor adventure': 'Outdoor Adventure',
  'a person dressed for a formal event or wedding': 'Formal Event',
  'a person dressed for travel': 'Travel',
};

export async function loadClipModel(onProgress) {
  if (classifier) return;
  if (loading) return;
  loading = true;

  onProgress?.({ step: 'CLIP Model', status: 'downloading' });

  classifier = await pipeline(
    'zero-shot-image-classification',
    'Xenova/clip-vit-base-patch16',
    {
      progress_callback: (progress) => {
        if (progress.status === 'progress') {
          onProgress?.({
            step: 'CLIP Model',
            status: 'downloading',
            file: progress.file,
            loaded: progress.loaded,
            total: progress.total,
          });
        }
      },
    }
  );

  loading = false;
  onProgress?.({ step: 'CLIP Model', status: 'ready' });
}

export function isClipLoaded() {
  return classifier !== null;
}

export async function classifyFace(canvasOrBlob) {
  if (!classifier) throw new Error('CLIP model not loaded');

  let imageInput;
  if (canvasOrBlob instanceof HTMLCanvasElement) {
    imageInput = canvasOrBlob.toDataURL('image/jpeg', 0.9);
  } else {
    imageInput = canvasOrBlob;
  }

  const [styleResults, occasionResults] = await Promise.all([
    classifier(imageInput, STYLE_LABELS),
    classifier(imageInput, OCCASION_LABELS),
  ]);

  const styles = styleResults
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((r) => ({
      label: STYLE_DISPLAY[r.label] || r.label,
      score: r.score,
    }));

  const occasions = occasionResults
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => ({
      label: OCCASION_DISPLAY[r.label] || r.label,
      score: r.score,
    }));

  return { styles, occasions };
}
