import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout.jsx";

const API_URL = "http://localhost:5000/api/dashboard";

function AdminDashboard() {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        totalMaterials: 0,
        publishedNotices: 0,
    });


    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState("");

    const [activities, setActivities] = useState([]);
    const [activitiesLoading, setActivitiesLoading] = useState(true);
    const [activitiesError, setActivitiesError] = useState("");

    // Fetch dashboard statistics from the backend.
    useEffect(() => {
        let isMounted = true;

        const fetchDashboardStats = async () => {
            try {
                setStatsLoading(true);
                setStatsError("");

                const token = sessionStorage.getItem("token");

                if (!token) {
                    throw new Error(
                        "Your session has expired. Please log in again."
                    );
                }

                const response = await fetch(`${API_URL}/stats`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const contentType =
                    response.headers.get("content-type") || "";

                if (!contentType.includes("application/json")) {
                    throw new Error(
                        "The server returned an invalid response. Please check the backend."
                    );
                }

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Unable to load dashboard statistics."
                    );
                }

                if (isMounted) {
                    setStats({
                        totalStudents: data.stats?.totalStudents ?? 0,
                        totalTeachers: data.stats?.totalTeachers ?? 0,
                        totalMaterials: data.stats?.totalMaterials ?? 0,
                        publishedNotices:
                            data.stats?.publishedNotices ?? 0,
                    });
                }
            } catch (error) {
                console.error("Dashboard statistics error:", error);

                if (isMounted) {
                    setStatsError(
                        error.message ||
                        "Unable to load dashboard statistics."
                    );
                }
            } finally {
                if (isMounted) {
                    setStatsLoading(false);
                }
            }
        };

        fetchDashboardStats();

        return () => {
            isMounted = false;
        };
    }, []);

    // Fetch recent activities from the backend.
    useEffect(() => {
        let isMounted = true;

        const fetchRecentActivities = async () => {
            try {
                setActivitiesLoading(true);
                setActivitiesError("");

                const token = sessionStorage.getItem("token");

                if (!token) {
                    throw new Error(
                        "Your session has expired. Please log in again."
                    );
                }

                const response = await fetch(`${API_URL}/activities`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const contentType =
                    response.headers.get("content-type") || "";

                if (!contentType.includes("application/json")) {
                    throw new Error(
                        "The server returned an invalid response. Please check the backend."
                    );
                }

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Unable to load recent activities."
                    );
                }

                if (isMounted) {
                    setActivities(
                        Array.isArray(data.activities)
                            ? data.activities
                            : []
                    );
                }
            } catch (error) {
                console.error("Recent activities error:", error);

                if (isMounted) {
                    setActivitiesError(
                        error.message ||
                        "Unable to load recent activities."
                    );
                }
            } finally {
                if (isMounted) {
                    setActivitiesLoading(false);
                }
            }
        };

        fetchRecentActivities();

        return () => {
            isMounted = false;
        };
    }, []);

    // Format activity timestamps for display.
    const formatActivityTime = (dateValue) => {
        if (!dateValue) {
            return "Recently";
        }

        const activityDate = new Date(dateValue);

        if (Number.isNaN(activityDate.getTime())) {
            return "Recently";
        }

        const difference = Date.now() - activityDate.getTime();

        if (difference < 0) {
            return activityDate.toLocaleDateString();
        }

        const minutes = Math.floor(difference / (1000 * 60));

        if (minutes < 1) {
            return "Just now";
        }

        if (minutes < 60) {
            return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
        }

        const hours = Math.floor(minutes / 60);

        if (hours < 24) {
            return `${hours} hour${hours === 1 ? "" : "s"} ago`;
        }

        const days = Math.floor(hours / 24);

        if (days < 7) {
            return `${days} day${days === 1 ? "" : "s"} ago`;
        }

        return activityDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const statCards = [
        {
            title: "Total Students",
            value: stats.totalStudents,
            icon: "🎓",
            color: "blue",
        },
        {
            title: "Total Teachers",
            value: stats.totalTeachers,
            icon: "👨‍🏫",
            color: "green",
        },
        {
            title: "Study Materials",
            value: stats.totalMaterials,
            icon: "📚",
            color: "purple",
        },
        {
            title: "Published Notices",
            value: stats.publishedNotices,
            icon: "📢",
            color: "orange",
        },
    ];

    return (
        <AdminLayout>
            <div className="admin-dashboard">
                {/* Top Bar */}
                <header className="dashboard-topbar">
                    <div>
                        <h2>Admin Dashboard</h2>
                        <p>Manage your Smart Campus portal</p>
                    </div>

                    <div className="topbar-right">
                        <Link
                            to="/admin/send-notification"
                            className="notification-button"
                            aria-label="Notifications"
                            title="Send notification"
                        >
                            🔔
                        </Link>

                        <div className="profile-info">
                            <div className="profile-avatar">A</div>

                            <div>
                                <strong>Administrator</strong>
                                <span>Admin</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Welcome Section */}
                <section className="dashboard-welcome">
                    <span className="welcome-label">
                        ADMINISTRATION
                    </span>

                    <h1>Welcome, Administrator! 👋</h1>

                    <p>
                        Manage students, teachers, academic resources,
                        and college announcements from one place.
                    </p>
                </section>

                {/* Dashboard Statistics */}
                <section className="admin-stats-grid">
                    {statCards.map((stat) => (
                        <article
                            className="admin-stat-card"
                            key={stat.title}
                        >
                            <div
                                className={`admin-stat-icon ${stat.color}`}
                            >
                                {stat.icon}
                            </div>

                            <div>
                                <p>{stat.title}</p>

                                <h2>
                                    {statsLoading ? "..." : stat.value}
                                </h2>

                                <span>Database overview</span>
                            </div>
                        </article>
                    ))}
                </section>

                {/* Statistics Error */}
                {statsError && (
                    <div
                        className="admin-dashboard-stats-error"
                        role="alert"
                    >
                        <strong>Unable to load statistics.</strong>
                        <p>{statsError}</p>

                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Management Cards */}
                <section className="admin-section">
                    <div className="admin-section-heading">
                        <div>
                            <h2>Portal Management</h2>
                            <p>
                                Manage important areas of your college portal.
                            </p>
                        </div>
                    </div>

                    <div className="admin-management-grid">
                        <Link
                            to="/admin/users"
                            className="admin-management-card"
                        >
                            <span className="management-icon">👥</span>
                            <h3>Manage Users</h3>
                            <p>
                                Create and manage student and teacher accounts.
                            </p>
                            <span className="management-link">
                                Manage users →
                            </span>
                        </Link>

                        <Link
                            to="/admin/faculty"
                            className="admin-management-card"
                        >
                            <span className="management-icon">👨‍🏫</span>
                            <h3>Manage Faculty</h3>
                            <p>
                                Maintain faculty profiles and department details.
                            </p>
                            <span className="management-link">
                                Manage faculty →
                            </span>
                        </Link>

                        <Link
                            to="/admin/materials"
                            className="admin-management-card"
                        >
                            <span className="management-icon">📚</span>
                            <h3>Study Materials</h3>
                            <p>
                                Review and manage academic learning resources.
                            </p>
                            <span className="management-link">
                                View materials →
                            </span>
                        </Link>

                        <Link
                            to="/admin/notices"
                            className="admin-management-card"
                        >
                            <span className="management-icon">📢</span>
                            <h3>Manage Notices</h3>
                            <p>
                                Publish important college announcements.
                            </p>
                            <span className="management-link">
                                Manage notices →
                            </span>
                        </Link>

                        <Link
                            to="/admin/events"
                            className="admin-management-card"
                        >
                            <span className="management-icon">📅</span>
                            <h3>Manage Events</h3>
                            <p>Create and update college events.</p>
                            <span className="management-link">
                                Manage events →
                            </span>
                        </Link>

                        <Link
                            to="/admin/send-notification"
                            className="admin-management-card"
                        >
                            <span className="management-icon">🔔</span>
                            <h3>Send Notification</h3>
                            <p>
                                Send campus updates to students and teachers.
                            </p>
                            <span className="management-link">
                                Send notification →
                            </span>
                        </Link>

                        <Link
                            to="/admin/add-user"
                            className="admin-management-card"
                        >
                            <span className="management-icon">➕</span>
                            <h3>Add New User</h3>
                            <p>
                                Create an account for a student or teacher.
                            </p>
                            <span className="management-link">
                                Add user →
                            </span>
                        </Link>
                    </div>
                </section>

                {/* Recent Activities */}
                <section className="admin-section">
                    <div className="admin-section-heading">
                        <div>
                            <h2>Recent Activities</h2>
                            <p>
                                Latest updates from your Smart Campus portal.
                            </p>
                        </div>
                    </div>

                    {activitiesError && (
                        <div
                            className="admin-dashboard-stats-error"
                            role="alert"
                        >
                            <strong>Unable to load recent activities.</strong>
                            <p>{activitiesError}</p>

                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {activitiesLoading ? (
                        <div className="admin-activity-list">
                            <article className="admin-activity-item">
                                <div className="activity-icon">⏳</div>
                                <div className="activity-description">
                                    <h3>Loading activities...</h3>
                                    <p>
                                        Fetching the latest portal updates.
                                    </p>
                                </div>
                            </article>
                        </div>
                    ) : !activitiesError && activities.length === 0 ? (
                        <div className="admin-activity-list">
                            <article className="admin-activity-item">
                                <div className="activity-icon">📭</div>
                                <div className="activity-description">
                                    <h3>No recent activities</h3>
                                    <p>
                                        Activities will appear here as portal
                                        data is added.
                                    </p>
                                </div>
                            </article>
                        </div>
                    ) : (
                        !activitiesError && (
                            <div className="admin-activity-list">
                                {activities.map((activity, index) => (
                                    <article
                                        className="admin-activity-item"
                                        key={
                                            activity.id ||
                                            `${activity.title}-${index}`
                                        }
                                    >
                                        <div className="activity-icon">
                                            {activity.icon || "🔔"}
                                        </div>

                                        <div className="activity-description">
                                            <h3>
                                                {activity.title ||
                                                    "Portal activity"}
                                            </h3>
                                            <p>
                                                {activity.description ||
                                                    "A portal update was recorded."}
                                            </p>
                                        </div>

                                        <span className="activity-time">
                                            {formatActivityTime(
                                                activity.createdAt
                                            )}
                                        </span>
                                    </article>
                                ))}
                            </div>
                        )
                    )}
                </section>
            </div>
        </AdminLayout>
    );


}

export default AdminDashboard;
