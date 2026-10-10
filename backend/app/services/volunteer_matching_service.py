from app.models.relief_request import ReliefRequest
from app.models.volunteer import Volunteer
from app.utils.distance import calculate_distance


def find_nearby_volunteers(
    db,
    relief_request_id:int
):
    relief_request=db.query(ReliefRequest).filter(
        ReliefRequest.id==relief_request_id
    ).first()

    if relief_request is None:
        return None

    if (
        relief_request.latitude is None
        or relief_request.longitude is None
    ):
        return []

    volunteers=db.query(Volunteer).filter(
        Volunteer.availability=="Available",
        Volunteer.latitude.isnot(None),
        Volunteer.longitude.isnot(None)
    ).all()

    nearby_volunteers=[]

    for volunteer in volunteers:
        distance=calculate_distance(
            relief_request.latitude,
            relief_request.longitude,
            volunteer.latitude,
            volunteer.longitude
        )

        nearby_volunteers.append({
            "volunteer_id":volunteer.id,
            "user_id":volunteer.user_id,
            "skills":volunteer.skills,
            "availability":volunteer.availability,
            "latitude":volunteer.latitude,
            "longitude":volunteer.longitude,
            "distance_km":round(distance,2)
        })

    nearby_volunteers.sort(
        key=lambda volunteer: volunteer["distance_km"]
    )

    return nearby_volunteers
