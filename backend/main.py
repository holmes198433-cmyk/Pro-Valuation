import base64
import os
import httpx
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Allow frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

EBAY_SEARCH_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search_by_image"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent"

def get_ebay_token():
    # Replace with your actual OAuth token management logic
    return os.getenv("EBAY_OAUTH_TOKEN")

@app.post("/api/analyze-item")
async def analyze_item(file: UploadFile = File(...)):
    try:
        # 1. Read file bytes and encode to base64
        image_bytes = await file.read()
        base64_image = base64.b64encode(image_bytes).decode("utf-8")
        
        # 2. Extract comparable listings from eBay
        ebay_token = get_ebay_token()
        ebay_headers = {
            "Authorization": f"Bearer {ebay_token}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            ebay_res = await client.post(
                EBAY_SEARCH_URL, 
                json={"image": base64_image}, 
                headers=ebay_headers
            )
            # Fallback to an empty list if eBay fails or token is missing during initial local tests
            comps_data = ebay_res.json() if ebay_res.status_code == 200 else {"itemSummaries": []}

        # 3. Request Gemini to determine the item identity, base value, and conditional questionnaire
        gemini_headers = {"Content-Type": "application/json"}
        gemini_payload = {
            "contents": [{
                "parts": [
                    {"inline_data": {"mime_type": file.content_type, "data": base64_image}},
                    {"text": f"Identify this item. Analyze these market comps data: {str(comps_data)[:2000]}. Provide a base valuation and exactly 3 targeted condition questions for a questionnaire. Respond strictly in valid JSON format matching the schema: {{'item_name': string, 'base_value': float, 'questions': [{{'id': string, 'text': string, 'options': [{{'label': string, 'multiplier': float}}]}}]}}"}
                ]
            }],
            "generationConfig": {"responseMimeType": "application/json"}
        }

        async with httpx.AsyncClient() as client:
            gemini_res = await client.post(
                f"{GEMINI_API_URL}?key={os.getenv('GEMINI_API_KEY')}", 
                json=gemini_payload, 
                headers=gemini_headers
            )
            
        if gemini_res.status_code != 200:
            raise HTTPException(status_code=500, detail="LLM processing failed")
            
        return gemini_res.json()["candidates"][0]["content"]["parts"][0]["text"]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
