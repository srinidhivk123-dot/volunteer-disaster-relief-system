from pydantic import BaseModel,ConfigDict


class DisasterCreate(BaseModel):
    name:str
    disaster_type:str
    description:str|None=None
    location:str
    status:str="active"


class DisasterUpdate(BaseModel):
    name:str|None=None
    disaster_type:str|None=None
    description:str|None=None
    location:str|None=None
    status:str|None=None


class DisasterResponse(BaseModel):
    id:int
    name:str
    disaster_type:str
    description:str|None=None
    location:str
    status:str

    model_config=ConfigDict(from_attributes=True)