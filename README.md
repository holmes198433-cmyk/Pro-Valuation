# Syntaxial PRO-MODERNIS / Item Valuation Engine

A high-performance, minimalist application that leverages multimodal LLMs and live marketplace data to instantly identify, classify, and valuate physical inventory from a single image upload. The system parses structural imagery, pulls market historical data, and dynamically renders item-specific condition questionnaires to generate an optimized liquidation or resale offer.

---

## Architecture Overview

* **Frontend:** React multi-step wizard UI. Handles camera interactions, context-state flow, and dynamic condition mapping.
* **Backend:** FastAPI (Python) asynchronous gateway. Orchestrates image serialization, marketplace API integration, and structured LLM content generation.

---

## System Setup

### Prerequisites

* Python 3.10 or higher
* Node.js 18 or higher
* Gemini API Key
* eBay Production OAuth Token (Optional for live historical comps)

### Environment Variables

Create a `.env` file in your root backend directory:

```env
GEMINI_API_KEY="your_gemini_api_key_here"
EBAY_OAUTH_TOKEN="your_ebay_oauth_token_here"

```

---

## Installation & Deployment

### 1. Backend Engine Execution

Navigate to the backend directory, install the required packages, and launch the development server.

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

```

* **API Local Endpoint:** `http://localhost:8000`
* **Interactive API Docs:** `http://localhost:8000/docs`

### 2. Frontend Interface Deployment

Navigate to the frontend directory, install dependencies, and spin up the build pipeline.

```bash
cd frontend
npm install
npm run dev

```

* **Client Interface:** `http://localhost:5173`

---

## API Specification

### Item Analysis Endpoint

* **URL:** `/api/analyze-item`
* **Method:** `POST`
* **Payload Format:** `multipart/form-data`

#### Request Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `file` | Binary (File) | Raw image file payload (JPEG, PNG, WEBP) |

#### Expected JSON Structural Output

```json
{
  "item_name": "Apple iPad Pro 12.9 (5th Gen, 2021)",
  "base_value": 550.00,
  "questions": [
    {
      "id": "screen_cracks",
      "text": "Are there any deep scratches, cracks, or dead pixels on the display?",
      "options": [
        { "label": "Flawless / Screen Protector Used", "multiplier": 1.0 },
        { "label": "Light micro-scratches only", "multiplier": 0.85 },
        { "label": "Cracked or heavily scratched", "multiplier": 0.40 }
      ]
    }
  ]
}

```

---

## Development & Testing Workflow

```text
[ Capture Image ] ──> [ Multipart Post ] ──> [ Backend Base64 Encode ]
                                                        │
[ True Value ] <── [ Apply Multipliers ] <── [ Dynamic Questionnaire ]

```

1. **Upload:** Drop an item photo into the UI drop-zone.
2. **Identification:** The backend identifies the exact model variant via spatial feature detection and extracts market trends.
3. **Evaluation:** Select the specific condition parameters from the generated options to execute the final calculated valuation calculation.
