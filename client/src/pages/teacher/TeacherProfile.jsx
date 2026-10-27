import { useAuth } from "../../context/AuthContext.jsx";

function TeacherProfile() {
    const { user } = useAuth();

    return (
        <div className="page-container">
            <div className="profile-card">
                <h1>Teacher Profile</h1>
                <p>View your account information.</p>

                <div className="profile-avatar">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "T"}
                </div>

                <div className="profile-details">
                    <div>
                        <strong>Name</strong>
                        <p>{user?.name || "Teacher Name"}</p>
                    </div>

                    <div>
                        <strong>Email</strong>
                        <p>{user?.email || "Not available"}</p>
                    </div>

                    <div>
                        <strong>Role</strong>
                        <p>{user?.role || "Teacher"}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherProfile;