
import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:5000/api/notices";

const initialForm = {
    title: "",
    description: "",
    category: "General",
    priority: "Normal",
    status: "Published",
};

function ManageNotices() {
    const [notices, setNotices] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const getToken = () => sessionStorage.getItem("token");

    // Load all notices, including drafts
    const fetchNotices = async () => {
        setLoading(true);
        setError("");

        try {
            const token = getToken();

            if (!token) {
                throw new Error("Please log in again. Your session may have expired.");
            }

            const response = await fetch(`${API_URL}/all`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load notices.");
            }

            setNotices(Array.isArray(data.notices) ? data.notices : []);
        } catch (err) {
            setError(err.message || "Could not connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const resetForm = () => {
        setForm(initialForm);
        setEditingId(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");

        if (!form.title.trim() || !form.description.trim()) {
            setError("Please enter both title and description.");
            return;
        }

        const token = getToken();

        if (!token) {
            setError("Please log in again.");
            return;
        }

        setSaving(true);

        try {
            const url = editingId
                ? `${API_URL}/${editingId}`
                : API_URL;

            const response = await fetch(url, {
                method: editingId ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...form,
                    title: form.title.trim(),
                    description: form.description.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to save notice.");
            }

            setMessage(
                editingId
                    ? "Notice updated successfully!"
                    : form.status === "Draft"
                        ? "Notice saved as draft!"
                        : "Notice published successfully!"
            );

            resetForm();
            await fetchNotices();
        } catch (err) {
            setError(err.message || "Unable to save notice.");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (notice) => {
        setForm({
            title: notice.title || "",
            description: notice.description || "",
            category: notice.category || "General",
            priority: notice.priority || "Normal",
            status: notice.status || "Published",
        });

        setEditingId(notice._id);
        setError("");
        setMessage("");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handleDelete = async (notice) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${notice.title}"?`
        );

        if (!confirmed) return;

        setError("");
        setMessage("");

        try {
            const token = getToken();

            if (!token) {
                throw new Error("Please log in again.");
            }

            const response = await fetch(`${API_URL}/${notice._id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to delete notice.");
            }

            setNotices((current) =>
                current.filter((item) => item._id !== notice._id)
            );

            if (editingId === notice._id) {
                resetForm();
            }

            setMessage("Notice deleted successfully!");
        } catch (err) {
            setError(err.message || "Unable to delete notice.");
        }
    };

    const filteredNotices = useMemo(() => {
        const query = search.trim().toLowerCase();

        return notices.filter((notice) => {
            const matchesSearch =
                !query ||
                notice.title?.toLowerCase().includes(query) ||
                notice.description?.toLowerCase().includes(query);

            const matchesCategory =
                categoryFilter === "All" ||
                notice.category === categoryFilter;

            const matchesStatus =
                statusFilter === "All" ||
                notice.status === statusFilter;

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [notices, search, categoryFilter, statusFilter]);

    const publishedCount = notices.filter(
        (notice) => notice.status === "Published"
    ).length;

    const draftCount = notices.filter(
        (notice) => notice.status === "Draft"
    ).length;

    const formatDate = (dateValue) => {
        if (!dateValue) return "Not published";

        const date = new Date(dateValue);

        return Number.isNaN(date.getTime())
            ? "Date unavailable"
            : date.toLocaleDateString();
    };

    return (
        <main className="manage-notices-page">
            <header className="manage-notices-header">
                <div>
                    <p className="manage-notices-eyebrow">
                        SMART CAMPUS ADMINISTRATION
                    </p>

                    <h1>Manage Notices</h1>

                    <p>
                        Create announcements and keep students informed
                        about important college updates.
                    </p>
                </div>
            </header>

            <section className="notice-stats">
                <article className="notice-stat-card">
                    <span>Total Notices</span>
                    <strong>{notices.length}</strong>
                </article>

                <article className="notice-stat-card">
                    <span>Published</span>
                    <strong>{publishedCount}</strong>
                </article>

                <article className="notice-stat-card">
                    <span>Drafts</span>
                    <strong>{draftCount}</strong>
                </article>
            </section>

            <section className="notice-form-card">
                <div className="notice-section-heading">
                    <div>
                        <h2>
                            {editingId ? "Edit Notice" : "Create New Notice"}
                        </h2>

                        <p>
                            Add the announcement details below.
                        </p>
                    </div>

                    {editingId && (
                        <button
                            type="button"
                            className="notice-cancel-button"
                            onClick={resetForm}
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>

                <form className="notice-form" onSubmit={handleSubmit}>
                    <div className="notice-form-field">
                        <label htmlFor="notice-title">
                            Notice Title *
                        </label>

                        <input
                            id="notice-title"
                            name="title"
                            type="text"
                            placeholder="Enter notice title"
                            value={form.title}
                            onChange={handleChange}
                            maxLength={150}
                            required
                        />
                    </div>

                    <div className="notice-form-field">
                        <label htmlFor="notice-description">
                            Description *
                        </label>

                        <textarea
                            id="notice-description"
                            name="description"
                            placeholder="Write the complete announcement..."
                            value={form.description}
                            onChange={handleChange}
                            rows={5}
                            required
                        />
                    </div>

                    <div className="notice-form-row">
                        <div className="notice-form-field">
                            <label htmlFor="notice-category">
                                Category
                            </label>

                            <select
                                id="notice-category"
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                            >
                                <option value="General">General</option>
                                <option value="Academic">Academic</option>
                                <option value="Examination">Examination</option>
                                <option value="Event">Event</option>
                                <option value="Holiday">Holiday</option>
                                <option value="Urgent">Urgent</option>
                            </select>
                        </div>

                        <div className="notice-form-field">
                            <label htmlFor="notice-priority">
                                Priority
                            </label>

                            <select
                                id="notice-priority"
                                name="priority"
                                value={form.priority}
                                onChange={handleChange}
                            >
                                <option value="Normal">Normal</option>
                                <option value="Important">Important</option>
                                <option value="Urgent">Urgent</option>
                            </select>
                        </div>

                        <div className="notice-form-field">
                            <label htmlFor="notice-status">
                                Status
                            </label>

                            <select
                                id="notice-status"
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                            >
                                <option value="Published">Publish Now</option>
                                <option value="Draft">Save as Draft</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="notice-submit-button"
                        disabled={saving}
                    >
                        {saving
                            ? "Saving..."
                            : editingId
                                ? "Update Notice"
                                : form.status === "Draft"
                                    ? "Save Draft"
                                    : "Publish Notice"}
                    </button>
                </form>
            </section>

            {message && (
                <div className="notice-alert success" role="status">
                    {message}
                </div>
            )}

            {error && (
                <div className="notice-alert error" role="alert">
                    {error}
                </div>
            )}

            <section className="notice-list-section">
                <div className="notice-section-heading">
                    <div>
                        <h2>All Notices</h2>
                        <p>Search and manage your announcements.</p>
                    </div>

                    <button
                        type="button"
                        className="notice-refresh-button"
                        onClick={fetchNotices}
                    >
                        Refresh
                    </button>
                </div>

                <div className="notice-filters">
                    <input
                        type="search"
                        placeholder="Search notices..."
                        aria-label="Search notices"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />

                    <select
                        aria-label="Filter by category"
                        value={categoryFilter}
                        onChange={(event) =>
                            setCategoryFilter(event.target.value)
                        }
                    >
                        <option value="All">All Categories</option>
                        <option value="General">General</option>
                        <option value="Academic">Academic</option>
                        <option value="Examination">Examination</option>
                        <option value="Event">Event</option>
                        <option value="Holiday">Holiday</option>
                        <option value="Urgent">Urgent</option>
                    </select>

                    <select
                        aria-label="Filter by status"
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value)
                        }
                    >
                        <option value="All">All Statuses</option>
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                    </select>
                </div>

                {loading ? (
                    <div className="notice-empty-state">
                        Loading notices...
                    </div>
                ) : filteredNotices.length === 0 ? (
                    <div className="notice-empty-state">
                        <span aria-hidden="true">📢</span>
                        <h3>No notices found</h3>
                        <p>
                            Create a new notice or change your search filters.
                        </p>
                    </div>
                ) : (
                    <div className="manage-notices-grid">
                        {filteredNotices.map((notice) => (
                            <article
                                className="manage-notice-card"
                                key={notice._id}
                            >
                                <div className="manage-notice-badges">
                                    <span className="notice-category-badge">
                                        {notice.category}
                                    </span>

                                    <span
                                        className={`notice-status-badge ${notice.status === "Published"
                                            ? "published"
                                            : "draft"
                                            }`}
                                    >
                                        {notice.status}
                                    </span>
                                </div>

                                <h3>{notice.title}</h3>

                                <p className="manage-notice-description">
                                    {notice.description}
                                </p>

                                <div className="manage-notice-details">
                                    <span>
                                        Priority: {notice.priority}
                                    </span>

                                    <span>
                                        Date: {formatDate(
                                            notice.publishedAt ||
                                            notice.createdAt
                                        )}
                                    </span>
                                </div>

                                <div className="manage-notice-actions">
                                    <button
                                        type="button"
                                        className="notice-edit-button"
                                        onClick={() => handleEdit(notice)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        className="notice-delete-button"
                                        onClick={() => handleDelete(notice)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default ManageNotices;

