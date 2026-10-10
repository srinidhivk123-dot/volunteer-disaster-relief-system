import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons in Vite / modern bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapBoundsUpdater({ markers }) {
  const map = useMap();

  useEffect(() => {
    if (!markers || markers.length === 0) return;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 13);
    } else {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [markers, map]);

  return null;
}

export function ReliefRequestMap({
  latitude,
  longitude,
  requestId,
  location,
  requests = null,
  height = "380px",
}) {
  // If a collection of requests is passed (Incident Map mode)
  if (Array.isArray(requests)) {
    const validMarkers = requests
      .filter((r) => r.latitude != null && r.longitude != null && !isNaN(r.latitude) && !isNaN(r.longitude))
      .map((r) => ({
        id: r.id,
        lat: Number(r.latitude),
        lng: Number(r.longitude),
        type: r.request_type,
        location: r.location,
        priority: r.priority,
        status: r.status,
        description: r.description,
      }));

    if (validMarkers.length === 0) {
      return (
        <div className="rc-map-empty">
          <p>📍 No geolocated relief requests currently available to display on the map.</p>
        </div>
      );
    }

    const defaultCenter = [validMarkers[0].lat, validMarkers[0].lng];

    return (
      <div className="rc-map-container" style={{ height }}>
        <MapContainer
          center={defaultCenter}
          zoom={12}
          style={{ height: "100%", width: "100%", borderRadius: "8px" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapBoundsUpdater markers={validMarkers} />
          {validMarkers.map((marker) => (
            <Marker key={marker.id} position={[marker.lat, marker.lng]}>
              <Popup>
                <div className="rc-map-popup">
                  <h4 style={{ margin: "0 0 6px 0", color: "#17324D" }}>
                    Request #{marker.id} ({marker.type})
                  </h4>
                  <p style={{ margin: "3px 0", fontSize: "13px" }}>
                    <strong>Status:</strong> {marker.status} | <strong>Priority:</strong> {marker.priority}
                  </p>
                  <p style={{ margin: "3px 0", fontSize: "13px" }}>
                    <strong>Location:</strong> {marker.location}
                  </p>
                  {marker.description && (
                    <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748B" }}>
                      {marker.description}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    );
  }

  // Single request mode
  if (latitude == null || longitude == null || isNaN(latitude) || isNaN(longitude)) {
    return (
      <div className="rc-map-empty-single">
        <p>📍 GPS location not recorded for this request.</p>
      </div>
    );
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  return (
    <div className="rc-map-container" style={{ height }}>
      <MapContainer
        center={[lat, lng]}
        zoom={13}
        style={{ height: "100%", width: "100%", borderRadius: "8px" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <div className="rc-map-popup">
              <strong>Relief Request #{requestId}</strong>
              <br />
              Location: {location}
              <br />
              Coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default ReliefRequestMap;
