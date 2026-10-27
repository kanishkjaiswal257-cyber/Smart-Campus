import { useCallback, useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/events";

const INITIAL_FORM = {
    title: "",
    description: "",
    category: "Academic",
    location: "",
    eventDate: "",
    registrationDeadline: "",
    maxAttendees: "",
    status: "Published",
};

// Convert date to the local format required by datetime-local input.
function toLocalDateTime(value) {
    if (!value) return "";


    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const offset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - offset)
        .toISOString()
        .slice(0, 16);


}

// Format date and time.
function formatDate(value) {
    if (!value) return "Not specified";


    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });


}

// Safely read JSON responses from the backend.
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

function ManageEvents() {
    const [events, setEvents] = useState([]);
    const [form, setForm] = useState(INITIAL_FORM);
    const [editingId, setEditingId] = useState(null);


    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState("");

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const getToken = () => sessionStorage.getItem("token");

    // Load all events from the backend.
    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const token = getToken();

            if (!token) {
                throw new Error(
                    "Login session not found. Please log in again."
                );
            }

            const response = await fetch(`${API_URL}/all`, {
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
            console.error("Fetch events error:", err);
            setError(err.message || "Unable to load events.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Handle form input changes.
    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // Reset the form.
    const resetForm = () => {
        setForm({ ...INITIAL_FORM });
        setEditingId(null);
    };

    // Load an existing event into the form.
    const handleEdit = (event) => {
        setEditingId(event._id);

        setForm({
            title: event.title || "",
            description: event.description || "",
            category: event.category || "General",
            location: event.location || "",
            eventDate: toLocalDateTime(event.eventDate),
            registrationDeadline: toLocalDateTime(
                event.registrationDeadline
            ),
            maxAttendees:
                event.maxAttendees == null
                    ? ""
                    : String(event.maxAttendees),
            status: event.status || "Published",
        });

        setError("");
        setMessage("");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // Create a new event or update an existing event.
    const handleSubmit = async (event) => {
        event.preventDefault();

        setSaving(true);
        setError("");
        setMessage("");

        try {
            const token = getToken();

            if (!token) {
                throw new Error("Please log in again.");
            }

            if (!form.eventDate) {
                throw new Error(
                    "Please select the event date and time."
                );
            }

            const parsedEventDate = new Date(form.eventDate);

            if (Number.isNaN(parsedEventDate.getTime())) {
                throw new Error("Please enter a valid event date.");
            }

            let parsedDeadline = null;

            if (form.registrationDeadline) {
                parsedDeadline = new Date(
                    form.registrationDeadline
                );

                if (Number.isNaN(parsedDeadline.getTime())) {
                    throw new Error(
                        "Please enter a valid registration deadline."
                    );
                }

                if (parsedDeadline > parsedEventDate) {
                    throw new Error(
                        "Registration deadline cannot be after the event date."
                    );
                }
            }

            let maxAttendees = null;

            if (form.maxAttendees !== "") {
                maxAttendees = Number(form.maxAttendees);

                if (
                    !Number.isInteger(maxAttendees) ||
                    maxAttendees < 1
                ) {
                    throw new Error(
                        "Maximum attendees must be a positive whole number."
                    );
                }
            }

            const payload = {
                title: form.title.trim(),
                description: form.description.trim(),
                category: form.category,
                location: form.location.trim(),
                eventDate: parsedEventDate.toISOString(),
                registrationDeadline: parsedDeadline
                    ? parsedDeadline.toISOString()
                    : null,
                maxAttendees,
                status: form.status,
            };

            const isEditing = Boolean(editingId);

            const response = await fetch(
                isEditing
                    ? `${API_URL}/${editingId}`
                    : API_URL,
                {
                    method: isEditing ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await readApiResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    (isEditing
                        ? "Unable to update event."
                        : "Unable to create event.")
                );
            }

            setMessage(
                data.message ||
                (isEditing
                    ? "Event updated successfully."
                    : "Event created successfully.")
            );

            resetForm();

            await fetchEvents();
        } catch (err) {
            console.error("Save event error:", err);
            setError(err.message || "Unable to save event.");
        } finally {
            setSaving(false);
        }
    };

    // Delete an event.
    const handleDelete = async (eventId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this event? This action cannot be undone."
        );

        if (!confirmed) return;

        try {
            setDeletingId(eventId);
            setError("");
            setMessage("");

            const token = getToken();

            if (!token) {
                throw new Error("Please log in again.");
            }

            const response = await fetch(`${API_URL}/${eventId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await readApiResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to delete event."
                );
            }

            setEvents((previous) =>
                previous.filter((item) => item._id !== eventId)
            );

            if (editingId === eventId) {
                resetForm();
            }

            setMessage(
                data.message || "Event deleted successfully."
            );
        } catch (err) {
            console.error("Delete event error:", err);
            setError(err.message || "Unable to delete event.");
        } finally {
            setDeletingId("");
        }
    };

    const publishedCount = events.filter(
        (event) => event.status === "Published"
    ).length;

    const upcomingCount = events.filter(
        (event) =>
            event.status === "Published" &&
            new Date(event.eventDate) > new Date()
    ).length;

    const registrationCount = events.reduce(
        (total, event) =>
            total + (event.registrationCount || 0),
        0
    );

    return (
        <main className="page-container">
            <section className="admin-events-page">

                {/* PAGE HEADER */}
                <header className="admin-events-header">
                    <div>
                        <span className="admin-events-eyebrow">
                            SMART CAMPUS · ADMIN PANEL
                        </span>

                        <h1>Events Management</h1>

                        <p>
                            Create events, manage announcements and
                            track student registrations.
                        </p>
                    </div>

                    <div className="admin-events-header-icon">
                        📅
                    </div>
                </header>

                {/* EVENT STATISTICS */}
                <div className="admin-event-stats">
                    <article className="admin-event-stat">
                        <span className="admin-event-stat-icon">
                            🗓️
                        </span>

                        <div>
                            <p>Total Events</p>
                            <strong>{events.length}</strong>
                        </div>
                    </article>

                    <article className="admin-event-stat">
                        <span className="admin-event-stat-icon">
                            ✅
                        </span>

                        <div>
                            <p>Published</p>
                            <strong>{publishedCount}</strong>
                        </div>
                    </article>

                    <article className="admin-event-stat">
                        <span className="admin-event-stat-icon">
                            ⏳
                        </span>

                        <div>
                            <p>Upcoming</p>
                            <strong>{upcomingCount}</strong>
                        </div>
                    </article>

                    <article className="admin-event-stat">
                        <span className="admin-event-stat-icon">
                            👥
                        </span>

                        <div>
                            <p>Registrations</p>
                            <strong>{registrationCount}</strong>
                        </div>
                    </article>
                </div>

                {/* ERROR AND SUCCESS MESSAGES */}
                {error && (
                    <div className="admin-event-alert admin-event-alert-error">
                        ⚠️ {error}
                    </div>
                )}

                {message && (
                    <div className="admin-event-alert admin-event-alert-success">
                        ✅ {message}
                    </div>
                )}

                {/* CREATE OR EDIT EVENT FORM */}
                <section className="admin-event-form-card">
                    <div className="admin-event-section-heading">
                        <div>
                            <h2>
                                {editingId
                                    ? "Edit Event"
                                    : "Create New Event"}
                            </h2>

                            <p>
                                {editingId
                                    ? "Update the event details below."
                                    : "Fill in the details to add a campus event."}
                            </p>
                        </div>

                        {editingId && (
                            <button
                                type="button"
                                className="admin-event-cancel-edit"
                                onClick={() => {
                                    resetForm();
                                    setError("");
                                    setMessage("");
                                }}
                                disabled={saving}
                            >
                                Cancel Editing
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="admin-event-form-grid">

                            <div className="admin-event-field admin-event-full">
                                <label htmlFor="event-title">
                                    Event Title *
                                </label>

                                <input
                                    id="event-title"
                                    name="title"
                                    type="text"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="e.g. Annual Tech Fest"
                                    maxLength={150}
                                    required
                                />
                            </div>

                            <div className="admin-event-field">
                                <label htmlFor="event-category">
                                    Category *
                                </label>

                                <select
                                    id="event-category"
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Academic">Academic</option>
                                    <option value="Cultural">Cultural</option>
                                    <option value="Sports">Sports</option>
                                    <option value="Workshop">Workshop</option>
                                    <option value="Seminar">Seminar</option>
                                    <option value="General">General</option>
                                </select>
                            </div>

                            <div className="admin-event-field">
                                <label htmlFor="event-status">
                                    Status *
                                </label>

                                <select
                                    id="event-status"
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Draft">Draft</option>
                                    <option value="Published">Published</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div className="admin-event-field admin-event-full">
                                <label htmlFor="event-description">
                                    Description *
                                </label>

                                <textarea
                                    id="event-description"
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="Describe the event..."
                                    maxLength={3000}
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="admin-event-field admin-event-full">
                                <label htmlFor="event-location">
                                    Location *
                                </label>

                                <input
                                    id="event-location"
                                    name="location"
                                    type="text"
                                    value={form.location}
                                    onChange={handleChange}
                                    placeholder="e.g. Main Auditorium"
                                    maxLength={200}
                                    required
                                />
                            </div>

                            <div className="admin-event-field">
                                <label htmlFor="event-date">
                                    Event Date & Time *
                                </label>

                                <input
                                    id="event-date"
                                    name="eventDate"
                                    type="datetime-local"
                                    value={form.eventDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="admin-event-field">
                                <label htmlFor="event-deadline">
                                    Registration Deadline
                                </label>

                                <input
                                    id="event-deadline"
                                    name="registrationDeadline"
                                    type="datetime-local"
                                    value={form.registrationDeadline}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="admin-event-field">
                                <label htmlFor="event-max-attendees">
                                    Maximum Attendees
                                </label>

                                <input
                                    id="event-max-attendees"
                                    name="maxAttendees"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={form.maxAttendees}
                                    onChange={handleChange}
                                    placeholder="Leave empty for unlimited"
                                />
                            </div>
                        </div>

                        <div className="admin-event-form-actions">
                            <button
                                type="button"
                                className="admin-event-reset-button"
                                onClick={() => {
                                    resetForm();
                                    setError("");
                                    setMessage("");
                                }}
                                disabled={saving}
                            >
                                Clear Form
                            </button>

                            <button
                                type="submit"
                                className="admin-event-submit-button"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                        ? "Save Changes"
                                        : "＋ Create Event"}
                            </button>
                        </div>
                    </form>
                </section>

                {/* EXISTING EVENTS */}
                <section className="admin-event-list-section">
                    <div className="admin-event-section-heading">
                        <div>
                            <h2>All Events</h2>

                            <p>
                                Manage existing events and registrations.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="admin-event-refresh-button"
                            onClick={fetchEvents}
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "↻ Refresh"}
                        </button>
                    </div>

                    {loading ? (
                        <div className="admin-event-empty">
                            Loading events...
                        </div>
                    ) : events.length === 0 ? (
                        <div className="admin-event-empty">
                            <span>📅</span>

                            <h3>No events yet</h3>

                            <p>
                                Create your first event using the form above.
                            </p>
                        </div>
                    ) : (
                        <div className="admin-event-list">
                            {events.map((event) => (
                                <article
                                    className="admin-event-card"
                                    key={event._id}
                                >
                                    <div className="admin-event-card-main">
                                        <div className="admin-event-card-icon">
                                            {event.category === "Sports"
                                                ? "🏆"
                                                : event.category === "Cultural"
                                                    ? "🎭"
                                                    : event.category === "Workshop"
                                                        ? "🛠️"
                                                        : event.category === "Seminar"
                                                            ? "🎤"
                                                            : event.category === "Academic"
                                                                ? "📚"
                                                                : "📅"}
                                        </div>

                                        <div className="admin-event-card-info">
                                            <div className="admin-event-card-title-row">
                                                <h3>{event.title}</h3>

                                                <span
                                                    className={`admin-event-status status-${(
                                                        event.status || "Draft"
                                                    ).toLowerCase()}`}
                                                >
                                                    {event.status}
                                                </span>
                                            </div>

                                            <p className="admin-event-card-description">
                                                {event.description}
                                            </p>

                                            <div className="admin-event-card-meta">
                                                <span>
                                                    📍 {event.location}
                                                </span>

                                                <span>
                                                    🕒 {formatDate(event.eventDate)}
                                                </span>

                                                <span>
                                                    👥 {event.registrationCount || 0}
                                                    {event.maxAttendees
                                                        ? ` / ${event.maxAttendees}`
                                                        : ""}{" "}
                                                    registrations
                                                </span>

                                                <span>
                                                    🏷️ {event.category}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="admin-event-card-actions">
                                        <button
                                            type="button"
                                            className="admin-event-edit-button"
                                            onClick={() => handleEdit(event)}
                                            disabled={deletingId !== ""}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            className="admin-event-delete-button"
                                            onClick={() =>
                                                handleDelete(event._id)
                                            }
                                            disabled={deletingId !== ""}
                                        >
                                            {deletingId === event._id
                                                ? "Deleting..."
                                                : "Delete"}
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </section>
        </main>
    );


}

export default ManageEvents;
