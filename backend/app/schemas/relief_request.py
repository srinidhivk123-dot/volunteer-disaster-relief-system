from pydantic import BaseModel


class ReliefRequestCreate(BaseModel):
    disaster_id: int
    request_type: str
    description: str
    location: str
    priority: str
    request_source: str
class AssistedReliefRequestCreate(BaseModel):
    victim_id: int
    disaster_id: int
    request_type: str
    description: str
    location: str
    priority: str

class ReliefRequestStatusUpdate(BaseModel):
    status: str


class ReliefRequestResponse(BaseModel):
    id: int
    victim_id: int
    disaster_id: int
    request_type: str
    description: str
    location: str
    priority: str
    request_source: str
    status: str

    class Config:
        from_attributes = True