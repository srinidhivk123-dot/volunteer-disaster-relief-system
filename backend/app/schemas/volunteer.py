from pydantic import BaseModel


class VolunteerCreate(BaseModel):
    skills: str | None = None
    availability: str | None = None


class VolunteerResponse(BaseModel):
    id: int
    user_id: int
    skills: str | None
    availability: str | None

    class Config:
        from_attributes = True