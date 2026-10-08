from pydantic import BaseModel,ConfigDict


class ReliefRequestCreate(BaseModel):
    disaster_id:int
    request_type:str
    description:str
    location:str
    priority:str
    request_source:str


class GuestReliefRequestCreate(BaseModel):
    disaster_id:int
    request_type:str
    description:str
    location:str
    priority:str
    phone:str


class AssistedReliefRequestCreate(BaseModel):
    victim_id:int
    disaster_id:int
    request_type:str
    description:str
    location:str
    priority:str


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

    model_config=ConfigDict(from_attributes=True)