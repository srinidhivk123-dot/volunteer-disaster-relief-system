from pydantic import BaseModel


class AssignmentCreate(BaseModel):
    relief_request_id: int
    volunteer_id: int


class AssignmentStatusUpdate(BaseModel):
    status: str


class AssignmentResponse(BaseModel):
    id: int
    relief_request_id: int
    volunteer_id: int
    status: str

    class Config:
        from_attributes = True