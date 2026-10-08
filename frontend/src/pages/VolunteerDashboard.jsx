import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function VolunteerDashboard() {
  const [profile, setProfile] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [message, setMessage] = useState("Loading...");
  const [updatingAssignment, setUpdatingAssignment] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    const loadVolunteerData = async () => {
      try {
        const profileResponse = await fetch(
          "http://127.0.0.1:8000/volunteers/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const assignmentResponse = await fetch(
          "http://127.0.0.1:8000/assignments/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const profileData = await profileResponse.json();
        const assignmentData = await assignmentResponse.json();

        if (!profileResponse.ok) {
          setMessage(
            profileData.detail || "Failed to load volunteer profile"
          );
          return;
        }

        if (!assignmentResponse.ok) {
          setMessage(
            assignmentData.detail || "Failed to load assignments"
          );
          return;
        }

        setProfile(profileData);
        setAssignments(assignmentData);
        setMessage("");
      } catch (error) {
        console.error(error);
        setMessage("Cannot connect to the backend.");
      }
    };

    loadVolunteerData();
  }, [navigate]);

  const updateAssignmentStatus = async (assignmentId, status) => {
    const token = localStorage.getItem("access_token");

    setUpdatingAssignment(assignmentId);
    setMessage("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/assignments/${assignmentId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail || "Failed to update assignment."
        );
        return;
      }

      setAssignments((currentAssignments) =>
        currentAssignments.map((assignment) =>
          assignment.id === assignmentId
            ? data
            : assignment
        )
      );
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to the backend.");
    } finally {
      setUpdatingAssignment(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <div className="dashboard-page">

      <div className="dashboard-container">

        <div className="dashboard-header">

          <h1>Volunteer Dashboard</h1>

          <button onClick={logout}>
            Logout
          </button>

        </div>

        {message && <p>{message}</p>}

        {profile && (
          <div className="dashboard-card">

            <h2>My Volunteer Profile</h2>

            <p>
              <strong>Skills:</strong>{" "}
              {profile.skills || "Not specified"}
            </p>

            <p>
              <strong>Availability:</strong>{" "}
              {profile.availability || "Not specified"}
            </p>

          </div>
        )}

        <div className="dashboard-card">

          <h2>My Assigned Relief Tasks</h2>

          {assignments.length === 0 ? (
            <p>
              No relief tasks have been assigned to you yet.
            </p>
          ) : (
            assignments.map((assignment) => (
              <div key={assignment.id}>

                <h3>
                  Assignment #{assignment.id}
                </h3>

                <p>
                  <strong>Relief Request:</strong>{" "}
                  #{assignment.relief_request_id}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {assignment.status}
                </p>

                {assignment.status === "assigned" && (
                  <div>

                    <button
                      onClick={() =>
                        updateAssignmentStatus(
                          assignment.id,
                          "in_progress"
                        )
                      }
                      disabled={
                        updatingAssignment === assignment.id
                      }
                    >
                      {updatingAssignment === assignment.id
                        ? "Updating..."
                        : "Accept"}
                    </button>

                    <button
                      onClick={() =>
                        updateAssignmentStatus(
                          assignment.id,
                          "declined"
                        )
                      }
                      disabled={
                        updatingAssignment === assignment.id
                      }
                    >
                      {updatingAssignment === assignment.id
                        ? "Updating..."
                        : "Decline"}
                    </button>

                  </div>
                )}

                <hr />

              </div>
            ))
          )}

        </div>

        <div className="dashboard-card">

          <h2>Assisted Relief Request</h2>

          <p>
            Create a relief request on behalf of a victim
            when direct self-submission is not possible.
          </p>

          <button
            onClick={() => navigate("/assisted-request")}
          >
            Create Assisted Request
          </button>

        </div>

      </div>

    </div>
  );
}

export default VolunteerDashboard;