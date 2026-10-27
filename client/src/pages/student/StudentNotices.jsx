import { useEffect, useMemo, useState } from "react";

function StudentNotices() {
    const [notices, setNotices] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {
        let isMounted = true;

        const fetchNotices = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    "http://localhost:5000/api/notices"
                );

                const contentType =
                    response.headers.get("content-type") || "";

                if (!contentType.includes("application/json")) {
                    throw new Error(
                        "Invalid server response. Please check the backend."
                    );
                }

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load notices."
                    );
                }

                if (isMounted) {
                    setNotices(
                        Array.isArray(data)
                            ? data
                            : data.notices || []
                    );
                }
            } catch (err) {
                console.error("Student notices error:", err);

                if (isMounted) {
                    setError(
                        err.message || "Unable to load notices."
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchNotices();

        return () => {
            isMounted = false;
        };
    }, []);

    const categories = [
        "All",
        "General",
        "Academic",
        "Examination",
        "Event",
        "Holiday",
        "Urgent",
    ];

    const filteredNotices = useMemo(() => {
        const query = search.trim().toLowerCase();

        return notices.filter((notice) => {
            const matchesCategory =
                selectedCategory === "All" ||
                notice.category === selectedCategory;

            const matchesSearch = [
                notice.title,
                notice.description,
                notice.category,
                notice.priority,
            ]
                .filter(Boolean)
                .some((value) =>
                    String(value).toLowerCase().includes(query)
                );

            return matchesCategory && matchesSearch;
        });
    }, [notices, search, selectedCategory]);

    const formatDate = (value) => {
        if (!value) return "Date not available";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Date not available";
        }

        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const getPriorityClass = (priority) => {
        switch ((priority || "Normal").toLowerCase()) {
            case "urgent":
                return "notice-priority-urgent";
            case "important":
                return "notice-priority-important";
            default:
                return "notice-priority-normal";
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case "Academic":
                return "📚";
            case "Examination":
                return "📝";
            case "Event":
                return "📅";
            case "Holiday":
                return "🏖️";
            case "Urgent":
                return "🚨";
            default:
                return "📢";
        }
    };

    return (
        <main className="page-container">
            <section className="student-notices-page">
                {/* Page Header */}
                <header className="student-notices-hero">
                    <div className="student-notices-hero-content">
                        <span className="student-notices-eyebrow">
                            SMART CAMPUS
                        </span>

                        <h1>
                            Campus <span>Notices</span>
                        </h1>

                        <p>
                            Stay informed about academic updates,
                            examinations, college events and important
                            announcements.
                        </p>

                        <div className="student-notices-summary">
                            <span>📢</span>

                            <div>
                                <strong>{notices.length}</strong>
                                <small>Published Notices</small>
                            </div>
                        </div>
                    </div>

                    <div className="student-notices-hero-icon">
                        📣
                    </div>
                </header>

                {/* Search and Filters */}
                <section className="student-notices-toolbar">
                    <div className="student-notices-section-heading">
                        <div>
                            <h2>Latest Announcements</h2>

                            <p>
                                Find the information you need.
                            </p>
                        </div>
                    </div>

                    <div className="student-notices-controls">
                        <div className="student-notices-search">
                            <span>🔎</span>

                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search notices..."
                                aria-label="Search notices"
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    aria-label="Clear search"
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        <div className="student-notices-category">
                            <label htmlFor="notice-category">
                                Category
                            </label>

                            <select
                                id="notice-category"
                                value={selectedCategory}
                                onChange={(event) =>
                                    setSelectedCategory(event.target.value)
                                }
                            >
                                {categories.map((category) => (
                                    <option
                                        key={category}
                                        value={category}
                                    >
                                        {category === "All"
                                            ? "All Categories"
                                            : category}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                {/* Loading */}
                {loading && (
                    <div className="student-notices-empty">
                        <div className="student-notices-loader" />

                        <h3>Loading notices...</h3>

                        <p>
                            Fetching the latest college announcements.
                        </p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="student-notices-empty notice-error-state">
                        <span className="student-notices-empty-icon">
                            ⚠️
                        </span>

                        <h3>Unable to Load Notices</h3>

                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && filteredNotices.length === 0 && (
                    <div className="student-notices-empty">
                        <span className="student-notices-empty-icon">
                            📭
                        </span>

                        <h3>
                            {notices.length === 0
                                ? "No Notices Available"
                                : "No Matching Notices"}
                        </h3>

                        <p>
                            {notices.length === 0
                                ? "Published college announcements will appear here."
                                : "Try another search term or category."}
                        </p>

                        {(search || selectedCategory !== "All") && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch("");
                                    setSelectedCategory("All");
                                }}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                )}

                {/* Notice Cards */}
                {!loading && !error && filteredNotices.length > 0 && (
                    <div className="student-notices-grid">
                        {filteredNotices.map((notice) => (
                            <article
                                className={`student-notice-card ${(notice.priority || "Normal").toLowerCase() ===
                                    "urgent"
                                    ? "student-notice-card-urgent"
                                    : ""
                                    }`}
                                key={notice._id}
                            >
                                <div className="student-notice-card-top">
                                    <div className="student-notice-icon">
                                        {getCategoryIcon(notice.category)}
                                    </div>

                                    <span
                                        className={`notice-priority-badge ${getPriorityClass(notice.priority)
                                            }`}
                                    >
                                        {notice.priority || "Normal"}
                                    </span>
                                </div>

                                <div className="student-notice-card-content">
                                    <div className="student-notice-meta">
                                        <span className="student-notice-category-badge">
                                            {notice.category || "General"}
                                        </span>

                                        <span className="student-notice-date">
                                            📅{" "}
                                            {formatDate(
                                                notice.publishedAt ||
                                                notice.createdAt
                                            )}
                                        </span>
                                    </div>

                                    <h3>{notice.title}</h3>

                                    <p className="student-notice-description">
                                        {notice.description}
                                    </p>
                                </div>

                                <div className="student-notice-card-footer">
                                    <span>Smart Campus Announcement</span>

                                    <span className="student-notice-status">
                                        ● Published
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {!loading && !error && filteredNotices.length > 0 && (
                    <p className="student-notices-results">
                        Showing {filteredNotices.length} of{" "}
                        {notices.length} notices
                    </p>
                )}
            </section>
        </main>
    );


}

export default StudentNotices;
