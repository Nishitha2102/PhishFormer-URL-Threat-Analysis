from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import time
import os
import uvicorn

app = FastAPI(title="PhishFormer ML Service")

# Load model on startup
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
model_data = None
lg_model = None
feature_names = None

@app.on_event("startup")
def load_model():
    global model_data, lg_model, feature_names
    if os.path.exists(MODEL_PATH):
        model_data = joblib.load(MODEL_PATH)
        lg_model = model_data['model']
        feature_names = model_data['features']
        print("LightGBM Model loaded successfully.")
    else:
        print("Warning: model.pkl not found. Please train the model first.")

class PredictRequest(BaseModel):
    url_features: dict
    html_features: dict

class PredictResponse(BaseModel):
    lightgbm_score: float
    confidence: float
    feature_importance: dict
    inference_time_ms: float

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": lg_model is not None}

@app.get("/model-info")
def model_info():
    if not model_data:
        raise HTTPException(status_code=404, detail="Model not loaded")
    return {
        "accuracy": model_data.get("accuracy", 0.0),
        "features": feature_names
    }

@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    start_time = time.time()
    
    # Combine features
    all_features = {**request.url_features, **request.html_features}
    
    # Predict with LightGBM
    lightgbm_score = 0.0
    feature_importance_dict = {}
    
    if lg_model and feature_names:
        input_data = []
        for f in feature_names:
            input_data.append(all_features.get(f, 0.0))
            
        data_df = pd.DataFrame([input_data], columns=feature_names)
        
        lg_prob = lg_model.predict_proba(data_df)[0][1]
        lightgbm_score = float(lg_prob * 100)
        
        importances = lg_model.feature_importances_
        imp_indices = np.argsort(importances)[::-1][:10]
        feature_importance_dict = {
            feature_names[i]: float(importances[i]) for i in imp_indices
        }
    else:
        lightgbm_score = 50.0
    
    confidence = max(lightgbm_score, 100 - lightgbm_score)
        
    inference_time_ms = (time.time() - start_time) * 1000
    
    return PredictResponse(
        lightgbm_score=round(lightgbm_score, 2),
        confidence=round(confidence, 2),
        feature_importance=feature_importance_dict,
        inference_time_ms=round(inference_time_ms, 2)
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
