import { useState } from "react";

function SendNotification() {
    const [form, setForm] = useState({
        title: "",
        message: "",
        type: "General",
        recipientRole: "student",
        link: "",
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        setSuccess("");
        setError("");

        try {
            const token = sessionStorage.getItem("token");

            if (!token) {
                throw new Error("Please log in again.");
            }

            const response = await fetch(
                "http://localhost:5000/api/notifications",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(form),
                }
            );

            const contentType =
                response.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {
                throw new Error(
                    "The server returned an invalid response. Check the backend."
                );
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to send notification."
                );
            }

            setSuccess(
                `${data.message} Recipients: ${data.recipientCount}.`
            );

            setForm({
                title: "",
                message: "",
                type: "General",
                recipientRole: "student",
                link: "",
            });
        } catch (err) {
            setError(
                err.message || "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <section className="send-notification-page">
                <div className="send-notification-heading">
                    <span>SMART CAMPUS • ADMIN</span>
                    <h1>Send Notification</h1>
                    <p>
                        Share important updates with students and teachers.
                    </p>
                </div>

                {success && (
                    <div className="send-notification-success">
                        ✅ {success}
                    </div>
                )}

                {error && (
                    <div className="send-notification-error">
                        ⚠️ {error}
                    </div>
                )}

                <form
                    className="send-notification-form"
                    onSubmit={handleSubmit}
                >
                    <div className="send-notification-form-heading">
                        <div className="send-notification-icon">
                            🔔
                        </div>

                        <div>
                            <h2>Notification Details</h2>
                            <p>
                                Complete the details below to send an update.
                            </p>
                        </div>
                    </div>

                    <div className="send-notification-grid">
                        <div className="send-notification-field">
                            <label htmlFor="notification-title">
                                Notification Title *
                            </label>

                            <input
                                id="notification-title"
                                type="text"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="e.g. Important College Announcement"
                                maxLength={150}
                                required
                            />
                        </div>

                        <div className="send-notification-field">
                            <label htmlFor="notification-type">
                                Notification Type *
                            </label>

                            <select
                                id="notification-type"
                                name="type"
                                value={form.type}
                                onChange={handleChange}
                                required
                            >
                                <option value="General">General</option>
                                <option value="Notice">Notice</option>
                                <option value="Event">Event</option>
                                <option value="Academic">Academic</option>
                                <option value="Important">Important</option>
                            </select>
                        </div>

                        <div className="send-notification-field">
                            <label htmlFor="notification-recipient">
                                Send To *
                            </label>

                            <select
                                id="notification-recipient"
                                name="recipientRole"
                                value={form.recipientRole}
                                onChange={handleChange}
                                required
                            >
                                <option value="student">
                                    All Students
                                </option>

                                <option value="teacher">
                                    All Teachers
                                </option>

                                <option value="all">
                                    Students and Teachers
                                </option>
                            </select>
                        </div>

                        <div className="send-notification-field">
                            <label htmlFor="notification-link">
                                Internal Page Link (Optional)
                            </label>

                            <input
                                id="notification-link"
                                type="text"
                                name="link"
                                value={form.link}
                                onChange={handleChange}
                                placeholder="/student/notices"
                                maxLength={300}
                            />

                            <small>
                                Example: /student/events
                            </small>
                        </div>

                        <div className="send-notification-field send-notification-full">
                            <label htmlFor="notification-message">
                                Notification Message *
                            </label>

                            <textarea
                                id="notification-message"
                                name="message"
                                value={form.message}
                                onChange={handleChange}
                                placeholder="Write the announcement or update..."
                                maxLength={2000}
                                rows={6}
                                required
                            />

                            <small>
                                {form.message.length}/2000 characters
                            </small>
                        </div>
                    </div>

                    <div className="send-notification-actions">
                        <button
                            type="button"
                            className="send-notification-reset"
                            disabled={loading}
                            onClick={() => {
                                setForm({
                                    title: "",
                                    message: "",
                                    type: "General",
                                    recipientRole: "student",
                                    link: "",
                                });

                                setSuccess("");
                                setError("");
                            }}
                        >
                            Clear Form
                        </button>

                        <button
                            type="submit"
                            className="send-notification-submit"
                            disabled={loading}
                        >
                            {loading
                                ? "Sending..."
                                : "📨 Send Notification"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

export default SendNotification;