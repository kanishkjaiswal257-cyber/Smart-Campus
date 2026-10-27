import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:5000/api/users/search/students";

function SearchStudents() {
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {
        const controller = new AbortController();
        let isMounted = true;

        const fetchStudents = async () => {
            try {
                setLoading(true);
                setError("");

                const token = sessionStorage.getItem("token");

                if (!token) {
                    throw new Error(
                        "Your session has expired. Please log in again."
                    );
                }

                const response = await fetch(API_URL, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    signal: controller.signal,
                });

                const contentType =
                    response.headers.get("content-type") || "";

                if (!contentType.includes("application/json")) {
                    throw new Error(
                        "The server returned an invalid response. Check your backend."
                    );
                }

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message ||
                        "Unable to load registered students."
                    );
                }

                const registeredStudents = Array.isArray(result.students)
                    ? result.students
                    : Array.isArray(result.users)
                        ? result.users
                        : null;

                if (!registeredStudents) {
                    throw new Error(
                        "The server response does not contain a student list."
                    );
                }

                if (isMounted) {
                    setStudents(registeredStudents);
                }
            } catch (err) {
                if (err.name === "AbortError") {
                    return;
                }

                console.error("Student Search Error:", err);

                if (isMounted) {
                    setError(
                        err.message ||
                        "Unable to load student records."
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchStudents();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, []);

    // Filter the real student records as the teacher types.
    const filteredStudents = useMemo(() => {
        const searchText = search.trim().toLowerCase();

        if (!searchText) {
            return students;
        }

        return students.filter((student) => {
            const searchableFields = [
                student.name,
                student.crn,
                student.email,
                student.course,
                student.department,
                student.semester,
            ];

            return searchableFields.some((value) =>
                String(value ?? "")
                    .toLowerCase()
                    .includes(searchText)
            );
        });
    }, [students, search]);

    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <main className="page-container registered-students-page">
            <header className="registered-students-header">
                <div>
                    <span className="registered-students-eyebrow">
                        FACULTY WORKSPACE
                    </span>

                    <h1>Search Students</h1>

                    <p>
                        Find students registered by the college
                        administrator using their name, CRN, email,
                        course, or department.
                    </p>
                </div>

                <div className="registered-students-total">
                    <span>🎓</span>
                    <div>
                        <strong>
                            {loading ? "..." : students.length}
                        </strong>
                        <small>Registered Students</small>
                    </div>
                </div>
            </header>

            <section className="registered-students-panel">
                <div className="registered-students-search">
                    <span aria-hidden="true">🔎</span>

                    <input
                        type="search"
                        className="search-input"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="Search by student name, CRN, email..."
                        aria-label="Search registered students"
                    />

                    {search && (
                        <button
                            type="button"
                            className="registered-students-clear"
                            onClick={() => setSearch("")}
                        >
                            Clear
                        </button>
                    )}
                </div>

                {error && (
                    <div
                        className="registered-students-error"
                        role="alert"
                    >
                        <strong>Unable to load students</strong>
                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={handleRetry}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="registered-students-state">
                        <span className="registered-students-spinner"></span>
                        <p>Loading students from the database...</p>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        <div className="registered-students-list-header">
                            <div>
                                <h2>Student Directory</h2>
                                <p>
                                    {search
                                        ? "Matching registered student records"
                                        : "Students registered by the administrator"}
                                </p>
                            </div>

                            <span className="registered-students-count">
                                {filteredStudents.length}{" "}
                                {filteredStudents.length === 1
                                    ? "result"
                                    : "results"}
                            </span>
                        </div>

                        {filteredStudents.length > 0 ? (
                            <div className="students-grid">
                                {filteredStudents.map((student) => (
                                    <article
                                        className="student-card"
                                        key={student._id}
                                    >
                                        <div className="registered-student-card-header">
                                            <div className="registered-student-avatar">
                                                {student.name
                                                    ?.trim()
                                                    ?.charAt(0)
                                                    ?.toUpperCase() || "S"}
                                            </div>

                                            <div className="registered-student-name">
                                                <h3>
                                                    {student.name ||
                                                        "Name unavailable"}
                                                </h3>

                                                <span className="registered-student-badge">
                                                    Active Student
                                                </span>
                                            </div>
                                        </div>

                                        <div className="registered-student-details">
                                            <div className="registered-student-detail">
                                                <span>CRN</span>
                                                <strong>
                                                    {student.crn ||
                                                        "Not provided"}
                                                </strong>
                                            </div>

                                            <div className="registered-student-detail">
                                                <span>Email</span>
                                                <strong className="registered-student-email">
                                                    {student.email ||
                                                        "Not provided"}
                                                </strong>
                                            </div>

                                            <div className="registered-student-detail">
                                                <span>Course</span>
                                                <strong>
                                                    {student.course ||
                                                        "Not provided"}
                                                </strong>
                                            </div>

                                            <div className="registered-student-detail">
                                                <span>Semester</span>
                                                <strong>
                                                    {student.semester
                                                        ? `Semester ${student.semester}`
                                                        : "Not provided"}
                                                </strong>
                                            </div>

                                            <div className="registered-student-detail">
                                                <span>Department</span>
                                                <strong>
                                                    {student.department ||
                                                        "Not provided"}
                                                </strong>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="registered-students-empty">
                                <span>🎓</span>

                                <h3>
                                    {search
                                        ? "No matching students found"
                                        : "No registered students yet"}
                                </h3>

                                <p>
                                    {search
                                        ? "Try searching with a different name, CRN, email, or course."
                                        : "When the administrator registers students, their records will appear here."}
                                </p>

                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch("")}
                                    >
                                        View All Students
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </section>
        </main>
    );


}

export default SearchStudents;
