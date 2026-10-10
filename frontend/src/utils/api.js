const RAW_API_URL = import.meta.env.VITE_API_URL || "https://volunteer-disaster-relief-system-awao.onrender.com";
export const API_URL = RAW_API_URL.replace(/\/+$/, "");

export function getAuthToken() {
  return localStorage.getItem("access_token");
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem("access_token", token);
  } else {
    localStorage.removeItem("access_token");
  }
}

export function removeAuthToken() {
  localStorage.removeItem("access_token");
}

export function getStoredUser() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonPayload);
    return {
      userId: parsed.user_id,
      role: parsed.role,
      exp: parsed.exp,
    };
  } catch (err) {
    console.error("Failed to decode token:", err);
    return null;
  }
}

export async function request(path, options = {}) {
  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getAuthToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === "object" && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (netErr) {
    console.error("Network error accessing:", url, netErr);
    throw new Error("Unable to connect to the server. Please check your internet connection or try again later.", { cause: netErr });
  }

  let data = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    let errorMsg = "An unexpected error occurred.";
    if (data) {
      if (typeof data.detail === "string") {
        errorMsg = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMsg = data.detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
      } else if (data.message) {
        errorMsg = data.message;
      }
    } else {
      errorMsg = `Server responded with status ${response.status} (${response.statusText})`;
    }
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  register: (name, email, password, role = "victim") => request("/auth/register", { method: "POST", body: { name, email, password, role } }),
  getMe: () => request("/auth/me"),

  // Disasters
  getActiveDisasters: () => request("/disasters/active"),
  getAllDisasters: () => request("/disasters/"),
  getDisaster: (id) => request(`/disasters/${id}`),
  createDisaster: (payload) => request("/disasters/", { method: "POST", body: payload }),
  updateDisaster: (id, payload) => request(`/disasters/${id}`, { method: "PUT", body: payload }),
  deleteDisaster: (id) => request(`/disasters/${id}`, { method: "DELETE" }),

  // Relief Requests
  createGuestRequest: (payload) => request("/relief-requests/guest", { method: "POST", body: payload }),
  createVictimRequest: (payload) => request("/relief-requests/", { method: "POST", body: payload }),
  createAssistedRequest: (payload) => request("/relief-requests/assisted", { method: "POST", body: payload }),
  getMyRequests: () => request("/relief-requests/my"),
  getAllRequests: () => request("/relief-requests/"),
  getRequestById: (id) => request(`/relief-requests/${id}`),
  updateRequestStatus: (id, status) => request(`/relief-requests/${id}/status`, { method: "PATCH", body: { status } }),

  // Volunteers
  getMyVolunteerProfile: () => request("/volunteers/me"),
  createVolunteerProfile: (payload) => request("/volunteers/", { method: "POST", body: payload }),
  updateMyVolunteerProfile: (payload) => request("/volunteers/me", { method: "PUT", body: payload }),
  getAllVolunteers: () => request("/volunteers/"),
  getNearbyVolunteers: (requestId) => request(`/volunteers/nearby/${requestId}`),

  // Assignments
  getAllAssignments: () => request("/assignments/"),
  getAssignmentById: (id) => request(`/assignments/${id}`),
  createAssignment: (reliefRequestId, volunteerId) => request("/assignments/", { method: "POST", body: { relief_request_id: Number(reliefRequestId), volunteer_id: Number(volunteerId) } }),
  updateAssignmentStatus: (id, status) => request(`/assignments/${id}/status`, { method: "PATCH", body: { status } }),
};
