from app.utils.distance import calculate_distance


def test_same_location_distance_is_zero():
    distance=calculate_distance(
        10.728581,
        78.560176,
        10.728581,
        78.560176
    )

    assert distance==0


def test_distance_between_locations():
    distance=calculate_distance(
        10.728581,
        78.560176,
        10.729581,
        78.561176
    )

    assert distance>0
    assert distance<1
    