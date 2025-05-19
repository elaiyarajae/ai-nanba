from pydantic import BaseModel
from typing import Optional, List

class Product(BaseModel):
    id: str
    name: str
    description: Optional[str]
    metadata: dict = {}

class ProductCreate(BaseModel):
    name: str
    description: Optional[str]
    metadata: dict = {}