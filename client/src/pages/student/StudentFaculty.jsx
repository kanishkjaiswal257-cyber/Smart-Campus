
import { useEffect, useMemo, useState } from "react";
import StudentLayout from "../../layouts/StudentLayout.jsx";

const API_URL = "http://localhost:5000/api/faculty";

function StudentFaculty() {
    const [faculty, setFaculty] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch faculty members registered by the admin.
    const fetchFaculty = async (signal) => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(API_URL, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
                signal,
            });

            const contentType =
                response.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {
                throw new Error(
                    "The server returned an invalid response."
                );
            }

            const data = await response.json();

            if (!response.ok || data.success === false) {
                throw new Error(
                    data.message || "Unable to load faculty members."
                );
            }

            const records = Array.isArray(data.faculty)
                ? data.faculty
                : [];

            setFaculty(records);
        } catch (err) {
            if (err.name !== "AbortError") {
                console.error("Faculty loading error:", err);

                setError(
                    err.message ||
                    "Unable to connect to the faculty server."
                );
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        const controller = new AbortController();

        fetchFaculty(controller.signal);

        return () => controller.abort();
    }, []);

    // Search actual faculty records.
    const filteredFaculty = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return faculty;
        }

        return faculty.filter((teacher) => {
            const searchableFields = [
                teacher.name,
                teacher.email,
                teacher.department,
                teacher.employeeId,
            ];

            return searchableFields.some((value) =>
                String(value || "")
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [faculty, search]);

    // Generate initials for the faculty avatar.
    const getInitials = (name) => {
        return (name || "Teacher")
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("");
    };

    return (
        <StudentLayout>
            <main className="sf-page">
                {/* Page heading */}
                <header className="sf-header">
                    <div>
                        <p className="sf-eyebrow">
                            SMART CAMPUS
                        </p>

                        <h1>Faculty Directory</h1>

                        <p className="sf-subtitle">
                            Explore faculty members registered
                            with the college portal.
                        </p>
                    </div>

                    <div className="sf-count">
                        <strong>
                            {loading ? "..." : faculty.length}
                        </strong>

                        <span>Faculty Members</span>
                    </div>
                </header>

                {/* Search and refresh */}
                <section className="sf-toolbar">
                    <div className="sf-search-box">
                        <span aria-hidden="true">⌕</span>

                        <input
                            type="search"
                            placeholder="Search by name, email or department..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            aria-label="Search faculty members"
                        />
                    </div>

                    <button
                        type="button"
                        className="sf-refresh"
                        disabled={loading}
                        onClick={() => fetchFaculty()}
                    >
                        ↻ Refresh
                    </button>
                </section>

                {/* Loading state */}
                {loading && (
                    <div className="sf-state">
                        <div className="sf-spinner" />

                        <h3>Loading faculty members...</h3>

                        <p>
                            Fetching registered faculty from the database.
                        </p>
                    </div>
                )}

                {/* Error state */}
                {!loading && error && (
                    <div className="sf-state sf-error">
                        <div className="sf-state-icon">⚠️</div>

                        <h3>Unable to load faculty</h3>

                        <p>{error}</p>

                        <button
                            type="button"
                            className="sf-retry"
                            onClick={() => fetchFaculty()}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty state */}
                {!loading &&
                    !error &&
                    filteredFaculty.length === 0 && (
                        <div className="sf-state">
                            <div className="sf-state-icon">
                                👨‍🏫
                            </div>

                            <h3>
                                {search.trim()
                                    ? "No matching faculty found"
                                    : "No faculty members registered yet"}
                            </h3>

                            <p>
                                {search.trim()
                                    ? "Try another name, email or department."
                                    : "Teacher accounts registered by the admin will appear here."}
                            </p>
                        </div>
                    )}

                {/* Actual faculty records */}
                {!loading &&
                    !error &&
                    filteredFaculty.length > 0 && (
                        <>
                            <p className="sf-results">
                                Showing {filteredFaculty.length} of{" "}
                                {faculty.length} faculty members
                            </p>

                            <section className="sf-grid">
                                {filteredFaculty.map((teacher) => (
                                    <article
                                        className="sf-card"
                                        key={
                                            teacher._id ||
                                            teacher.email
                                        }
                                    >
                                        <div className="sf-card-top">
                                            <div className="sf-avatar">
                                                {getInitials(
                                                    teacher.name
                                                )}
                                            </div>

                                            <span className="sf-badge">
                                                Faculty
                                            </span>
                                        </div>

                                        <h2>
                                            {teacher.name ||
                                                "Name not available"}
                                        </h2>

                                        <p className="sf-department">
                                            {teacher.department ||
                                                "Department not specified"}
                                        </p>

                                        {teacher.employeeId && (
                                            <p className="sf-employee">
                                                Employee ID:{" "}
                                                {teacher.employeeId}
                                            </p>
                                        )}

                                        <div className="sf-divider" />

                                        <div className="sf-contact">
                                            <span aria-hidden="true">
                                                ✉️
                                            </span>

                                            {teacher.email ? (
                                                <a
                                                    href={`mailto:${teacher.email}`}
                                                >
                                                    {teacher.email}
                                                </a>
                                            ) : (
                                                <span>
                                                    Email not available
                                                </span>
                                            )}
                                        </div>

                                        <div className="sf-card-footer">
                                            <span className="sf-status-dot" />
                                            Registered Faculty
                                        </div>
                                    </article>
                                ))}
                            </section>
                        </>
                    )}
            </main>

            <style>{`
                .sf-page {
                    padding: 28px;
                    color: #172033;
                    font-family: inherit;
                }

                .sf-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    margin-bottom: 28px;
                }

                .sf-eyebrow {
                    margin: 0 0 8px;
                    color: #4f46e5;
                    font-size: 12px;
                    font-weight: 800;
                    letter-spacing: 1.8px;
                }

                .sf-header h1 {
                    margin: 0;
                    font-size: clamp(26px, 3vw, 34px);
                    font-weight: 800;
                }

                .sf-subtitle {
                    margin-top: 9px;
                    color: #64748b;
                    font-size: 14px;
                    line-height: 1.7;
                }

                .sf-count {
                    min-width: 135px;
                    padding: 16px;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    background: #ffffff;
                    text-align: center;
                }

                .sf-count strong {
                    display: block;
                    color: #4f46e5;
                    font-size: 28px;
                    font-weight: 800;
                }

                .sf-count span {
                    color: #64748b;
                    font-size: 12px;
                }

                .sf-toolbar {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 18px;
                }

                .sf-search-box {
                    display: flex;
                    flex: 1;
                    align-items: center;
                    gap: 10px;
                    min-width: 0;
                    padding: 0 15px;
                    border: 1px solid #dbe2ea;
                    border-radius: 12px;
                    background: #ffffff;
                }

                .sf-search-box > span {
                    color: #64748b;
                    font-size: 23px;
                }

                .sf-search-box input {
                    width: 100%;
                    min-width: 0;
                    padding: 14px 0;
                    border: 0;
                    outline: none;
                    background: transparent;
                    color: #172033;
                    font: inherit;
                }

                .sf-search-box:focus-within {
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, .1);
                }

                .sf-refresh,
                .sf-retry {
                    padding: 12px 18px;
                    border: 0;
                    border-radius: 10px;
                    background: #4f46e5;
                    color: #ffffff;
                    font: inherit;
                    font-weight: 700;
                    cursor: pointer;
                }

                .sf-refresh:disabled {
                    opacity: .6;
                    cursor: not-allowed;
                }

                .sf-results {
                    margin: 16px 0;
                    color: #64748b;
                    font-size: 13px;
                }

                .sf-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(auto-fill, minmax(245px, 1fr));
                    gap: 20px;
                }

                .sf-card {
                    min-width: 0;
                    padding: 22px;
                    border: 1px solid #e5eaf1;
                    border-radius: 18px;
                    background: #ffffff;
                    box-shadow: 0 5px 20px rgba(15, 23, 42, .04);
                    transition:
                        transform .2s ease,
                        box-shadow .2s ease;
                }

                .sf-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 28px rgba(15, 23, 42, .09);
                }

                .sf-card-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .sf-avatar {
                    display: grid;
                    width: 60px;
                    height: 60px;
                    flex-shrink: 0;
                    place-items: center;
                    border-radius: 17px;
                    background: linear-gradient(135deg, #eef2ff, #ddd6fe);
                    color: #4338ca;
                    font-size: 21px;
                    font-weight: 800;
                }

                .sf-badge {
                    padding: 6px 10px;
                    border-radius: 20px;
                    background: #ecfdf5;
                    color: #047857;
                    font-size: 11px;
                    font-weight: 800;
                }

                .sf-card h2 {
                    margin: 0;
                    overflow-wrap: anywhere;
                    color: #172033;
                    font-size: 18px;
                    font-weight: 750;
                }

                .sf-department {
                    margin: 8px 0 0;
                    color: #6366f1;
                    font-size: 13px;
                    font-weight: 600;
                }

                .sf-employee {
                    margin: 8px 0 0;
                    color: #64748b;
                    font-size: 12px;
                }

                .sf-divider {
                    height: 1px;
                    margin: 20px 0 15px;
                    background: #edf0f5;
                }

                .sf-contact {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    color: #64748b;
                    font-size: 13px;
                }

                .sf-contact a {
                    min-width: 0;
                    overflow-wrap: anywhere;
                    color: #475569;
                    text-decoration: none;
                }

                .sf-contact a:hover {
                    color: #4f46e5;
                }

                .sf-card-footer {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    margin-top: 20px;
                    color: #64748b;
                    font-size: 11px;
                }

                .sf-status-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #10b981;
                }

                .sf-state {
                    padding: 45px 20px;
                    border: 1px dashed #cbd5e1;
                    border-radius: 16px;
                    background: #ffffff;
                    text-align: center;
                }

                .sf-state h3 {
                    margin: 12px 0 8px;
                    color: #172033;
                }

                .sf-state p {
                    color: #64748b;
                    font-size: 14px;
                    line-height: 1.7;
                }

                .sf-state-icon {
                    font-size: 34px;
                }

                .sf-error {
                    border-color: #fecaca;
                    background: #fffafa;
                }

                .sf-spinner {
                    width: 30px;
                    height: 30px;
                    margin: 0 auto;
                    border: 3px solid #e0e7ff;
                    border-top-color: #4f46e5;
                    border-radius: 50%;
                    animation: sf-spin .8s linear infinite;
                }

                @keyframes sf-spin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                @media (max-width: 600px) {
                    .sf-page {
                        padding: 18px;
                    }

                    .sf-header {
                        align-items: flex-start;
                    }

                    .sf-count {
                        min-width: 95px;
                        padding: 12px 8px;
                    }

                    .sf-toolbar {
                        flex-direction: column;
                    }

                    .sf-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </StudentLayout>
    );
}

export default StudentFaculty;

