from pydantic import BaseModel


class DisasterCreate(BaseModel):
    name: str
    disaster_type: str
    description: str | None = None
    location: str
    status: str = "active"


class DisasterUpdate(BaseModel):
    name: str | None = None
    disaster_type: str | None = None
    description: str | None = None
    location: str | None = None
    status: str | None = None


class DisasterResponse(BaseModel):
    id: int
    name: str
    disaster_type: str
    description: str | None
    location: str
    status: str

    class Config:
        from_attributes = True