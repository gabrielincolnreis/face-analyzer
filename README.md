# Smart Sales Assistant

A **100% local, in-browser** demo that uses your webcam to analyze a person’s face and inferred style, then surfaces customer insights and product recommendations. No images or video are sent to any server — all AI runs in the browser.

---

## What the app does

1. **Webcam capture** – Streams from the user’s camera and, when models are ready, draws live face bounding boxes and labels (age, gender) on a canvas overlay.
2. **One-shot analysis** – On an interval (every few seconds), if a face is detected and analysis hasn’t run yet, it:
   - Runs **face detection + demographics + expressions** on the current frame.
   - Crops a region around the face (with padding) and runs **CLIP** to classify **clothing style** and **occasion** from that crop.
   - Combines face + CLIP results to generate **suggestions** (approach tip, demographic hint, occasion, product categories).
3. **Results panel** – Shows:
   - **Customer profile**: estimated age, gender (with confidence).
   - **Style profile**: top CLIP style and occasion labels with scores.
   - **Approach tip**: short copy for staff based on dominant facial expression.
4. **Product recommendations** – A **Recommended Products** section uses the inferred style (and optional presets/sliders/free text) to build a text query. **CLIP text–image similarity** is used to rank sample product images and show the top matches with a relevance score.

So: the code **analyzes the face** (and a small area around it) to drive **style/occasion** and **approach tips**, then uses that plus user controls to **suggest products** via semantic search.

---

## Face analysis: metrics and how they’re used

All face metrics come from the **face-api.js** pipeline (see [Technologies](#technologies-used) below). The app uses them only for on-screen insights and to feed the suggestion logic — no external analytics.

### Metrics produced

| Metric | Source | Description |
|--------|--------|-------------|
| **Age** | AgeGender net | Estimated age (years), rounded. |
| **Gender** | AgeGender net | Label (e.g. male/female) plus a **probability** (0–1). |
| **Expressions** | FaceExpression net | Scores for: happy, sad, angry, fearful, disgusted, surprised, neutral. |
| **Dominant expression** | Derived | The expression with the highest score; used for approach tips. |
| **Landmarks** | FaceLandmark68 | 68 facial points (used for overlay drawing; not used in suggestions). |
| **Bounding box** | TinyFaceDetector | Face rectangle used for cropping the frame for CLIP. |

### How they’re used

- **Age + gender**  
  - Shown in the **Customer profile** card.  
  - Passed into **suggestions** to generate a **demographic hint** (e.g. “Female, ~28 years — likely interested in current trends and versatile pieces”).  
  - That hint is display-only; it does not directly change product results.

- **Dominant expression**  
  - Shown in the **Approach tip** card with a confidence value.  
  - Mapped to a fixed **approach tip** string (e.g. “Customer seems in a good mood — great time to suggest new arrivals or promotions”) so staff get simple, expression-based guidance.

- **Face crop**  
  - A rectangle around the face (with padding) is cut from the video frame and sent to **CLIP** (no face metrics are sent to CLIP, only the image).  
  - CLIP returns **style** and **occasion** labels; the **top style** is used as `customerStyle` for product search and for the **Style profile** and **Recommended Products** section.

So: **face metrics** drive demographics display, approach tips, and the demographic hint; **CLIP on the face crop** drives style/occasion and product recommendations.

---

## Technologies used

- **React 19** + **Vite** – UI and build.
- **face-api.js** ([@vladmandic/face-api](https://github.com/vladmandic/face-api)) – Face detection and analysis.  
  - Runs on **TensorFlow.js** in the browser.  
  - Models used: **TinyFaceDetector**, **FaceLandmark68**, **FaceRecognition**, **FaceExpression**, **AgeGender**.  
  - Concepts: CNN-based face detection, landmark regression, age/gender regression, expression classification.
- **Hugging Face Transformers** ([@huggingface/transformers](https://github.com/huggingface/transformers.js)) – Two uses of **CLIP**:
  1. **Zero-shot image classification** (`clipService.js`) – Pipeline `zero-shot-image-classification` with **Xenova/clip-vit-base-patch16**. The face crop is classified against fixed text labels for **style** (e.g. “a person wearing casual streetwear”) and **occasion** (e.g. “a person dressed for a date or night out”). Concept: CLIP’s shared image–text space; no fine-tuning, only prompt-style labels.
  2. **Text–image retrieval** (`productMatchingService.js`) – Same CLIP model (text + vision encoders). Product images are encoded to **image embeddings**; the search query (from customer style + presets/sliders/free text) is encoded to a **text embedding**. **Cosine similarity** between query and product embeddings ranks products. Concept: contrastive learning; same embedding space for text and images.
- **Execution** – All models run in the browser (no backend). Face-api uses TF.js; Transformers.js runs the CLIP model in the browser (e.g. WebAssembly/WebGL).

---

## Concepts behind the pipeline

1. **Face → crop → style**  
   The app does not “read” the background or individual items (e.g. “red t-shirt”, “glasses”). It only uses a **cropped image** (face + a bit of upper body) and CLIP’s **global** understanding of that crop to assign one of a fixed set of **style** and **occasion** labels. So “understanding” is at the level of overall look (e.g. casual vs formal), not fine-grained attributes.

2. **Suggestions = face + CLIP**  
   **suggestionsService** combines:  
   - Face: age, gender → demographic hint; dominant expression → approach tip.  
   - CLIP: top style → product category list (from a fixed map); top occasion → “Likely shopping for” label.  
   So “what we do with the information” is: show demographics, style, occasion, approach tip, and use the top style as the default context for product search.

3. **Product search**  
   Products are matched by **semantic similarity** in CLIP’s space: the query is text (e.g. “casual / streetwear clothing” or a preset like “stylish outfit for a romantic date night”); products are represented by their image embeddings. No face or raw image is sent to the product search — only the text query derived from style and user input.

---

## Project structure (high level)

- **`src/App.jsx`** – Loads face-api + CLIP + product CLIP models, runs the analysis loop (detect face → crop → classify with CLIP → generate suggestions), passes results and product embeddings to the UI.
- **`src/services/faceApiService.js`** – Loads face-api models, `detectFaces()`, `extractFaceCrop()`.
- **`src/services/clipService.js`** – Loads CLIP zero-shot pipeline, `classifyFace()` with style and occasion labels.
- **`src/services/suggestionsService.js`** – `generateSuggestions(faceData, clipData)` → approach tip, demographic hint, occasion, product categories.
- **`src/services/productMatchingService.js`** – CLIP product embeddings, `searchProducts(query, products, productEmbeddings)`.
- **`src/components/`** – `WebcamView` (camera + overlay), `ResultsPanel` (customer + style + approach), `ProductRecommendations` (presets, sliders, free text, product grid), `SectionCard` (shared card UI), `LoadingScreen`.

---

## Run the project

```bash
npm install
npm run dev
```

Open the app, allow camera access, and wait for models to load. Position your face in frame; after a short delay, analysis runs once and the results panel and recommended products update. Product recommendations can be refined with presets, sliders, or free-text search.

---

## Disclaimer

AI predictions (age, gender, expression, style, occasion) are **estimations** and should be used as general guidance only. All processing is local; no images or video are uploaded or stored.
