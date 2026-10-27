import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:5000/api/faculty";

function FacultyDirectory() {
    const [faculty, setFaculty] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {
        const controller = new AbortController();
        let isMounted = true;

        const fetchFaculty = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(API_URL, {
                    method: "GET",
                    signal: controller.signal,
                });

                const contentType =
                    response.headers.get("content-type") || "";

                if (!contentType.includes("application/json")) {
                    throw new Error(
                        "The server returned an invalid response. Check the backend."
                    );
                }

                const data = await response.json();

                if (!response.ok || data.success === false) {
                    throw new Error(
                        data.message || "Unable to load faculty members."
                    );
                }

                if (!Array.isArray(data.faculty)) {
                    throw new Error(
                        "Faculty data was not returned in the expected format."
                    );
                }

                if (isMounted) {
                    setFaculty(data.faculty);
                }
            } catch (err) {
                if (err.name === "AbortError") {
                    return;
                }

                console.error("Faculty Directory Error:", err);

                if (isMounted) {
                    setFaculty([]);
                    setError(
                        err.message ||
                        "Unable to connect to the server."
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchFaculty();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, []);

    // Search the faculty records returned by MongoDB.
    const filteredFaculty = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return faculty;
        }

        return faculty.filter((member) =>
            [
                member.name,
                member.email,
                member.department,
            ].some((value) =>
                String(value || "")
                    .toLowerCase()
                    .includes(query)
            )
        );
    }, [faculty, search]);

    return (
        <main className="faculty-directory-page">
            <section className="faculty-directory-header">
                <span className="faculty-directory-eyebrow">
                    SMART CAMPUS
                </span>

                <h1>Faculty Directory</h1>

                <p>
                    Meet our faculty members and find their department
                    and official contact information.
                </p>

                <div className="faculty-directory-search">
                    <span aria-hidden="true">🔍</span>

                    <input
                        type="search"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="Search by name, email, or department..."
                        aria-label="Search faculty"
                    />
                </div>
            </section>

            <section className="faculty-directory-content">
                <div className="faculty-directory-results-heading">
                    <h2>Our Faculty</h2>

                    {!loading && !error && (
                        <span>
                            {filteredFaculty.length}{" "}
                            {filteredFaculty.length === 1
                                ? "faculty member"
                                : "faculty members"}
                        </span>
                    )}
                </div>

                {loading && (
                    <div className="faculty-directory-state">
                        <div className="faculty-directory-spinner"></div>
                        <p>Loading faculty from the database...</p>
                    </div>
                )}

                {error && (
                    <div
                        className="faculty-directory-state faculty-directory-error"
                        role="alert"
                    >
                        <h3>Unable to load faculty</h3>
                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {!loading &&
                    !error &&
                    filteredFaculty.length > 0 && (
                        <div className="faculty-directory-grid">
                            {filteredFaculty.map((member) => (
                                <article
                                    className="faculty-card"
                                    key={member._id}
                                >
                                    <div className="faculty-card-header">
                                        <div className="faculty-avatar">
                                            {member.name
                                                ?.trim()
                                                ?.charAt(0)
                                                ?.toUpperCase() || "F"}
                                        </div>

                                        <span className="faculty-status">
                                            Active
                                        </span>
                                    </div>

                                    <h3>
                                        {member.name || "Faculty Member"}
                                    </h3>

                                    <p className="faculty-designation">
                                        Faculty Member
                                    </p>

                                    <div className="faculty-card-details">
                                        <div>
                                            <span>Department</span>
                                            <strong>
                                                {member.department ||
                                                    "Not provided"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Email</span>

                                            {member.email ? (
                                                <a
                                                    href={`mailto:${member.email}`}
                                                >
                                                    {member.email}
                                                </a>
                                            ) : (
                                                <strong>Not provided</strong>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                {!loading &&
                    !error &&
                    filteredFaculty.length === 0 && (
                        <div className="faculty-directory-state">
                            <span className="faculty-empty-icon">👨‍🏫</span>

                            <h3>
                                {search
                                    ? "No matching faculty found"
                                    : "No faculty members registered yet"}
                            </h3>

                            <p>
                                {search
                                    ? "Try another name, email, or department."
                                    : "Teacher accounts added by the administrator will appear here."}
                            </p>

                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                >
                                    View All Faculty
                                </button>
                            )}
                        </div>
                    )}
            </section>
        </main>
    );


}

export default FacultyDirectory;
