import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api/bookmarks";

function readApiResponse(response) {
    const contentType = response.headers.get("content-type") || "";


    if (!contentType.includes("application/json")) {
        throw new Error(
            `Invalid server response. HTTP status: ${response.status}.`
        );
    }

    return response.json();


}

function getBookmarkIcon(type) {
    switch (type) {
        case "Notice":
            return "📢";
        case "Event":
            return "📅";
        case "Material":
            return "📚";
        case "Faculty":
            return "👨‍🏫";
        default:
            return "🔖";
    }
}

function formatBookmarkDate(value) {
    if (!value) return "Date unavailable";


    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });


}

function StudentBookmarks() {
    const navigate = useNavigate();


    const [bookmarks, setBookmarks] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedType, setSelectedType] = useState("All");

    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const getToken = () => sessionStorage.getItem("token");

    // Fetch the logged-in student's bookmarks.
    const fetchBookmarks = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const token = getToken();

            if (!token) {
                throw new Error(
                    "Login session not found. Please log in again."
                );
            }

            const response = await fetch(API_URL, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await readApiResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load bookmarks."
                );
            }

            setBookmarks(data.bookmarks || []);
        } catch (err) {
            console.error("Fetch bookmarks error:", err);
            setError(err.message || "Unable to load bookmarks.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBookmarks();
    }, [fetchBookmarks]);

    // Search and filter bookmarks.
    const filteredBookmarks = useMemo(() => {
        const query = search.trim().toLowerCase();

        return bookmarks.filter((bookmark) => {
            const matchesType =
                selectedType === "All" ||
                bookmark.itemType === selectedType;

            const searchableText = [
                bookmark.title,
                bookmark.description,
                bookmark.itemType,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return matchesType && searchableText.includes(query);
        });
    }, [bookmarks, search, selectedType]);

    // Remove a bookmark.
    const handleRemove = async (bookmark) => {
        const confirmed = window.confirm(
            `Remove "${bookmark.title}" from your bookmarks?`
        );

        if (!confirmed) return;

        try {
            setRemovingId(bookmark._id);
            setError("");
            setMessage("");

            const token = getToken();

            if (!token) {
                throw new Error(
                    "Login session not found. Please log in again."
                );
            }

            const response = await fetch(
                `${API_URL}/${bookmark._id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await readApiResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to remove bookmark."
                );
            }

            setBookmarks((previous) =>
                previous.filter(
                    (item) => item._id !== bookmark._id
                )
            );

            setMessage("Bookmark removed successfully.");
        } catch (err) {
            console.error("Remove bookmark error:", err);
            setError(err.message || "Unable to remove bookmark.");
        } finally {
            setRemovingId("");
        }
    };

    // Open only internal application links.
    const handleOpen = (bookmark) => {
        const link = bookmark.link;

        if (
            typeof link === "string" &&
            link.startsWith("/") &&
            !link.startsWith("//")
        ) {
            navigate(link);
        } else {
            setError(
                "No valid internal page link is available for this bookmark."
            );
        }
    };

    const bookmarkTypes = [
        "All",
        "Notice",
        "Event",
        "Material",
        "Faculty",
    ];

    const noticeCount = bookmarks.filter(
        (bookmark) => bookmark.itemType === "Notice"
    ).length;

    const eventCount = bookmarks.filter(
        (bookmark) => bookmark.itemType === "Event"
    ).length;

    const materialCount = bookmarks.filter(
        (bookmark) => bookmark.itemType === "Material"
    ).length;

    const facultyCount = bookmarks.filter(
        (bookmark) => bookmark.itemType === "Faculty"
    ).length;

    return (
        <main className="page-container">
            <section className="student-bookmarks-page">

                {/* HEADER */}
                <header className="student-bookmarks-hero">
                    <div className="student-bookmarks-hero-content">
                        <span className="student-bookmarks-eyebrow">
                            SMART CAMPUS
                        </span>

                        <h1>
                            My <span>Bookmarks</span>
                        </h1>

                        <p>
                            Keep your important college notices, events,
                            study materials and faculty details in one place.
                        </p>

                        <div className="student-bookmarks-total">
                            <span>🔖</span>

                            <div>
                                <strong>{bookmarks.length}</strong>
                                <small>
                                    {bookmarks.length === 1
                                        ? "Saved item"
                                        : "Saved items"}
                                </small>
                            </div>
                        </div>
                    </div>

                    <div className="student-bookmarks-hero-art">
                        🔖
                    </div>
                </header>

                {/* CATEGORY COUNTS */}
                <div className="student-bookmark-stats">
                    <article className="student-bookmark-stat">
                        <span>📢</span>
                        <div>
                            <strong>{noticeCount}</strong>
                            <small>Notices</small>
                        </div>
                    </article>

                    <article className="student-bookmark-stat">
                        <span>📅</span>
                        <div>
                            <strong>{eventCount}</strong>
                            <small>Events</small>
                        </div>
                    </article>

                    <article className="student-bookmark-stat">
                        <span>📚</span>
                        <div>
                            <strong>{materialCount}</strong>
                            <small>Materials</small>
                        </div>
                    </article>

                    <article className="student-bookmark-stat">
                        <span>👨‍🏫</span>
                        <div>
                            <strong>{facultyCount}</strong>
                            <small>Faculty</small>
                        </div>
                    </article>
                </div>

                {/* STATUS MESSAGES */}
                {error && (
                    <div className="student-bookmark-alert bookmark-alert-error">
                        <span>⚠️</span>
                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={() => setError("")}
                            aria-label="Dismiss error"
                        >
                            ×
                        </button>
                    </div>
                )}

                {message && (
                    <div className="student-bookmark-alert bookmark-alert-success">
                        <span>✅</span>
                        <p>{message}</p>

                        <button
                            type="button"
                            onClick={() => setMessage("")}
                            aria-label="Dismiss message"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* SEARCH AND FILTER */}
                <section className="student-bookmarks-toolbar">
                    <div className="student-bookmarks-section-heading">
                        <div>
                            <h2>Your Saved Items</h2>
                            <p>
                                Quickly find something you saved earlier.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="student-bookmarks-refresh"
                            onClick={fetchBookmarks}
                            disabled={loading || removingId !== ""}
                        >
                            ↻ Refresh
                        </button>
                    </div>

                    <div className="student-bookmarks-controls">
                        <div className="student-bookmarks-search">
                            <span>🔎</span>

                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search your bookmarks..."
                                aria-label="Search bookmarks"
                            />
                        </div>

                        <div className="student-bookmarks-filter">
                            <label htmlFor="bookmark-type">
                                Category
                            </label>

                            <select
                                id="bookmark-type"
                                value={selectedType}
                                onChange={(event) =>
                                    setSelectedType(event.target.value)
                                }
                            >
                                {bookmarkTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type === "All"
                                            ? "All Categories"
                                            : type === "Material"
                                                ? "Study Materials"
                                                : type}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                {/* LOADING STATE */}
                {loading ? (
                    <div className="student-bookmarks-empty">
                        <div className="student-bookmarks-loader" />

                        <h3>Loading bookmarks...</h3>

                        <p>
                            Fetching your saved items.
                        </p>
                    </div>
                ) : filteredBookmarks.length === 0 ? (
                    /* EMPTY STATE */
                    <div className="student-bookmarks-empty">
                        <div className="student-bookmarks-empty-icon">
                            🔖
                        </div>

                        <h3>
                            {bookmarks.length === 0
                                ? "No Bookmarks Yet"
                                : "No Matching Bookmarks"}
                        </h3>

                        <p>
                            {bookmarks.length === 0
                                ? "Save important notices, events, study materials or faculty details to find them here."
                                : "Try another search term or choose a different category."}
                        </p>

                        {bookmarks.length > 0 ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch("");
                                    setSelectedType("All");
                                }}
                            >
                                Clear Filters
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/student/notices")
                                }
                            >
                                Explore Notices →
                            </button>
                        )}
                    </div>
                ) : (
                    /* BOOKMARK CARDS */
                    <div className="student-bookmarks-grid">
                        {filteredBookmarks.map((bookmark) => (
                            <article
                                className="student-bookmark-card"
                                key={bookmark._id}
                            >
                                <div className="student-bookmark-card-top">
                                    <div className="student-bookmark-icon">
                                        {getBookmarkIcon(bookmark.itemType)}
                                    </div>

                                    <span className="student-bookmark-type">
                                        {bookmark.itemType === "Material"
                                            ? "Study Material"
                                            : bookmark.itemType}
                                    </span>
                                </div>

                                <div className="student-bookmark-card-content">
                                    <h3>{bookmark.title}</h3>

                                    <p>
                                        {bookmark.description ||
                                            "No description available for this saved item."}
                                    </p>

                                    <div className="student-bookmark-date">
                                        <span>🔖</span>

                                        Saved on{" "}
                                        {formatBookmarkDate(
                                            bookmark.createdAt
                                        )}
                                    </div>
                                </div>

                                <div className="student-bookmark-card-actions">
                                    <button
                                        type="button"
                                        className="student-bookmark-open"
                                        onClick={() => handleOpen(bookmark)}
                                    >
                                        Open Item →
                                    </button>

                                    <button
                                        type="button"
                                        className="student-bookmark-remove"
                                        onClick={() =>
                                            handleRemove(bookmark)
                                        }
                                        disabled={
                                            removingId !== "" ||
                                            !bookmark._id
                                        }
                                    >
                                        {removingId === bookmark._id
                                            ? "Removing..."
                                            : "Remove"}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {!loading && filteredBookmarks.length > 0 && (
                    <p className="student-bookmarks-results">
                        Showing {filteredBookmarks.length} of{" "}
                        {bookmarks.length} saved items
                    </p>
                )}
            </section>
        </main>
    );


}

export default StudentBookmarks;
