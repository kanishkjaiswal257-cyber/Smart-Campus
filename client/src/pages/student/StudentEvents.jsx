import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:5000/api/events";

async function readApiResponse(response) {
    const contentType = response.headers.get("content-type") || "";


    if (!contentType.includes("application/json")) {
        const responseText = await response.text();
        console.error("Non-JSON events response:", responseText);

        throw new Error(
            `Invalid server response. HTTP status: ${response.status}.`
        );
    }

    return response.json();


}

function formatEventDate(value) {
    if (!value) return "Date not available";


    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Invalid date";
    }

    return date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
    });


}

function formatEventTime(value) {
    if (!value) return "";


    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });


}

function StudentEvents() {
    const [events, setEvents] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [eventFilter, setEventFilter] = useState("Upcoming");


    const [loading, setLoading] = useState(true);
    const [busyEventId, setBusyEventId] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const getToken = () => sessionStorage.getItem("token");

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const token = getToken();

            if (!token) {
                throw new Error("Please log in to view campus events.");
            }

            const response = await fetch(API_URL, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await readApiResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load events."
                );
            }

            setEvents(data.events || []);
        } catch (err) {
            console.error("Fetch student events error:", err);
            setError(err.message || "Unable to load events.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const filteredEvents = useMemo(() => {
        const now = new Date();

        return events.filter((event) => {
            const matchesSearch = [
                event.title,
                event.description,
                event.location,
                event.category,
            ]
                .filter(Boolean)
                .some((value) =>
                    value.toLowerCase().includes(search.trim().toLowerCase())
                );

            const matchesCategory =
                category === "All" || event.category === category;

            const eventDate = new Date(event.eventDate);

            const isUpcoming =
                !Number.isNaN(eventDate.getTime()) && eventDate > now;

            const matchesDate =
                eventFilter === "All"
                    ? true
                    : eventFilter === "Upcoming"
                        ? isUpcoming
                        : !isUpcoming;

            return matchesSearch && matchesCategory && matchesDate;
        });
    }, [events, search, category, eventFilter]);

    const handleRegistration = async (event) => {
        const isRegistered = Boolean(event.isRegistered);

        const confirmed = window.confirm(
            isRegistered
                ? `Cancel your registration for "${event.title}"?`
                : `Register for "${event.title}"?`
        );

        if (!confirmed) return;

        try {
            setBusyEventId(event._id);
            setError("");
            setMessage("");

            const token = getToken();

            if (!token) {
                throw new Error("Your login session has expired. Please log in again.");
            }

            const response = await fetch(
                `${API_URL}/${event._id}/register`,
                {
                    method: isRegistered ? "DELETE" : "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await readApiResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to update event registration."
                );
            }

            setMessage(
                data.message ||
                (isRegistered
                    ? "Registration cancelled."
                    : "Registration successful.")
            );

            await fetchEvents();
        } catch (err) {
            console.error("Event registration error:", err);
            setError(err.message || "Unable to update registration.");
        } finally {
            setBusyEventId("");
        }
    };

    const getEventIcon = (eventCategory) => {
        switch (eventCategory) {
            case "Academic":
                return "📚";
            case "Cultural":
                return "🎭";
            case "Sports":
                return "🏆";
            case "Workshop":
                return "🛠️";
            case "Seminar":
                return "🎤";
            default:
                return "📅";
        }
    };

    const categories = [
        "All",
        "Academic",
        "Cultural",
        "Sports",
        "Workshop",
        "Seminar",
        "General",
    ];

    return (
        <main className="page-container">
            <section className="student-events-page">
                <header className="student-events-hero">
                    <div className="student-events-hero-content">
                        <span className="student-events-eyebrow">
                            SMART CAMPUS
                        </span>

                        <h1>
                            Campus <span>Events</span>
                        </h1>

                        <p>
                            Discover upcoming activities, workshops,
                            seminars and exciting opportunities at your
                            campus.
                        </p>

                        <div className="student-events-hero-stats">
                            <div>
                                <strong>{events.length}</strong>
                                <span>Published Events</span>
                            </div>

                            <div>
                                <strong>
                                    {
                                        events.filter(
                                            (event) => event.isRegistered
                                        ).length
                                    }
                                </strong>
                                <span>My Registrations</span>
                            </div>
                        </div>
                    </div>

                    <div className="student-events-hero-art">
                        <span>📅</span>
                        <span>🎓</span>
                        <span>✨</span>
                    </div>
                </header>

                {error && (
                    <div className="student-events-alert student-events-alert-error">
                        <span>⚠️</span>
                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={fetchEvents}
                            disabled={loading}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {message && (
                    <div className="student-events-alert student-events-alert-success">
                        ✅ {message}
                    </div>
                )}

                <section className="student-events-toolbar">
                    <div className="student-events-section-heading">
                        <h2>Explore Events</h2>
                        <p>Find an event that interests you.</p>
                    </div>

                    <div className="student-events-search">
                        <span>🔎</span>

                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search events or locations..."
                            aria-label="Search events"
                        />
                    </div>

                    <div className="student-events-filters">
                        <label htmlFor="event-category-filter">
                            Category
                        </label>

                        <select
                            id="event-category-filter"
                            value={category}
                            onChange={(event) =>
                                setCategory(event.target.value)
                            }
                        >
                            {categories.map((item) => (
                                <option key={item} value={item}>
                                    {item === "All"
                                        ? "All Categories"
                                        : item}
                                </option>
                            ))}
                        </select>

                        <label htmlFor="event-date-filter">
                            Show
                        </label>

                        <select
                            id="event-date-filter"
                            value={eventFilter}
                            onChange={(event) =>
                                setEventFilter(event.target.value)
                            }
                        >
                            <option value="Upcoming">Upcoming Events</option>
                            <option value="Past">Past Events</option>
                            <option value="All">All Events</option>
                        </select>

                        <button
                            type="button"
                            className="student-events-refresh"
                            onClick={fetchEvents}
                            disabled={loading || busyEventId !== ""}
                        >
                            ↻ Refresh
                        </button>
                    </div>
                </section>

                {loading ? (
                    <div className="student-events-empty">
                        <div className="student-events-loader" />
                        <h3>Loading campus events...</h3>
                        <p>Please wait while we fetch the latest events.</p>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="student-events-empty">
                        <span className="student-events-empty-icon">
                            📅
                        </span>

                        <h3>No Events Found</h3>

                        <p>
                            There are no events matching your current
                            search and filters.
                        </p>

                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                setCategory("All");
                                setEventFilter("Upcoming");
                            }}
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className="student-events-grid">
                        {filteredEvents.map((event) => {
                            const eventDate = new Date(event.eventDate);
                            const isUpcoming =
                                !Number.isNaN(eventDate.getTime()) &&
                                eventDate > new Date();

                            const deadlinePassed =
                                event.registrationDeadline &&
                                new Date(event.registrationDeadline) <=
                                new Date();

                            const eventFull =
                                event.maxAttendees != null &&
                                event.registrationCount >= event.maxAttendees;

                            const canRegister =
                                isUpcoming &&
                                !deadlinePassed &&
                                !eventFull;

                            const isBusy = busyEventId === event._id;

                            return (
                                <article
                                    className="student-event-card"
                                    key={event._id}
                                >
                                    <div className="student-event-card-top">
                                        <div className="student-event-icon">
                                            {getEventIcon(event.category)}
                                        </div>

                                        <span className="student-event-category">
                                            {event.category || "General"}
                                        </span>
                                    </div>

                                    <div className="student-event-card-content">
                                        <h3>{event.title}</h3>

                                        <p className="student-event-description">
                                            {event.description}
                                        </p>

                                        <div className="student-event-info">
                                            <div>
                                                <span>📅</span>
                                                <p>
                                                    <strong>Date</strong>
                                                    <span>
                                                        {formatEventDate(
                                                            event.eventDate
                                                        )}
                                                    </span>
                                                </p>
                                            </div>

                                            <div>
                                                <span>🕒</span>
                                                <p>
                                                    <strong>Time</strong>
                                                    <span>
                                                        {formatEventTime(
                                                            event.eventDate
                                                        ) || "Not specified"}
                                                    </span>
                                                </p>
                                            </div>

                                            <div>
                                                <span>📍</span>
                                                <p>
                                                    <strong>Location</strong>
                                                    <span>{event.location}</span>
                                                </p>
                                            </div>

                                            <div>
                                                <span>👥</span>
                                                <p>
                                                    <strong>Registrations</strong>
                                                    <span>
                                                        {event.registrationCount || 0}
                                                        {event.maxAttendees
                                                            ? ` / ${event.maxAttendees}`
                                                            : ""}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        {event.registrationDeadline && (
                                            <div className="student-event-deadline">
                                                Registration deadline:{" "}
                                                {formatEventDate(
                                                    event.registrationDeadline
                                                )}{" "}
                                                at{" "}
                                                {formatEventTime(
                                                    event.registrationDeadline
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="student-event-card-footer">
                                        {event.isRegistered ? (
                                            <button
                                                type="button"
                                                className="student-event-cancel-button"
                                                onClick={() =>
                                                    handleRegistration(event)
                                                }
                                                disabled={isBusy}
                                            >
                                                {isBusy
                                                    ? "Updating..."
                                                    : "✓ Registered · Cancel"}
                                            </button>
                                        ) : canRegister ? (
                                            <button
                                                type="button"
                                                className="student-event-register-button"
                                                onClick={() =>
                                                    handleRegistration(event)
                                                }
                                                disabled={isBusy || busyEventId !== ""}
                                            >
                                                {isBusy
                                                    ? "Registering..."
                                                    : "Register Now →"}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="student-event-closed-button"
                                                disabled
                                            >
                                                {!isUpcoming
                                                    ? "Event Ended"
                                                    : deadlinePassed
                                                        ? "Registration Closed"
                                                        : eventFull
                                                            ? "Event Full"
                                                            : "Registration Unavailable"}
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {!loading && filteredEvents.length > 0 && (
                    <p className="student-events-results">
                        Showing {filteredEvents.length} event
                        {filteredEvents.length !== 1 ? "s" : ""}
                    </p>
                )}
            </section>
        </main>
    );


}

export default StudentEvents;
