from pydantic import BaseModel,ConfigDict


class ReliefRequestCreate(BaseModel):
    disaster_id:int|None=None
    request_type:str="rescue"
    description:str
    location:str="Not specified"
    priority:str="MEDIUM"
    request_source:str="victim"
    latitude:float|None=None
    longitude:float|None=None

class GuestReliefRequestCreate(BaseModel):
    disaster_id:int|None=None
    request_type:str="rescue"
    description:str
    location:str="Not specified"
    priority:str="HIGH"
    phone:str|None=None
    latitude:float|None=None
    longitude:float|None=None


class AssistedReliefRequestCreate(BaseModel):
    victim_id:int
    disaster_id:int|None=None
    request_type:str="rescue"
    description:str
    location:str="Not specified"
    priority:str="HIGH"
    latitude:float|None=None
    longitude:float|None=None


class ReliefRequestStatusUpdate(BaseModel):
    status:str


class ReliefRequestResponse(BaseModel):
    id:int
    victim_id:int|None=None
    disaster_id:int|None=None
    request_type:str
    description:str
    location:str
    priority:str="MEDIUM"
    request_source:str|None="victim"
    status:str="pending"
    phone:str|None=None
    latitude:float|None=None
    longitude:float|None=None

    model_config=ConfigDict(from_attributes=True)