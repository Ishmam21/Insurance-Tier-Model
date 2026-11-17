from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, computed_field
from typing import Literal, Annotated
import pickle
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

#import model

with open("model.pkl",'rb') as f:
    model = pickle.load(f)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://insurance-tier-model.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"]
)



# App-specific Bangladesh city tiers; these are not an official classification.
# List each city once; alternate spellings are normalized below.
tier_1_cities = ["Dhaka", "Chattogram", "Gazipur", "Narayanganj"]
tier_2_cities = [
    "Sylhet", "Khulna", "Rajshahi", "Barishal", "Rangpur", "Mymensingh",
    "Cumilla", "Bogura", "Jashore", "Savar",
    "Tangail", "Faridpur", "Kushtia", "Feni", "Noakhali", "Cox's Bazar",
]

#pydantic modle for validation

class UserInput(BaseModel):
    age: Annotated[int,Field(...,gt=0,lt=120)]
    weight: Annotated[float,Field(...,gt=0,lt=120)]
    height: Annotated[float,Field(...,gt=0,lt=3)]
    income_lpa: Annotated[float,Field(...,gt=0)]
    smoker: Annotated[bool,Field(...)]
    city: Annotated[str,Field(...)]
    occupation: Annotated[Literal["retired","freelancer","student","government_job","business_owner","unemployed","private_job"],Field(...)]

    @computed_field
    @property
    def bmi(self)->float:
        return self.weight/(self.height **2)

    @computed_field
    @property
    def lifestyle_risk(self)->str:
        if self.smoker and self.bmi > 30:
            return "high"
        elif self.smoker or self.bmi > 27:
            return "medium"
        else:
            return "low"

    @computed_field
    @property
    def city_tier(self)->int:
        # Accept extra spaces and any capitalization, e.g. " dhaka ".
        city = self.city.strip().casefold()
        # Old and current spellings refer to the same city, not separate tiers.
        aliases = {"chittagong": "chattogram", "barisal": "barishal",
                   "comilla": "cumilla", "bogra": "bogura", "jessore": "jashore"}
        city = aliases.get(city, city)
        if city in [name.casefold() for name in tier_1_cities]:
            return 1
        elif city in [name.casefold() for name in tier_2_cities]:
            return 2
        else:
            return 3

    @computed_field
    @property
    def age_group(self)->str:
        if self.age < 25:
            return "young"
        elif self.age < 45:
            return "adult"
        elif self.age < 60:
            return "middle_aged"
        return "senior"

@app.post("/predict")
def predict_premium(data: UserInput):

    input_df = pd.DataFrame([{
        "bmi": data.bmi,
        "age_group": data.age_group,
        "lifestyle_risk": data.lifestyle_risk,
        "city_tier": data.city_tier,
        "income_lpa": data.income_lpa,
        "occupation": data.occupation
    }])

    prediction = model.predict(input_df)[0]

    return JSONResponse(status_code=200, content={"predicted_category":prediction})


    
