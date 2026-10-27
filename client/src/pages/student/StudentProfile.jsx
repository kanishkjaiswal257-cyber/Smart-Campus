import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

// Safely read the API response
async function readApiResponse(response) {
    const contentType = response.headers.get("content-type") || "";


    if (!contentType.includes("application/json")) {
        const responseText = await response.text();

        console.error("Non-JSON API response:", responseText);

        throw new Error(
            `Server returned a non-JSON response (HTTP ${response.status}). Check your backend API route.`
        );
    }

    return response.json();


}

function StudentProfile() {
    const { user } = useAuth();


    const [profile, setProfile] = useState({
        name: "",
        email: "",
        crn: "",
        course: "",
        department: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(false);

    // Fetch student profile
    useEffect(() => {
        let isMounted = true;

        const fetchProfile = async () => {
            try {
                const token = sessionStorage.getItem("token");

                if (!token) {
                    throw new Error(
                        "Login session not found. Please log in again."
                    );
                }

                const response = await fetch(
                    "http://localhost:5000/api/users/profile",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await readApiResponse(response);

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load profile."
                    );
                }

                const userData = data.user || data;

                if (isMounted) {
                    setProfile({
                        name: userData.name || "",
                        email: userData.email || "",
                        crn: userData.crn || "",
                        course: userData.course || "BCA",
                        department: userData.department || "",
                    });
                }
            } catch (err) {
                console.error("Profile loading error:", err);

                if (isMounted) {
                    // Show available login data as a fallback
                    setProfile({
                        name: user?.name || "",
                        email: user?.email || "",
                        crn: user?.crn || "",
                        course: user?.course || "BCA",
                        department: user?.department || "",
                    });

                    setError(err.message || "Unable to load profile.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchProfile();

        return () => {
            isMounted = false;
        };
    }, [user]);

    // Handle input changes
    const handleChange = (event) => {
        const { name, value } = event.target;

        setProfile((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // Save updated profile
    const handleSave = async (event) => {
        event.preventDefault();

        setSaving(true);
        setMessage("");
        setError("");

        try {
            const token = sessionStorage.getItem("token");

            if (!token) {
                throw new Error(
                    "Login session not found. Please log in again."
                );
            }

            const response = await fetch(
                "http://localhost:5000/api/users/profile",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: profile.name.trim(),
                        crn: profile.crn.trim(),
                        course: profile.course.trim(),
                        department: profile.department.trim(),
                    }),
                }
            );

            const data = await readApiResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to update profile."
                );
            }

            const updatedUser = data.user || data;

            setProfile((previous) => ({
                ...previous,
                name: updatedUser.name ?? previous.name,
                email: updatedUser.email ?? previous.email,
                crn: updatedUser.crn ?? previous.crn,
                course: updatedUser.course ?? previous.course,
                department:
                    updatedUser.department ?? previous.department,
            }));

            setMessage("Profile updated successfully!");
            setEditing(false);
        } catch (err) {
            console.error("Profile update error:", err);
            setError(err.message || "Unable to update profile.");
        } finally {
            setSaving(false);
        }
    };

    // Cancel editing
    const handleCancel = () => {
        setEditing(false);
        setError("");
        setMessage("");

        // Restore values from the server
        window.location.reload();
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="profile-card">
                    <h1>My Profile</h1>
                    <p>Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="profile-card">
                <h1>My Profile</h1>

                <p>View and manage your account information.</p>

                <div className="profile-avatar">
                    {profile.name
                        ? profile.name.charAt(0).toUpperCase()
                        : "S"}
                </div>

                {message && (
                    <div className="profile-success">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="profile-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSave}>
                    <div className="profile-details">
                        <div>
                            <label htmlFor="profile-name">
                                Full Name
                            </label>

                            <input
                                id="profile-name"
                                name="name"
                                type="text"
                                value={profile.name}
                                onChange={handleChange}
                                disabled={!editing}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="profile-email">
                                Email Address
                            </label>

                            <input
                                id="profile-email"
                                type="email"
                                value={profile.email}
                                disabled
                            />

                            <small>
                                Email cannot be changed here.
                            </small>
                        </div>

                        <div>
                            <label htmlFor="profile-role">
                                Role
                            </label>

                            <input
                                id="profile-role"
                                type="text"
                                value={user?.role || "Student"}
                                disabled
                            />
                        </div>

                        <div>
                            <label htmlFor="profile-crn">
                                CRN
                            </label>

                            <input
                                id="profile-crn"
                                name="crn"
                                type="text"
                                value={profile.crn}
                                onChange={handleChange}
                                disabled={!editing}
                                placeholder="Enter your CRN"
                            />
                        </div>

                        <div>
                            <label htmlFor="profile-course">
                                Course
                            </label>

                            <input
                                id="profile-course"
                                name="course"
                                type="text"
                                value={profile.course}
                                onChange={handleChange}
                                disabled={!editing}
                                placeholder="Enter your course"
                            />
                        </div>

                        <div>
                            <label htmlFor="profile-department">
                                Department
                            </label>

                            <input
                                id="profile-department"
                                name="department"
                                type="text"
                                value={profile.department}
                                onChange={handleChange}
                                disabled={!editing}
                                placeholder="Enter your department"
                            />
                        </div>
                    </div>

                    <div className="profile-actions">
                        {editing ? (
                            <>
                                <button
                                    type="submit"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : "Save Changes"}
                                </button>

                                <button
                                    type="button"
                                    className="profile-cancel"
                                    onClick={handleCancel}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditing(true);
                                    setError("");
                                    setMessage("");
                                }}
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );


}

export default StudentProfile;
