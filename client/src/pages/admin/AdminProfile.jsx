function AdminProfile() {
    const admin = JSON.parse(sessionStorage.getItem("user") || "{}");

    return (
        <div className="page-container">
            <div className="profile-card">
                <h1>Admin Profile</h1>
                <p>Manage your administrator account information.</p>

                <div className="profile-avatar">
                    {admin.name ? admin.name.charAt(0).toUpperCase() : "A"}
                </div>

                <div className="profile-details">
                    <div>
                        <strong>Name</strong>
                        <p>{admin.name || "Administrator"}</p>
                    </div>

                    <div>
                        <strong>Email</strong>
                        <p>{admin.email || "Not available"}</p>
                    </div>

                    <div>
                        <strong>Role</strong>
                        <p>{admin.role || "Admin"}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminProfile;