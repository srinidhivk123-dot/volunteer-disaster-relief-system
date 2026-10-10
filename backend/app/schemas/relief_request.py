from pydantic import BaseModel,ConfigDict


class ReliefRequestCreate(BaseModel):
    disaster_id:int
    request_type:str
    description:str
    location:str
    priority:str
    request_source:str
    latitude:float|None=None
    longitude:float|None=None

class GuestReliefRequestCreate(BaseModel):
    disaster_id:int
    request_type:str
    description:str
    location:str
    priority:str
    phone:str
    latitude:float|None=None
    longitude:float|None=None


class AssistedReliefRequestCreate(BaseModel):
    victim_id:int
    disaster_id:int
    request_type:str
    description:str
    location:str
    priority:str
    latitude:float|None=None
    longitude:float|None=None


class ReliefRequestStatusUpdate(BaseModel):
    status:str


class ReliefRequestResponse(BaseModel):
    id:int
    victim_id:int|None
    disaster_id:int
    request_type:str
    description:str
    location:str
    priority:str
    request_source:str
    status:str
    phone:str|None
    latitude:float|None
    longitude:float|None

    model_config=ConfigDict(from_attributes=True)