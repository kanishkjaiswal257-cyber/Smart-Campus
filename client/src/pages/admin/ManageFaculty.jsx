import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout.jsx";

const API_URL = "http://localhost:5000/api/users";

// Get the authentication token from browser storage.
function getAuthHeaders() {
    const token =
        sessionStorage.getItem("token") ||
        localStorage.getItem("token");

    if (!token) {
        throw new Error(
            "Authentication token missing. Please log in again."
        );
    }

    return {
        Authorization: `Bearer ${token}`,
    };
}

// Read a JSON response safely.
async function readResponse(response) {
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
        throw new Error(
            "Invalid server response. Check the backend server."
        );
    }

    return response.json();
}

function ManageFaculty() {
    const [faculty, setFaculty] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState("");

    // Fetch teacher accounts from the database.
    const fetchFaculty = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            // IMPORTANT: Send authentication token with GET request.
            const response = await fetch(API_URL, {
                method: "GET",
                headers: getAuthHeaders(),
            });

            const result = await readResponse(response);

            if (!response.ok || result.success === false) {
                throw new Error(
                    result.message || "Unable to load faculty accounts."
                );
            }

            const users = Array.isArray(result)
                ? result
                : Array.isArray(result.users)
                    ? result.users
                    : [];

            // Display teacher accounts, including inactive teachers.
            const teachers = users.filter(
                (user) =>
                    String(user.role || "").toLowerCase() === "teacher"
            );

            setFaculty(teachers);
        } catch (err) {
            console.error("Manage faculty error:", err);

            setError(
                err.message || "Unable to connect to the backend."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFaculty();
    }, [fetchFaculty]);

    // Search teachers by name, email, employee ID, or department.
    const filteredFaculty = useMemo(() => {
        const query = search.trim().toLowerCase();

        return faculty.filter((teacher) => {
            const matchesSearch =
                !query ||
                teacher.name?.toLowerCase().includes(query) ||
                teacher.email?.toLowerCase().includes(query) ||
                teacher.employeeId?.toLowerCase().includes(query) ||
                teacher.department?.toLowerCase().includes(query);

            const active = teacher.isActive !== false;

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && active) ||
                (statusFilter === "inactive" && !active);

            return matchesSearch && matchesStatus;
        });
    }, [faculty, search, statusFilter]);

    const activeFaculty = faculty.filter(
        (teacher) => teacher.isActive !== false
    ).length;

    const inactiveFaculty = faculty.length - activeFaculty;

    // Activate or deactivate a faculty account.
    const handleStatusChange = async (teacher) => {
        const action =
            teacher.isActive === false ? "reactivate" : "deactivate";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} ${teacher.name}'s account?`
        );

        if (!confirmed) return;

        try {
            setUpdatingId(teacher._id);
            setError("");

            // IMPORTANT:
            // Use PATCH and the teacher-specific endpoint.
            const response = await fetch(
                `${API_URL}/${teacher._id}/${action}`,
                {
                    method: "PATCH",
                    headers: getAuthHeaders(),
                }
            );

            const result = await readResponse(response);

            if (!response.ok || result.success === false) {
                throw new Error(
                    result.message ||
                    `Unable to ${action} this faculty account.`
                );
            }

            // Reload faculty data after a successful update.
            await fetchFaculty();
        } catch (err) {
            console.error("Faculty status update error:", err);

            setError(
                err.message || "Unable to update faculty status."
            );
        } finally {
            setUpdatingId("");
        }
    };

    return (
        <AdminLayout>
            <main className="manage-faculty-page">
                <style>{`
                    .manage-faculty-page {
                        padding: 28px;
                        color: #172033;
                    }

                    .manage-faculty-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 18px;
                        flex-wrap: wrap;
                        margin-bottom: 25px;
                    }

                    .manage-faculty-header h1 {
                        margin: 0 0 8px;
                        font-size: clamp(25px, 3vw, 32px);
                    }

                    .manage-faculty-header p {
                        color: #687386;
                        margin: 0;
                        line-height: 1.6;
                    }

                    .faculty-page-eyebrow {
                        color: #2458bd !important;
                        font-weight: 800;
                        font-size: 12px;
                        letter-spacing: 1.4px;
                        margin-bottom: 9px !important;
                    }

                    .faculty-header-actions {
                        display: flex;
                        gap: 10px;
                        flex-wrap: wrap;
                    }

                    .faculty-button {
                        display: inline-flex;
                        justify-content: center;
                        align-items: center;
                        gap: 7px;
                        min-height: 42px;
                        padding: 10px 15px;
                        border: 1px solid #dce3ed;
                        border-radius: 10px;
                        background: white;
                        color: #263449;
                        text-decoration: none;
                        font: inherit;
                        font-size: 14px;
                        font-weight: 700;
                        cursor: pointer;
                    }

                    .faculty-button:disabled {
                        opacity: 0.6;
                        cursor: wait;
                    }

                    .faculty-button-primary {
                        background: #2458bd;
                        border-color: #2458bd;
                        color: white;
                    }

                    .faculty-stats {
                        display: grid;
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                        gap: 16px;
                        margin-bottom: 24px;
                    }

                    .faculty-stat-card {
                        background: white;
                        border: 1px solid #e5eaf2;
                        border-radius: 14px;
                        padding: 20px;
                        box-shadow: 0 4px 14px rgba(28, 43, 68, 0.04);
                    }

                    .faculty-stat-card p {
                        margin: 0 0 10px;
                        color: #687386;
                        font-size: 14px;
                    }

                    .faculty-stat-card h2 {
                        margin: 0;
                        font-size: 29px;
                    }

                    .faculty-toolbar {
                        display: flex;
                        gap: 12px;
                        flex-wrap: wrap;
                        margin-bottom: 20px;
                    }

                    .faculty-toolbar input,
                    .faculty-toolbar select {
                        min-height: 44px;
                        box-sizing: border-box;
                        padding: 10px 13px;
                        background: white;
                        border: 1px solid #dce3ed;
                        border-radius: 10px;
                        font: inherit;
                        color: #172033;
                    }

                    .faculty-toolbar input {
                        flex: 1;
                        min-width: 220px;
                    }

                    .faculty-table-container {
                        overflow-x: auto;
                        background: white;
                        border: 1px solid #e5eaf2;
                        border-radius: 14px;
                    }

                    .faculty-table {
                        width: 100%;
                        border-collapse: collapse;
                        text-align: left;
                        min-width: 780px;
                    }

                    .faculty-table th {
                        padding: 15px 16px;
                        background: #f6f8fc;
                        color: #5b6679;
                        font-size: 12px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        white-space: nowrap;
                    }

                    .faculty-table td {
                        padding: 16px;
                        border-top: 1px solid #edf0f5;
                        font-size: 14px;
                        vertical-align: middle;
                    }

                    .faculty-identity {
                        display: flex;
                        align-items: center;
                        gap: 11px;
                        min-width: 180px;
                    }

                    .faculty-avatar {
                        width: 40px;
                        height: 40px;
                        flex-shrink: 0;
                        display: grid;
                        place-items: center;
                        border-radius: 12px;
                        background: #eaf2ff;
                        color: #2458bd;
                        font-weight: 800;
                    }

                    .faculty-identity strong {
                        display: block;
                        margin-bottom: 5px;
                        color: #1c2940;
                    }

                    .faculty-identity small {
                        color: #687386;
                        overflow-wrap: anywhere;
                    }

                    .faculty-badge {
                        display: inline-block;
                        border-radius: 20px;
                        padding: 6px 10px;
                        font-size: 12px;
                        font-weight: 700;
                        white-space: nowrap;
                    }

                    .faculty-badge-active {
                        background: #e7f8ef;
                        color: #167343;
                    }

                    .faculty-badge-inactive {
                        background: #fff0f0;
                        color: #b42323;
                    }

                    .faculty-action {
                        border: 0;
                        border-radius: 8px;
                        padding: 8px 10px;
                        background: #eaf2ff;
                        color: #2458bd;
                        font-size: 12px;
                        font-weight: 700;
                        cursor: pointer;
                        white-space: nowrap;
                    }

                    .faculty-action-deactivate {
                        background: #fff0f0;
                        color: #b42323;
                    }

                    .faculty-action:disabled {
                        opacity: 0.6;
                        cursor: wait;
                    }

                    .faculty-message {
                        margin-bottom: 18px;
                        padding: 14px 16px;
                        border-radius: 10px;
                        line-height: 1.5;
                    }

                    .faculty-error {
                        color: #a52525;
                        background: #fff0f0;
                        border: 1px solid #ffd3d3;
                    }

                    .faculty-error p {
                        overflow-wrap: anywhere;
                    }

                    .faculty-empty {
                        padding: 44px 20px;
                        text-align: center;
                        color: #687386;
                    }

                    .faculty-empty h2 {
                        color: #263449;
                        margin: 0 0 8px;
                        font-size: 20px;
                    }

                    @media (max-width: 700px) {
                        .manage-faculty-page {
                            padding: 16px;
                        }

                        .faculty-stats {
                            grid-template-columns: 1fr;
                        }

                        .faculty-toolbar input,
                        .faculty-toolbar select {
                            width: 100%;
                            min-width: 0;
                        }
                    }
                `}</style>

                <section className="manage-faculty-header">
                    <div>
                        <p className="faculty-page-eyebrow">
                            FACULTY MANAGEMENT
                        </p>

                        <h1>Manage Faculty 👨‍🏫</h1>

                        <p>
                            View and manage teacher accounts registered
                            in the Smart Campus portal.
                        </p>
                    </div>

                    <div className="faculty-header-actions">
                        <button
                            type="button"
                            className="faculty-button"
                            onClick={fetchFaculty}
                            disabled={loading}
                        >
                            ↻ Refresh
                        </button>

                        <Link
                            to="/admin/add-user"
                            className="faculty-button faculty-button-primary"
                        >
                            + Add Faculty
                        </Link>
                    </div>
                </section>

                <section className="faculty-stats">
                    <article className="faculty-stat-card">
                        <p>Total Faculty</p>
                        <h2>{loading ? "…" : faculty.length}</h2>
                    </article>

                    <article className="faculty-stat-card">
                        <p>Active Faculty</p>
                        <h2>{loading ? "…" : activeFaculty}</h2>
                    </article>

                    <article className="faculty-stat-card">
                        <p>Inactive Faculty</p>
                        <h2>{loading ? "…" : inactiveFaculty}</h2>
                    </article>
                </section>

                {error && (
                    <div
                        className="faculty-message faculty-error"
                        role="alert"
                    >
                        <strong>Could not complete the request.</strong>
                        <p>{error}</p>

                        <button
                            type="button"
                            className="faculty-button"
                            onClick={fetchFaculty}
                            disabled={loading}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                <section className="faculty-toolbar">
                    <input
                        type="search"
                        placeholder="Search name, email, Employee ID, department..."
                        aria-label="Search faculty"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />

                    <select
                        aria-label="Filter faculty by status"
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value)
                        }
                    >
                        <option value="all">All Faculty</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </section>

                <section className="faculty-table-container">
                    {loading ? (
                        <div className="faculty-empty">
                            Loading registered faculty...
                        </div>
                    ) : filteredFaculty.length === 0 ? (
                        <div className="faculty-empty">
                            <h2>
                                {faculty.length === 0
                                    ? "No faculty accounts found"
                                    : "No matching faculty found"}
                            </h2>

                            <p>
                                {faculty.length === 0
                                    ? "Teacher accounts created through Manage Users will appear here."
                                    : "Try changing your search or status filter."}
                            </p>
                        </div>
                    ) : (
                        <table className="faculty-table">
                            <thead>
                                <tr>
                                    <th>Faculty Member</th>
                                    <th>Employee ID</th>
                                    <th>Department</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredFaculty.map((teacher) => {
                                    const isActive =
                                        teacher.isActive !== false;

                                    return (
                                        <tr key={teacher._id}>
                                            <td>
                                                <div className="faculty-identity">
                                                    <div className="faculty-avatar">
                                                        {teacher.name
                                                            ?.charAt(0)
                                                            .toUpperCase() || "T"}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {teacher.name ||
                                                                "Unnamed Faculty"}
                                                        </strong>

                                                        <small>
                                                            {teacher.email ||
                                                                "No email available"}
                                                        </small>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                {teacher.employeeId || "—"}
                                            </td>

                                            <td>
                                                {teacher.department || "—"}
                                            </td>

                                            <td>
                                                <span
                                                    className={`faculty-badge ${isActive
                                                        ? "faculty-badge-active"
                                                        : "faculty-badge-inactive"
                                                        }`}
                                                >
                                                    {isActive
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className={`faculty-action ${isActive
                                                        ? "faculty-action-deactivate"
                                                        : ""
                                                        }`}
                                                    disabled={
                                                        updatingId === teacher._id
                                                    }
                                                    onClick={() =>
                                                        handleStatusChange(teacher)
                                                    }
                                                >
                                                    {updatingId === teacher._id
                                                        ? "Updating..."
                                                        : isActive
                                                            ? "Deactivate"
                                                            : "Reactivate"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </section>

                {!loading && (
                    <p style={{ color: "#687386", marginTop: 15 }}>
                        Showing {filteredFaculty.length} of {faculty.length}{" "}
                        registered faculty accounts.
                    </p>
                )}
            </main>
        </AdminLayout>
    );
}

export default ManageFaculty;