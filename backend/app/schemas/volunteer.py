from pydantic import BaseModel,ConfigDict


class VolunteerCreate(BaseModel):
    skills:str|None=None
    availability:str|None=None


class VolunteerResponse(BaseModel):
    id:int
    user_id:int
    skills:str|None
    availability:str|None

    model_config=ConfigDict(from_attributes=True)
    