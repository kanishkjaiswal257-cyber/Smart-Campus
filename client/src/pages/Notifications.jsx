import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Notifications() {
    const navigate = useNavigate();


    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const API_URL = "http://localhost:5000/api/notifications";

    const getToken = () => sessionStorage.getItem("token");

    // Fetch notifications from the backend
    const fetchNotifications = useCallback(async () => {
        try {
            setError("");

            const token = getToken();

            if (!token) {
                throw new Error("Please log in to view notifications.");
            }

            const response = await fetch(API_URL, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load notifications."
                );
            }

            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Mark one notification as read
    const markAsRead = async (notificationId) => {
        try {
            setActionLoading(notificationId);
            setError("");
            setMessage("");

            const token = getToken();

            const response = await fetch(
                `${API_URL}/${notificationId}/read`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to mark notification as read."
                );
            }

            setNotifications((previous) =>
                previous.map((notification) =>
                    notification._id === notificationId
                        ? {
                            ...notification,
                            isRead: true,
                            readAt: new Date().toISOString(),
                        }
                        : notification
                )
            );

            setUnreadCount((previous) => Math.max(0, previous - 1));
            setMessage("Notification marked as read.");
        } catch (err) {
            setError(err.message || "Unable to update notification.");
        } finally {
            setActionLoading("");
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            setActionLoading("all");
            setError("");
            setMessage("");

            const token = getToken();

            const response = await fetch(`${API_URL}/read-all`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to update notifications."
                );
            }

            setNotifications((previous) =>
                previous.map((notification) => ({
                    ...notification,
                    isRead: true,
                    readAt:
                        notification.readAt ||
                        new Date().toISOString(),
                }))
            );

            setUnreadCount(0);
            setMessage("All notifications marked as read.");
        } catch (err) {
            setError(err.message || "Unable to update notifications.");
        } finally {
            setActionLoading("");
        }
    };

    // Handle notification clicks
    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }

        const link = notification.link;

        // Navigate only to internal application paths
        if (
            typeof link === "string" &&
            link.startsWith("/") &&
            !link.startsWith("//")
        ) {
            navigate(link);
        }
    };

    const formatDate = (date) => {
        if (!date) return "";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "";
        }

        return parsedDate.toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="notification-page">
                    <p className="notification-loading">
                        Loading notifications...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <section className="notification-page">
                <div className="notification-header">
                    <div>
                        <span className="notification-eyebrow">
                            SMART CAMPUS
                        </span>

                        <h1>Notifications</h1>

                        <p>
                            Stay updated with important campus
                            announcements and activities.
                        </p>
                    </div>

                    <div className="notification-summary">
                        <span className="notification-summary-icon">
                            🔔
                        </span>

                        <div>
                            <strong>{unreadCount}</strong>
                            <span>Unread</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="notification-alert notification-alert-error">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="notification-alert notification-alert-success">
                        {message}
                    </div>
                )}

                <div className="notification-toolbar">
                    <div>
                        <h2>Recent Activity</h2>
                        <span>
                            {notifications.length} notification
                            {notifications.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    <div className="notification-toolbar-actions">
                        <button
                            type="button"
                            className="notification-refresh"
                            onClick={fetchNotifications}
                            disabled={actionLoading !== ""}
                        >
                            Refresh
                        </button>

                        <button
                            type="button"
                            className="notification-mark-all"
                            onClick={markAllAsRead}
                            disabled={
                                unreadCount === 0 ||
                                actionLoading !== ""
                            }
                        >
                            {actionLoading === "all"
                                ? "Updating..."
                                : "Mark All as Read"}
                        </button>
                    </div>
                </div>

                {notifications.length === 0 ? (
                    <div className="notification-empty">
                        <div className="notification-empty-icon">
                            🔔
                        </div>

                        <h3>You're all caught up!</h3>

                        <p>
                            New campus notifications will appear here.
                        </p>

                        <button
                            type="button"
                            onClick={fetchNotifications}
                        >
                            Check Again
                        </button>
                    </div>
                ) : (
                    <div className="notification-list">
                        {notifications.map((notification) => (
                            <article
                                key={notification._id}
                                className={`notification-item ${notification.isRead
                                    ? "notification-read"
                                    : "notification-unread"
                                    }`}
                            >
                                <div className="notification-type-icon">
                                    {notification.type === "Event"
                                        ? "📅"
                                        : notification.type === "Notice"
                                            ? "📢"
                                            : notification.type === "Academic"
                                                ? "📚"
                                                : notification.type === "Important"
                                                    ? "⚠️"
                                                    : "🔔"}
                                </div>

                                <div className="notification-content">
                                    <div className="notification-title-row">
                                        <h3>{notification.title}</h3>

                                        {!notification.isRead && (
                                            <span className="notification-new-badge">
                                                NEW
                                            </span>
                                        )}
                                    </div>

                                    <p>{notification.message}</p>

                                    <div className="notification-meta">
                                        <span className="notification-type">
                                            {notification.type || "General"}
                                        </span>

                                        <span>
                                            {formatDate(
                                                notification.createdAt
                                            )}
                                        </span>
                                    </div>

                                    <div className="notification-item-actions">
                                        {!notification.isRead && (
                                            <button
                                                type="button"
                                                className="notification-read-button"
                                                disabled={
                                                    actionLoading !== ""
                                                }
                                                onClick={() =>
                                                    markAsRead(
                                                        notification._id
                                                    )
                                                }
                                            >
                                                {actionLoading ===
                                                    notification._id
                                                    ? "Updating..."
                                                    : "✓ Mark as Read"}
                                            </button>
                                        )}

                                        {notification.link &&
                                            notification.link.startsWith("/") &&
                                            !notification.link.startsWith("//") && (
                                                <button
                                                    type="button"
                                                    className="notification-open-button"
                                                    onClick={() =>
                                                        handleNotificationClick(
                                                            notification
                                                        )
                                                    }
                                                >
                                                    Open →
                                                </button>
                                            )}
                                    </div>
                                </div>

                                {!notification.isRead && (
                                    <span className="notification-unread-dot" />
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );


}

export default Notifications;
