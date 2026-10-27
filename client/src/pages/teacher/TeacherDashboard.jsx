import { useEffect, useMemo, useState } from "react";
import TeacherLayout from "../../layouts/TeacherLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import StudentSearch from "../../components/StudentSearch";

const API_BASE = "http://localhost:5000/api";

// Safely extract arrays from API responses.
function getRecords(data, keys = []) {
    if (Array.isArray(data)) {
        return data;
    }

    for (const key of keys) {
        if (Array.isArray(data?.[key])) {
            return data[key];
        }

        if (Array.isArray(data?.data?.[key])) {
            return data.data[key];
        }
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    return [];
}

// Fetch JSON from the backend.
async function fetchJSON(url, options = {}) {
    const response = await fetch(url, options);

    const contentType =
        response.headers.get("content-type") || "";

    const data = contentType.includes("application/json")
        ? await response.json()
        : null;

    if (!response.ok) {
        throw new Error(
            data?.message ||
            `Request failed with status ${response.status}`
        );
    }

    if (!data) {
        throw new Error("The server did not return valid JSON.");
    }

    return data;
}

// Format date for display.
function formatDate(value) {
    if (!value) {
        return "Date unavailable";
    }

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

// Calculate material file type.
function getFileType(material) {
    const fileName =
        material.fileName ||
        material.fileUrl ||
        "";

    const extension = fileName
        .split("?")[0]
        .split(".")
        .pop()
        ?.toUpperCase();

    return ["PDF", "DOC", "DOCX", "PPT", "PPTX"].includes(
        extension
    )
        ? extension
        : "FILE";
}

// Return a material's actual file URL.
function getMaterialUrl(material) {
    if (!material.fileUrl) {
        return "";
    }

    if (
        material.fileUrl.startsWith("http://") ||
        material.fileUrl.startsWith("https://")
    ) {
        return material.fileUrl;
    }

    return `http://localhost:5000${material.fileUrl.startsWith("/") ? "" : "/"
        }${material.fileUrl}`;
}

// Get the date associated with an event.
function getEventDate(event) {
    return (
        event.eventDate ||
        event.startDate ||
        event.startDateTime ||
        event.startAt ||
        event.datetime ||
        event.date ||
        null
    );
}

// Return today's date at midnight.
function getTodayStart() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

// Return upcoming events only.
function getUpcomingEvents(records) {
    const today = getTodayStart();

    return records
        .filter((event) => {
            const dateValue = getEventDate(event);

            if (!dateValue) {
                return false;
            }

            const eventDate = new Date(dateValue);

            if (Number.isNaN(eventDate.getTime())) {
                return false;
            }

            const eventDay = new Date(eventDate);
            eventDay.setHours(0, 0, 0, 0);

            if (eventDay < today) {
                return false;
            }

            const status = String(
                event.status || ""
            ).toLowerCase();

            if (
                status &&
                ![
                    "published",
                    "active",
                    "upcoming",
                    "scheduled",
                ].includes(status)
            ) {
                return false;
            }

            return true;
        })
        .sort(
            (a, b) =>
                new Date(getEventDate(a)) -
                new Date(getEventDate(b))
        );
}

function TeacherDashboard() {
    const { user } = useAuth();

    const teacherName = user?.name || "Teacher";

    const teacherInitial =
        teacherName.charAt(0).toUpperCase() || "T";

    // Read the current login token.
    const token = sessionStorage.getItem("token");

    // ==================================================
    // DASHBOARD DATA
    // ==================================================

    const [materials, setMaterials] = useState([]);
    const [events, setEvents] = useState([]);

    // Total Students card.
    const [totalStudents, setTotalStudents] = useState(0);
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [studentsError, setStudentsError] = useState("");

    // Materials states.
    const [materialsLoading, setMaterialsLoading] = useState(true);
    const [materialsError, setMaterialsError] = useState("");

    // Events states.
    const [eventsLoading, setEventsLoading] = useState(true);
    const [eventsError, setEventsError] = useState("");

    // ==================================================
    // TOP SEARCH BAR
    // ==================================================

    const [searchTerm, setSearchTerm] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);

    const [remoteSearchResults, setRemoteSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    // ==================================================
    // LOAD TOTAL STUDENTS FROM DATABASE
    // ==================================================

    useEffect(() => {
        const controller = new AbortController();

        async function loadStudentCount() {
            try {
                setStudentsLoading(true);
                setStudentsError("");

                if (!token) {
                    throw new Error(
                        "Your login session is missing. Please log in again."
                    );
                }

                const data = await fetchJSON(
                    `${API_BASE}/users/search/students`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        signal: controller.signal,
                    }
                );

                const students = getRecords(data, ["students"]);

                if (controller.signal.aborted) {
                    return;
                }

                // Use the total supplied by the backend when available.
                setTotalStudents(
                    typeof data.total === "number"
                        ? data.total
                        : students.length
                );
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error(
                        "Student count loading error:",
                        error
                    );

                    setStudentsError(
                        error.message ||
                        "Unable to load student count."
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setStudentsLoading(false);
                }
            }
        }

        loadStudentCount();

        return () => controller.abort();
    }, [token]);

    // ==================================================
    // LOAD RECENT UPLOADED MATERIALS
    // ==================================================

    useEffect(() => {
        const controller = new AbortController();

        async function loadMaterials() {
            try {
                setMaterialsLoading(true);
                setMaterialsError("");

                if (!token) {
                    throw new Error(
                        "Your login session is missing. Please log in again."
                    );
                }

                let responseData;

                try {
                    // Try the main materials endpoint first.
                    responseData = await fetchJSON(
                        `${API_BASE}/materials`,
                        {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                            signal: controller.signal,
                        }
                    );
                } catch (error) {
                    if (controller.signal.aborted) {
                        return;
                    }

                    // Fall back to the authenticated teacher's materials.
                    // Do not retry authentication failures.
                    if (
                        error.message.toLowerCase().includes("token") ||
                        error.message.toLowerCase().includes("unauthorized") ||
                        error.message.includes("401") ||
                        error.message.includes("403")
                    ) {
                        throw error;
                    }

                    responseData = await fetchJSON(
                        `${API_BASE}/materials/my`,
                        {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                            signal: controller.signal,
                        }
                    );
                }

                const records = getRecords(
                    responseData,
                    ["materials"]
                );

                records.sort((a, b) => {
                    const dateA = new Date(
                        a.createdAt ||
                        a.uploadedAt ||
                        a.updatedAt ||
                        0
                    ).getTime();

                    const dateB = new Date(
                        b.createdAt ||
                        b.uploadedAt ||
                        b.updatedAt ||
                        0
                    ).getTime();

                    return dateB - dateA;
                });

                if (!controller.signal.aborted) {
                    setMaterials(records);
                }
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error(
                        "Materials loading error:",
                        error
                    );

                    setMaterialsError(
                        error.message ||
                        "Unable to load uploaded materials."
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setMaterialsLoading(false);
                }
            }
        }

        loadMaterials();

        return () => controller.abort();
    }, [token]);

    // ==================================================
    // LOAD ADMIN-CREATED EVENTS
    // ==================================================

    useEffect(() => {
        const controller = new AbortController();

        async function loadEvents() {
            try {
                setEventsLoading(true);
                setEventsError("");

                if (!token) {
                    throw new Error(
                        "Your login session is missing. Please log in again."
                    );
                }

                const responseData = await fetchJSON(
                    `${API_BASE}/events`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        signal: controller.signal,
                    }
                );

                const eventRecords = getRecords(
                    responseData,
                    ["events"]
                );

                const upcoming = getUpcomingEvents(
                    eventRecords
                );

                if (!controller.signal.aborted) {
                    setEvents(upcoming);
                }
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error(
                        "Events loading error:",
                        error
                    );

                    setEventsError(
                        error.message ||
                        "Unable to load college events."
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setEventsLoading(false);
                }
            }
        }

        loadEvents();

        return () => controller.abort();
    }, [token]);

    // ==================================================
    // TOP SEARCH: STUDENTS AND FACULTY
    // ==================================================

    useEffect(() => {
        const query = searchTerm.trim();

        if (query.length < 2) {
            setRemoteSearchResults([]);
            setSearchLoading(false);
            return;
        }

        const controller = new AbortController();

        const timeoutId = setTimeout(async () => {
            setSearchLoading(true);

            try {
                if (!token) {
                    setRemoteSearchResults([]);
                    return;
                }

                const headers = {
                    Authorization: `Bearer ${token}`,
                };

                const [studentResult, facultyResult] =
                    await Promise.allSettled([
                        fetchJSON(
                            `${API_BASE}/users/search/students?search=${encodeURIComponent(
                                query
                            )}`,
                            {
                                headers,
                                signal: controller.signal,
                            }
                        ),

                        fetchJSON(
                            `${API_BASE}/faculty?search=${encodeURIComponent(
                                query
                            )}`,
                            {
                                headers,
                                signal: controller.signal,
                            }
                        ),
                    ]);

                if (controller.signal.aborted) {
                    return;
                }

                const results = [];

                // Student results.
                if (studentResult.status === "fulfilled") {
                    const students = getRecords(
                        studentResult.value,
                        ["students"]
                    );

                    students.forEach((student) => {
                        results.push({
                            id: `student-${student._id || student.email || student.crn}`,
                            type: "Student",
                            title:
                                student.name ||
                                "Unnamed Student",
                            detail: student.crn
                                ? `CRN: ${student.crn}`
                                : student.email || "Student",
                            url: "/teacher/search-students",
                        });
                    });
                }

                // Faculty results.
                if (facultyResult.status === "fulfilled") {
                    const faculty = getRecords(
                        facultyResult.value,
                        ["faculty"]
                    );

                    faculty.forEach((teacher) => {
                        results.push({
                            id: `faculty-${teacher._id || teacher.email}`,
                            type: "Faculty",
                            title:
                                teacher.name ||
                                "Unnamed Faculty",
                            detail:
                                teacher.department ||
                                teacher.email ||
                                "Faculty member",
                            url: "/teacher/faculty",
                        });
                    });
                }

                setRemoteSearchResults(results);
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("Global search error:", error);
                    setRemoteSearchResults([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setSearchLoading(false);
                }
            }
        }, 300);

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [searchTerm, token]);

    // ==================================================
    // SEARCH LOCAL MATERIALS AND EVENTS
    // ==================================================

    const localSearchResults = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        if (query.length < 2) {
            return [];
        }

        const matchingMaterials = materials
            .filter((material) =>
                [
                    material.title,
                    material.subject,
                    material.description,
                    material.fileName,
                ].some((value) =>
                    String(value || "")
                        .toLowerCase()
                        .includes(query)
                )
            )
            .slice(0, 5)
            .map((material) => ({
                id: `material-${material._id || material.title}`,
                type: "Material",
                title:
                    material.title ||
                    material.fileName ||
                    "Study Material",
                detail: material.subject || "Study material",
                url: "/teacher/materials",
            }));

        const matchingEvents = events
            .filter((event) =>
                [
                    event.title,
                    event.description,
                    event.location,
                    event.venue,
                    event.category,
                ].some((value) =>
                    String(value || "")
                        .toLowerCase()
                        .includes(query)
                )
            )
            .slice(0, 3)
            .map((event) => ({
                id: `event-${event._id || event.title}`,
                type: "Event",
                title: event.title || "College Event",
                detail: formatDate(getEventDate(event)),
                url: "/teacher/events",
            }));

        return [
            ...matchingMaterials,
            ...matchingEvents,
        ];
    }, [searchTerm, materials, events]);

    const searchResults = useMemo(
        () => [
            ...localSearchResults,
            ...remoteSearchResults,
        ],
        [localSearchResults, remoteSearchResults]
    );

    const handleSearchResultClick = (result) => {
        window.location.href = result.url;
    };

    // Show the four most recently uploaded materials.
    const recentMaterials = materials.slice(0, 4);

    // ==================================================
    // DASHBOARD STATISTICS
    // ==================================================

    const stats = [
        {
            title: "Uploaded Materials",
            value: materialsLoading
                ? "..."
                : materials.length,
            subtitle: "Loaded from database",
            icon: "📚",
            color: "blue",
        },
        {
            title: "Total Students",
            value: studentsLoading
                ? "..."
                : studentsError
                    ? "—"
                    : totalStudents,
            subtitle: studentsError
                ? "Unable to load student count"
                : "Registered students",
            icon: "👨‍🎓",
            color: "green",
        },
        {
            title: "Upcoming Events",
            value: eventsLoading
                ? "..."
                : events.length,
            subtitle: "Admin-created events",
            icon: "📅",
            color: "purple",
        },
        {
            title: "Faculty Directory",
            value: "View",
            subtitle: "Browse faculty members",
            icon: "👨‍🏫",
            color: "orange",
        },
    ];

    // ==================================================
    // RENDER DASHBOARD
    // ==================================================

    return (
        <TeacherLayout>
            <div className="teacher-dashboard">

                {/* TOP NAVIGATION */}
                <header className="teacher-topbar">
                    <div
                        className="teacher-search"
                        style={{
                            position: "relative",
                        }}
                    >
                        <span aria-hidden="true">⌕</span>

                        <input
                            type="search"
                            placeholder="Search students, materials, faculty..."
                            value={searchTerm}
                            onChange={(event) => {
                                setSearchTerm(event.target.value);
                                setSearchFocused(true);
                            }}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => {
                                setTimeout(
                                    () => setSearchFocused(false),
                                    150
                                );
                            }}
                            onKeyDown={(event) => {
                                if (
                                    event.key === "Enter" &&
                                    searchResults.length > 0
                                ) {
                                    handleSearchResultClick(
                                        searchResults[0]
                                    );
                                }

                                if (event.key === "Escape") {
                                    setSearchFocused(false);
                                }
                            }}
                            aria-label="Search students, materials, faculty and events"
                            autoComplete="off"
                        />

                        {searchFocused &&
                            searchTerm.trim().length >= 2 && (
                                <div
                                    className="teacher-global-search-results"
                                    role="listbox"
                                >
                                    {searchLoading && (
                                        <p className="teacher-global-search-message">
                                            Searching...
                                        </p>
                                    )}

                                    {!searchLoading &&
                                        searchResults.length === 0 && (
                                            <p className="teacher-global-search-message">
                                                No matching results found.
                                            </p>
                                        )}

                                    {searchResults.map((result) => (
                                        <button
                                            type="button"
                                            className="teacher-global-search-result"
                                            key={result.id}
                                            onMouseDown={(event) =>
                                                event.preventDefault()
                                            }
                                            onClick={() =>
                                                handleSearchResultClick(
                                                    result
                                                )
                                            }
                                        >
                                            <span className="teacher-search-result-icon">
                                                {result.type === "Student"
                                                    ? "🎓"
                                                    : result.type === "Faculty"
                                                        ? "👨‍🏫"
                                                        : result.type === "Material"
                                                            ? "📚"
                                                            : "📅"}
                                            </span>

                                            <span className="teacher-search-result-text">
                                                <strong>
                                                    {result.title}
                                                </strong>

                                                <small>
                                                    {result.type} · {result.detail}
                                                </small>
                                            </span>

                                            <span className="teacher-search-result-arrow">
                                                →
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                    </div>

                    <div className="teacher-topbar-right">
                        <button
                            type="button"
                            className="notification-button"
                            aria-label="Notifications"
                            onClick={() => {
                                window.location.href =
                                    "/teacher/notifications";
                            }}
                        >
                            🔔
                        </button>

                        <div className="teacher-profile-avatar">
                            {teacherInitial}
                        </div>

                        <div className="teacher-profile-details">
                            <strong>{teacherName}</strong>
                            <small>Teacher</small>
                        </div>
                    </div>
                </header>

                {/* WELCOME */}
                <section className="teacher-welcome">
                    <div>
                        <h1>Welcome, {teacherName}! 👋</h1>

                        <p>
                            Here's an overview of your academic activities.
                        </p>
                    </div>
                </section>

                {/* STATISTICS */}
                <section className="teacher-stats-grid">
                    {stats.map((stat) => (
                        <article
                            className={`teacher-stat-card ${stat.color}`}
                            key={stat.title}
                        >
                            <div className="teacher-stat-icon">
                                {stat.icon}
                            </div>

                            <div>
                                <p>{stat.title}</p>
                                <h2>{stat.value}</h2>
                                <small>{stat.subtitle}</small>
                            </div>
                        </article>
                    ))}
                </section>

                {/* MAIN CONTENT */}
                <section className="teacher-content-grid">

                    {/* RECENT UPLOADED MATERIALS */}
                    <article className="dashboard-panel teacher-materials-panel">
                        <div className="panel-heading">
                            <h2>📚 Recent Uploaded Materials</h2>

                            <button
                                type="button"
                                onClick={() => {
                                    window.location.href =
                                        "/teacher/materials";
                                }}
                            >
                                View All →
                            </button>
                        </div>

                        {materialsError && (
                            <div
                                role="alert"
                                className="teacher-dashboard-error"
                            >
                                {materialsError}
                            </div>
                        )}

                        <div className="teacher-table-wrapper">
                            <table className="teacher-materials-table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Subject</th>
                                        <th>Type</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {materialsLoading ? (
                                        <tr>
                                            <td colSpan="5">
                                                Loading uploaded materials...
                                            </td>
                                        </tr>
                                    ) : materialsError ? (
                                        <tr>
                                            <td colSpan="5">
                                                Unable to load materials.
                                            </td>
                                        </tr>
                                    ) : recentMaterials.length === 0 ? (
                                        <tr>
                                            <td colSpan="5">
                                                No uploaded materials found in the database.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentMaterials.map(
                                            (material, index) => {
                                                const fileType =
                                                    getFileType(material);

                                                const fileUrl =
                                                    getMaterialUrl(material);

                                                return (
                                                    <tr
                                                        key={
                                                            material._id ||
                                                            material.title ||
                                                            index
                                                        }
                                                    >
                                                        <td>
                                                            {material.title ||
                                                                material.fileName ||
                                                                "Untitled Material"}
                                                        </td>

                                                        <td>
                                                            {material.subject ||
                                                                material.course ||
                                                                "—"}
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`file-badge ${fileType.toLowerCase()}`}
                                                            >
                                                                {fileType}
                                                            </span>
                                                        </td>

                                                        <td>
                                                            {formatDate(
                                                                material.createdAt ||
                                                                material.uploadedAt ||
                                                                material.updatedAt
                                                            )}
                                                        </td>

                                                        <td>
                                                            {fileUrl ? (
                                                                <a
                                                                    className="table-action"
                                                                    href={fileUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    title="Open or download material"
                                                                >
                                                                    ↗
                                                                </a>
                                                            ) : (
                                                                <span>—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </article>

                    {/* STUDENT SEARCH WIDGET */}
                    <article className="dashboard-panel teacher-student-search-panel">
                        <StudentSearch />
                    </article>

                    {/* UPCOMING EVENTS */}
                    <article className="dashboard-panel teacher-events-panel">
                        <div className="panel-heading">
                            <h2>📅 Upcoming Events</h2>

                            <button
                                type="button"
                                onClick={() => {
                                    window.location.href =
                                        "/teacher/events";
                                }}
                            >
                                View All →
                            </button>
                        </div>

                        {eventsError && (
                            <div
                                role="alert"
                                className="teacher-dashboard-error"
                            >
                                {eventsError}
                            </div>
                        )}

                        {eventsLoading ? (
                            <p>Loading college events...</p>
                        ) : eventsError ? (
                            <p>Unable to load events.</p>
                        ) : events.length === 0 ? (
                            <p>
                                No upcoming events have been found in the database.
                            </p>
                        ) : (
                            events.slice(0, 4).map((event, index) => {
                                const date = new Date(
                                    getEventDate(event)
                                );

                                const day = date.toLocaleDateString(
                                    "en-IN",
                                    { day: "2-digit" }
                                );

                                const month = date
                                    .toLocaleDateString("en-IN", {
                                        month: "short",
                                    })
                                    .toUpperCase();

                                const time =
                                    event.time ||
                                    event.startTime ||
                                    event.eventTime ||
                                    "Time not specified";

                                const location =
                                    event.location ||
                                    event.venue ||
                                    event.place ||
                                    "Location not specified";

                                return (
                                    <div
                                        className="teacher-event-item"
                                        key={
                                            event._id ||
                                            event.id ||
                                            index
                                        }
                                    >
                                        <div className="event-date-box">
                                            <strong>{day}</strong>
                                            <span>{month}</span>
                                        </div>

                                        <div className="teacher-event-details">
                                            <h3>
                                                {event.title ||
                                                    "College Event"}
                                            </h3>

                                            <p>◷ {time}</p>
                                            <p>📍 {location}</p>

                                            {event.category && (
                                                <small>
                                                    {event.category}
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </article>

                    {/* QUICK ACTIONS AND LINKS */}
                    <aside className="teacher-side-panels">

                        <article className="dashboard-panel teacher-quick-actions">
                            <div className="panel-heading">
                                <h2>⚡ Quick Actions</h2>
                            </div>

                            <button
                                type="button"
                                className="teacher-action-primary"
                                onClick={() => {
                                    window.location.href =
                                        "/teacher/upload-material";
                                }}
                            >
                                ＋ Upload Study Material
                            </button>

                            <button
                                type="button"
                                className="teacher-action-secondary"
                                onClick={() => {
                                    window.location.href =
                                        "/teacher/search-students";
                                }}
                            >
                                🔍 Search Students (Name / CRN)
                            </button>

                            <button
                                type="button"
                                className="teacher-action-secondary"
                                onClick={() => {
                                    window.location.href =
                                        "/teacher/materials";
                                }}
                            >
                                📚 View My Materials
                            </button>

                            <button
                                type="button"
                                className="teacher-action-secondary"
                                onClick={() => {
                                    window.location.href =
                                        "/teacher/notices";
                                }}
                            >
                                📅 View Notices & Events
                            </button>
                        </article>

                        <article className="dashboard-panel teacher-quick-links">
                            <div className="panel-heading">
                                <h2>🔗 Quick Links</h2>
                            </div>

                            <p>👨‍🏫 Faculty Directory</p>
                            <p>📢 College Notices</p>
                            <p>📅 College Events</p>
                            <p>📍 Campus Map</p>
                            <p>💬 Help & Support</p>
                        </article>

                    </aside>
                </section>
            </div>

            {/* TOP SEARCH DROPDOWN STYLES */}
            <style>{`
                .teacher-global-search-results {
                    position: absolute;
                    top: calc(100% + 10px);
                    left: 0;
                    width: min(430px, 85vw);
                    max-height: 360px;
                    overflow-y: auto;
                    z-index: 2000;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    box-shadow: 0 14px 35px rgba(15, 23, 42, 0.14);
                }

                .teacher-global-search-message {
                    padding: 18px;
                    margin: 0;
                    color: #64748b;
                    font-size: 13px;
                }

                .teacher-global-search-result {
                    display: flex;
                    width: 100%;
                    align-items: center;
                    gap: 12px;
                    padding: 13px 15px;
                    text-align: left;
                    background: #ffffff;
                    color: #172033;
                    border: 0;
                    border-bottom: 1px solid #f1f5f9;
                    cursor: pointer;
                }

                .teacher-global-search-result:hover {
                    background: #f8fafc;
                }

                .teacher-search-result-icon {
                    display: grid;
                    place-items: center;
                    flex-shrink: 0;
                    width: 38px;
                    height: 38px;
                    border-radius: 10px;
                    background: #eef2ff;
                    font-size: 18px;
                }

                .teacher-search-result-text {
                    display: flex;
                    flex: 1;
                    min-width: 0;
                    flex-direction: column;
                    gap: 4px;
                }

                .teacher-search-result-text strong {
                    overflow-wrap: anywhere;
                    font-size: 13px;
                }

                .teacher-search-result-text small {
                    color: #64748b;
                    font-size: 11px;
                }

                .teacher-search-result-arrow {
                    color: #6366f1;
                    font-size: 18px;
                }

                .teacher-dashboard-error {
                    margin: 12px 0;
                    padding: 12px;
                    border: 1px solid #fecaca;
                    border-radius: 8px;
                    background: #fef2f2;
                    color: #991b1b;
                    font-size: 13px;
                }
            `}</style>
        </TeacherLayout>
    );
}

export default TeacherDashboard;