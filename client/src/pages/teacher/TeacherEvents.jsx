import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/events";

function TeacherEvents() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const token = sessionStorage.getItem("token");

                if (!token) {
                    throw new Error("Please log in again.");
                }

                const response = await fetch(API_URL, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load events."
                    );
                }

                setEvents(data.events || []);
            } catch (err) {
                console.error("Teacher events error:", err);
                setError(err.message || "Unable to load events.");
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const formatDate = (value) => {
        if (!value) return "Date not available";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Date not available";
        }

        return date.toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <main className="page-container">
            <section className="student-events-page">
                <header className="student-events-hero">
                    <div className="student-events-hero-content">
                        <span className="student-events-eyebrow">
                            SMART CAMPUS · FACULTY
                        </span>

                        <h1>
                            College <span>Events</span>
                        </h1>

                        <p>
                            View upcoming college events, workshops,
                            seminars and academic activities.
                        </p>
                    </div>
                </header>

                <div className="student-events-section-heading">
                    <h2>Published Events</h2>
                    <p>Stay informed about campus activities.</p>
                </div>

                {loading ? (
                    <div className="student-events-empty">
                        <p>Loading events...</p>
                    </div>
                ) : error ? (
                    <div className="student-events-empty">
                        <h3>Unable to Load Events</h3>
                        <p>{error}</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="student-events-empty">
                        <span className="student-events-empty-icon">
                            📅
                        </span>

                        <h3>No Published Events</h3>

                        <p>
                            Published college events will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="student-events-grid">
                        {events.map((event) => (
                            <article
                                className="student-event-card"
                                key={event._id}
                            >
                                <div className="student-event-card-top">
                                    <div className="student-event-icon">
                                        📅
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
                                            <span>🕒</span>
                                            <p>
                                                <strong>Date & Time</strong>
                                                <span>
                                                    {formatDate(event.eventDate)}
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
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );


}

export default TeacherEvents;
