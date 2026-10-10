from math import radians,sin,cos,sqrt,atan2


def calculate_distance(
    latitude1:float,
    longitude1:float,
    latitude2:float,
    longitude2:float
):
    earth_radius_km=6371.0

    lat1=radians(latitude1)
    lon1=radians(longitude1)
    lat2=radians(latitude2)
    lon2=radians(longitude2)

    delta_lat=lat2-lat1
    delta_lon=lon2-lon1

    a=(
        sin(delta_lat/2)**2+
        cos(lat1)*cos(lat2)*sin(delta_lon/2)**2
    )

    c=2*atan2(sqrt(a),sqrt(1-a))

    return earth_radius_km*c
