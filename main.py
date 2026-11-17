from fastapi import FastAPI
from pydantic import BaseModel, Field, computed_field
from typing import Literal, Annotated
import pickle
import pandas as pd

#import model

with open("model.pkl",'rb') as f:
    model = pickle.load(f)

app = FastAPI()

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
    def lifestyle_risk(self)->float:
        return self.weight/(self.height **2)

    