from pydantic import BaseModel,ConfigDict


class VolunteerCreate(BaseModel):
    skills:str|None=None
    availability:str|None=None
    latitude:float|None=None
    longitude:float|None=None


class VolunteerResponse(BaseModel):
    id:int
    user_id:int
    skills:str|None
    availability:str|None
    latitude:float|None
    longitude:float|None

    model_config=ConfigDict(from_attributes=True)