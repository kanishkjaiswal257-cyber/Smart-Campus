
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import StudentLayout from "../../layouts/StudentLayout.jsx";

const API = "http://localhost:5000/api";
const SERVER_URL = "http://localhost:5000";

function getArray(data, key) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.[key])) return data[key];
    return [];
}

function formatDate(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function getEventDate(event) {
    const value =
        event.date ||
        event.eventDate ||
        event.startDate ||
        event.start_date;

    if (!value) return null;

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

function getFileType(material) {
    const filename =
        material.fileName ||
        material.fileUrl ||
        material.title ||
        "";

    const extension = filename
        .split("/")
        .pop()
        .split("?")[0]
        .split(".")
        .pop();

    return extension ? extension.toUpperCase() : "FILE";
}

function getFileUrl(material) {
    if (!material.fileUrl) return "";

    if (
        material.fileUrl.startsWith("https://") ||
        material.fileUrl.startsWith("http://")
    ) {
        return material.fileUrl;
    }

    return `${SERVER_URL}${material.fileUrl.startsWith("/")
        ? material.fileUrl
        : `/${material.fileUrl}`
        }`;
}

function matchesSearch(item, query, fields) {
    if (!query) return true;

    const searchableText = fields
        .map((field) => {
            const value = field
                .split(".")
                .reduce((current, key) => current?.[key], item);

            return typeof value === "string" ||
                typeof value === "number"
                ? String(value)
                : "";
        })
        .join(" ")
        .toLowerCase();

    return searchableText.includes(query);
}

function StudentDashboard() {
    const { user } = useAuth();

    const [notices, setNotices] = useState([]);
    const [events, setEvents] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [faculty, setFaculty] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);

    const studentName =
        user?.name ||
        user?.fullName ||
        "Student";

    // Fetch actual data from backend APIs.
    useEffect(() => {
        let active = true;

        async function loadDashboard() {
            setLoading(true);
            setErrors([]);

            const token = sessionStorage.getItem("token");

            const headers = token
                ? { Authorization: `Bearer ${token}` }
                : {};

            const requests = [
                {
                    label: "Notices",
                    url: `${API}/notices`,
                    key: "notices",
                },
                {
                    label: "Events",
                    url: `${API}/events`,
                    key: "events",
                },
                {
                    label: "Study materials",
                    url: `${API}/materials`,
                    key: "materials",
                },
                {
                    label: "Faculty",
                    url: `${API}/faculty`,
                    key: "faculty",
                },
            ];

            const results = await Promise.allSettled(
                requests.map(async (request) => {
                    const response = await fetch(request.url, {
                        headers,
                    });

                    const contentType =
                        response.headers.get("content-type") || "";

                    if (!contentType.includes("application/json")) {
                        throw new Error(
                            `${request.label} API returned a non-JSON response.`
                        );
                    }

                    const data = await response.json();

                    if (!response.ok || data?.success === false) {
                        throw new Error(
                            data?.message ||
                            `Unable to load ${request.label.toLowerCase()}.`
                        );
                    }

                    return {
                        ...request,
                        records: getArray(data, request.key),
                    };
                })
            );

            if (!active) return;

            const newErrors = [];

            results.forEach((result, index) => {
                const request = requests[index];

                if (result.status === "rejected") {
                    newErrors.push(
                        `${request.label}: ${result.reason?.message ||
                        "Unable to load data."
                        }`
                    );
                    return;
                }

                const records = result.value.records;

                if (request.key === "notices") {
                    setNotices(records);
                }

                if (request.key === "events") {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const upcomingEvents = records
                        .filter((event) => {
                            const date = getEventDate(event);

                            // Keep undated events visible because an
                            // existing event schema may omit its date field.
                            return !date || date >= today;
                        })
                        .sort((a, b) => {
                            const dateA = getEventDate(a);
                            const dateB = getEventDate(b);

                            if (!dateA && !dateB) return 0;
                            if (!dateA) return 1;
                            if (!dateB) return -1;

                            return dateA - dateB;
                        });

                    setEvents(upcomingEvents);
                }

                if (request.key === "materials") {
                    setMaterials(records);
                }

                if (request.key === "faculty") {
                    setFaculty(records);
                }
            });

            setErrors(newErrors);
            setLoading(false);
        }

        loadDashboard();

        return () => {
            active = false;
        };
    }, []);

    // Functional global search across notices, events, materials and faculty.
    const query = searchTerm.trim().toLowerCase();

    const filteredNotices = useMemo(
        () =>
            notices.filter((notice) =>
                matchesSearch(notice, query, [
                    "title",
                    "description",
                    "category",
                    "priority",
                ])
            ),
        [notices, query]
    );

    const filteredEvents = useMemo(
        () =>
            events.filter((event) =>
                matchesSearch(event, query, [
                    "title",
                    "name",
                    "description",
                    "category",
                    "location",
                    "venue",
                ])
            ),
        [events, query]
    );

    const filteredMaterials = useMemo(
        () =>
            materials.filter((material) =>
                matchesSearch(material, query, [
                    "title",
                    "subject",
                    "description",
                    "semester",
                    "fileName",
                ])
            ),
        [materials, query]
    );

    const filteredFaculty = useMemo(
        () =>
            faculty.filter((teacher) =>
                matchesSearch(teacher, query, [
                    "name",
                    "email",
                    "department",
                    "employeeId",
                ])
            ),
        [faculty, query]
    );

    const stats = [
        {
            title: "Total Notices",
            value: notices.length,
            subtitle: "Published announcements",
            icon: "📢",
            color: "blue",
        },
        {
            title: "Upcoming Events",
            value: events.length,
            subtitle: "College events",
            icon: "📅",
            color: "purple",
        },
        {
            title: "Study Materials",
            value: materials.length,
            subtitle: "Available resources",
            icon: "📚",
            color: "green",
        },
    ];

    const getEventTitle = (event) =>
        event.title || event.name || "Untitled Event";

    const getEventLocation = (event) =>
        event.location ||
        event.venue ||
        event.place ||
        "Location not specified";

    const getEventTime = (event) => {
        if (event.time) return event.time;

        const start = event.startTime || event.start_time;
        const end = event.endTime || event.end_time;

        if (start && end) return `${start} – ${end}`;
        return start || end || "Time not specified";
    };

    const getNoticeDate = (notice) =>
        formatDate(
            notice.publishedAt ||
            notice.createdAt ||
            notice.date
        );

    const getEventDateParts = (event) => {
        const date = getEventDate(event);

        if (!date) {
            return {
                day: "—",
                month: "TBA",
            };
        }

        return {
            day: date.toLocaleDateString("en-IN", {
                day: "2-digit",
            }),
            month: date.toLocaleDateString("en-IN", {
                month: "short",
            }).toUpperCase(),
        };
    };

    return (
        <StudentLayout>
            <div className="student-dashboard">
                {/* Top navigation and working global search */}
                <header className="dashboard-topbar">
                    <div className="dashboard-search">
                        <span aria-hidden="true">⌕</span>

                        <input
                            type="search"
                            placeholder="Search notices, materials, events, faculty..."
                            aria-label="Search campus information"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(event.target.value)
                            }
                        />

                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                aria-label="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="topbar-right">
                        <div className="topbar-weather">
                            <span>☀️</span>
                            <div>
                                <strong>Campus</strong>
                                <small>Smart Campus</small>
                            </div>
                        </div>

                        <div className="topbar-profile">
                            <span className="profile-avatar">
                                {studentName.charAt(0).toUpperCase()}
                            </span>

                            <div>
                                <strong>{studentName}</strong>
                                <small>Student</small>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Welcome */}
                <section className="dashboard-welcome">
                    <div>
                        <h1>Welcome back, {studentName}! 👋</h1>

                        <p>
                            Stay updated with college notices, events and
                            study resources shared by your faculty.
                        </p>
                    </div>
                </section>

                {/* Actual counts */}
                <section className="student-stats-grid">
                    {stats.map((stat) => (
                        <article
                            className={`student-stat-card ${stat.color}`}
                            key={stat.title}
                        >
                            <div className="stat-icon">
                                {stat.icon}
                            </div>

                            <div>
                                <p>{stat.title}</p>

                                <h2>
                                    {loading ? "…" : stat.value}
                                </h2>

                                <small>{stat.subtitle}</small>
                            </div>
                        </article>
                    ))}
                </section>

                {/* API errors are shown instead of silently using demo data */}
                {errors.length > 0 && (
                    <section
                        className="dashboard-panel"
                        role="alert"
                        style={{
                            marginBottom: 20,
                            padding: 18,
                            borderLeft: "4px solid #dc2626",
                        }}
                    >
                        <h3>Some dashboard data could not be loaded</h3>

                        {errors.map((error) => (
                            <p key={error}>{error}</p>
                        ))}

                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </button>
                    </section>
                )}

                {/* Global search results */}
                {query && (
                    <section
                        className="dashboard-panel"
                        style={{ marginBottom: 22, padding: 20 }}
                    >
                        <div className="panel-heading">
                            <h2>🔎 Search Results</h2>

                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                            >
                                Clear
                            </button>
                        </div>

                        {filteredNotices.length === 0 &&
                            filteredEvents.length === 0 &&
                            filteredMaterials.length === 0 &&
                            filteredFaculty.length === 0 ? (
                            <p>
                                No results found for "{searchTerm}".
                            </p>
                        ) : (
                            <div>
                                {filteredNotices.map((notice) => (
                                    <div
                                        className="student-notice"
                                        key={`notice-${notice._id || notice.title}`}
                                    >
                                        <span className="notice-dot blue" />

                                        <div className="notice-details">
                                            <strong>Notice</strong>
                                            <h3>{notice.title}</h3>
                                            <p>{notice.description}</p>
                                        </div>
                                    </div>
                                ))}

                                {filteredEvents.map((event) => (
                                    <div
                                        className="student-event"
                                        key={`event-${event._id || getEventTitle(event)}`}
                                    >
                                        <div className="event-details">
                                            <strong>Event</strong>
                                            <h3>{getEventTitle(event)}</h3>
                                            <p>{getEventLocation(event)}</p>
                                        </div>
                                    </div>
                                ))}

                                {filteredMaterials.map((material) => (
                                    <div
                                        className="student-material"
                                        key={`material-${material._id || material.title}`}
                                    >
                                        <div className="material-details">
                                            <strong>Study Material</strong>
                                            <h3>{material.title}</h3>
                                            <p>{material.subject}</p>
                                        </div>

                                        {getFileUrl(material) && (
                                            <a
                                                href={getFileUrl(material)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Open
                                            </a>
                                        )}
                                    </div>
                                ))}

                                {filteredFaculty.map((teacher) => (
                                    <div
                                        className="student-notice"
                                        key={`faculty-${teacher._id || teacher.email}`}
                                    >
                                        <span className="notice-dot green" />

                                        <div className="notice-details">
                                            <strong>Faculty</strong>
                                            <h3>{teacher.name}</h3>

                                            <p>
                                                {teacher.department || ""}
                                            </p>

                                            <p>{teacher.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Dashboard content */}
                <section className="student-content-grid">
                    {/* Latest notices */}
                    <article className="dashboard-panel notices-panel">
                        <div className="panel-heading">
                            <h2>📢 Latest Notices</h2>

                            <button
                                type="button"
                                onClick={() =>
                                    window.location.href = "/student/notices"
                                }
                            >
                                View All →
                            </button>
                        </div>

                        <div className="notice-list">
                            {loading ? (
                                <p>Loading notices...</p>
                            ) : filteredNotices.length === 0 ? (
                                <p>
                                    {query
                                        ? "No matching notices found."
                                        : "No published notices available."}
                                </p>
                            ) : (
                                filteredNotices.slice(0, 5).map((notice) => (
                                    <div
                                        className="student-notice"
                                        key={notice._id || notice.title}
                                    >
                                        <span
                                            className={`notice-dot ${String(notice.priority || "")
                                                .toLowerCase() === "high"
                                                ? "red"
                                                : "blue"
                                                }`}
                                        />

                                        <div className="notice-details">
                                            <h3>{notice.title}</h3>

                                            <p>{notice.description}</p>
                                        </div>

                                        <small className="notice-date">
                                            {getNoticeDate(notice)}
                                        </small>
                                    </div>
                                ))
                            )}
                        </div>
                    </article>

                    {/* Upcoming events */}
                    <article className="dashboard-panel events-panel">
                        <div className="panel-heading">
                            <h2>📅 Upcoming Events</h2>

                            <button
                                type="button"
                                onClick={() =>
                                    window.location.href = "/student/events"
                                }
                            >
                                View All →
                            </button>
                        </div>

                        <div className="event-list">
                            {loading ? (
                                <p>Loading events...</p>
                            ) : filteredEvents.length === 0 ? (
                                <p>
                                    {query
                                        ? "No matching events found."
                                        : "No upcoming events available."}
                                </p>
                            ) : (
                                filteredEvents.slice(0, 5).map((event) => {
                                    const dateParts =
                                        getEventDateParts(event);

                                    return (
                                        <div
                                            className="student-event"
                                            key={event._id || getEventTitle(event)}
                                        >
                                            <div className="event-date-box">
                                                <strong>
                                                    {dateParts.day}
                                                </strong>

                                                <span>
                                                    {dateParts.month}
                                                </span>
                                            </div>

                                            <div className="event-details">
                                                <h3>
                                                    {getEventTitle(event)}
                                                </h3>

                                                <span className="event-category">
                                                    {event.category ||
                                                        event.type ||
                                                        "College Event"}
                                                </span>

                                                <p>
                                                    ◷ {getEventTime(event)}
                                                </p>

                                                <p>
                                                    📍 {getEventLocation(event)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </article>

                    {/* Recent study materials */}
                    <article className="dashboard-panel materials-panel">
                        <div className="panel-heading">
                            <h2>📚 Recent Study Materials</h2>

                            <button
                                type="button"
                                onClick={() =>
                                    window.location.href = "/student/materials"
                                }
                            >
                                View All →
                            </button>
                        </div>

                        <div className="material-list">
                            {loading ? (
                                <p>Loading study materials...</p>
                            ) : filteredMaterials.length === 0 ? (
                                <p>
                                    {query
                                        ? "No matching study materials found."
                                        : "No study materials uploaded yet."}
                                </p>
                            ) : (
                                filteredMaterials.slice(0, 5).map((material) => {
                                    const fileUrl = getFileUrl(material);
                                    const type = getFileType(material);

                                    return (
                                        <div
                                            className="student-material"
                                            key={material._id || material.title}
                                        >
                                            <div
                                                className={`material-file-icon ${type.toLowerCase()}`}
                                            >
                                                {type}
                                            </div>

                                            <div className="material-details">
                                                <h3>{material.title}</h3>

                                                <p>
                                                    {material.subject ||
                                                        "Subject not specified"}
                                                </p>

                                                <small>
                                                    {formatDate(
                                                        material.createdAt
                                                    )}
                                                </small>
                                            </div>

                                            {fileUrl ? (
                                                <a
                                                    className="download-button"
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    aria-label={`Open ${material.title}`}
                                                    title="Open material"
                                                >
                                                    ↗
                                                </a>
                                            ) : (
                                                <span title="File link unavailable">
                                                    —
                                                </span>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </article>

                    {/* Quick links */}
                    <article className="dashboard-panel quick-links-panel">
                        <div className="panel-heading">
                            <h2>👥 Quick Links</h2>
                        </div>

                        <button
                            type="button"
                            className="quick-link"
                            onClick={() =>
                                window.location.href = "/student/notices"
                            }
                        >
                            📢 <span>View Notice Board</span>
                        </button>

                        <button
                            type="button"
                            className="quick-link"
                            onClick={() =>
                                window.location.href = "/student/faculty"
                            }
                        >
                            👨‍🏫 <span>Explore Faculty Directory</span>
                        </button>

                        <button
                            type="button"
                            className="quick-link"
                            onClick={() =>
                                window.location.href = "/student/events"
                            }
                        >
                            📅 <span>View College Events</span>
                        </button>

                        <button
                            type="button"
                            className="quick-link"
                            onClick={() =>
                                window.location.href = "/campus-map"
                            }
                        >
                            📍 <span>Campus Map</span>
                        </button>

                        <button
                            type="button"
                            className="quick-link"
                            onClick={() =>
                                window.location.href = "/student/materials"
                            }
                        >
                            📚 <span>All Study Materials</span>
                        </button>
                    </article>
                </section>
            </div>
        </StudentLayout>
    );
}

export default StudentDashboard;

