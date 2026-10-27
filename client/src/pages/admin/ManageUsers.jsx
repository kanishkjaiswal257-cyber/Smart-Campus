import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
    getUsers,
    updateUserStatus,
} from "../../services/userApi.js";

function ManageUsers() {
    const { token } = useAuth();


    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [updatingUserId, setUpdatingUserId] = useState("");

    // Fetch users from the backend
    const fetchUsers = useCallback(async () => {
        if (!token) {
            setUsers([]);
            setError("Your session may have expired. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const userList = await getUsers(token);
            setUsers(Array.isArray(userList) ? userList : []);
        } catch (err) {
            setError(err.message || "Unable to fetch users.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Fetch users when the page opens or token changes
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Deactivate or reactivate a user
    const handleToggleStatus = async (user) => {
        const action = user.isActive ? "deactivate" : "reactivate";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} ${user.name}'s account?`
        );

        if (!confirmed) {
            return;
        }

        if (!token) {
            window.alert("Your session has expired. Please log in again.");
            return;
        }

        try {
            setUpdatingUserId(user._id);

            const result = await updateUserStatus(
                user._id,
                action,
                token
            );

            window.alert(result.message || "Account status updated.");
            await fetchUsers();
        } catch (err) {
            window.alert(
                err.message || "Failed to update account status."
            );
        } finally {
            setUpdatingUserId("");
        }
    };

    // Search and filter users
    const filteredUsers = users.filter((user) => {
        const searchText = search.trim().toLowerCase();

        const matchesSearch =
            user.name?.toLowerCase().includes(searchText) ||
            user.email?.toLowerCase().includes(searchText) ||
            user.crn?.toLowerCase().includes(searchText) ||
            user.employeeId?.toLowerCase().includes(searchText) ||
            user.department?.toLowerCase().includes(searchText);

        const matchesRole =
            roleFilter === "all" || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    // Statistics
    const totalUsers = users.length;

    const totalStudents = users.filter(
        (user) => user.role === "student"
    ).length;

    const totalTeachers = users.filter(
        (user) => user.role === "teacher"
    ).length;

    const activeUsers = users.filter(
        (user) => user.isActive === true
    ).length;

    return (
        <AdminLayout>
            <section className="manage-users-page">

                {/* Page Header */}
                <div className="manage-users-header">
                    <div>
                        <p className="page-eyebrow">USER MANAGEMENT</p>

                        <h1>Manage Users</h1>

                        <p>
                            View, search, and manage registered
                            students and teachers.
                        </p>
                    </div>

                    <div className="manage-users-header-actions">
                        <button
                            type="button"
                            className="refresh-users-button"
                            onClick={fetchUsers}
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "↻ Refresh"}
                        </button>

                        <Link
                            to="/admin/add-user"
                            className="add-user-link"
                        >
                            + Add User
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="user-statistics">

                    <div className="user-stat-card">
                        <div className="user-stat-icon total-icon">
                            👥
                        </div>

                        <div>
                            <p>Total Users</p>
                            <h2>{totalUsers}</h2>
                        </div>
                    </div>

                    <div className="user-stat-card">
                        <div className="user-stat-icon student-icon">
                            🎓
                        </div>

                        <div>
                            <p>Students</p>
                            <h2>{totalStudents}</h2>
                        </div>
                    </div>

                    <div className="user-stat-card">
                        <div className="user-stat-icon teacher-icon">
                            👨‍🏫
                        </div>

                        <div>
                            <p>Teachers</p>
                            <h2>{totalTeachers}</h2>
                        </div>
                    </div>

                    <div className="user-stat-card">
                        <div className="user-stat-icon active-icon">
                            ✓
                        </div>

                        <div>
                            <p>Active Accounts</p>
                            <h2>{activeUsers}</h2>
                        </div>
                    </div>

                </div>

                {/* Search and Filter */}
                <div className="users-toolbar">

                    <div className="users-search">
                        <span>🔍</span>

                        <input
                            type="search"
                            placeholder="Search name, email, CRN or ID..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            aria-label="Search users"
                        />
                    </div>

                    <select
                        className="users-role-filter"
                        value={roleFilter}
                        onChange={(event) =>
                            setRoleFilter(event.target.value)
                        }
                        aria-label="Filter users by role"
                    >
                        <option value="all">All Users</option>
                        <option value="student">Students</option>
                        <option value="teacher">Teachers</option>
                    </select>

                </div>

                {/* Users Table */}
                <div className="users-table-card">

                    <div className="users-table-heading">
                        <div>
                            <h2>Registered Users</h2>

                            <p>
                                {filteredUsers.length} user
                                {filteredUsers.length !== 1 ? "s" : ""}
                                {" "}found
                            </p>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="users-state">
                            <div className="users-loader"></div>
                            <p>Loading users from the server...</p>
                        </div>
                    ) : error ? (
                        /* Error State */
                        <div className="users-state users-error">
                            <p>{error}</p>

                            <button
                                type="button"
                                onClick={fetchUsers}
                            >
                                Try Again
                            </button>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        /* Empty State */
                        <div className="users-state">
                            <div className="empty-users-icon">
                                📂
                            </div>

                            <h3>No users found</h3>

                            <p>
                                {users.length === 0
                                    ? "No student or teacher accounts were returned by the server. Try refreshing the page."
                                    : "Try changing your search or role filter."}
                            </p>

                            {users.length === 0 && (
                                <button
                                    type="button"
                                    onClick={fetchUsers}
                                >
                                    Refresh Users
                                </button>
                            )}
                        </div>
                    ) : (
                        /* Users Table */
                        <div className="users-table-wrapper">
                            <table className="users-table">

                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>CRN / Employee ID</th>
                                        <th>Department</th>
                                        <th>Course / Semester</th>
                                        <th>Account Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user._id || user.id}>

                                            {/* User Details */}
                                            <td>
                                                <div className="user-identity">
                                                    <div className="user-avatar">
                                                        {user.name
                                                            ?.charAt(0)
                                                            .toUpperCase() || "U"}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {user.name || "Unnamed User"}
                                                        </strong>

                                                        <span>
                                                            {user.email || "No email"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* User Role */}
                                            <td>
                                                <span
                                                    className={`user-role-badge ${user.role}`}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>

                                            {/* CRN or Employee ID */}
                                            <td>
                                                {user.role === "student"
                                                    ? user.crn || "—"
                                                    : user.employeeId || "—"}
                                            </td>

                                            {/* Department */}
                                            <td>
                                                {user.department || "—"}
                                            </td>

                                            {/* Course and Semester */}
                                            <td>
                                                {user.role === "student"
                                                    ? `${user.course || "—"}${user.semester
                                                        ? ` / Sem ${user.semester}`
                                                        : ""
                                                    }`
                                                    : "—"}
                                            </td>

                                            {/* Account Status */}
                                            <td>
                                                <span
                                                    className={`account-status-badge ${user.isActive
                                                        ? "active"
                                                        : "inactive"
                                                        }`}
                                                >
                                                    {user.isActive
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>

                                            {/* Deactivate / Reactivate */}
                                            <td>
                                                <button
                                                    type="button"
                                                    className={`account-action-button ${user.isActive
                                                        ? "deactivate"
                                                        : "reactivate"
                                                        }`}
                                                    onClick={() =>
                                                        handleToggleStatus(user)
                                                    }
                                                    disabled={
                                                        updatingUserId === user._id
                                                    }
                                                >
                                                    {updatingUserId === user._id
                                                        ? "Updating..."
                                                        : user.isActive
                                                            ? "Deactivate"
                                                            : "Reactivate"}
                                                </button>
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>
                    )}

                </div>
            </section>
        </AdminLayout>
    );


}

export default ManageUsers;
