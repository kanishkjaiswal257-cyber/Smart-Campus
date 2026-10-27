
import { useState } from "react";
import { useAuth } from "../context/AuthContext";


function StudentSearch() {
    const { user } = useAuth();

    const [search, setSearch] = useState("");
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searched, setSearched] = useState(false);

    const handleSearch = async (event) => {
        event.preventDefault();

        if (search.trim().length < 2) {
            setError("Please enter at least two characters.");
            setStudents([]);
            setSearched(false);
            return;
        }

        const token = sessionStorage.getItem("token");

        if (!token) {
            setError("Your session has expired. Please log in again.");
            return;
        }

        setLoading(true);
        setError("");
        setSearched(true);

        try {
            const response = await fetch(
                `http://localhost:5000/api/users/search/students?search=${encodeURIComponent(search.trim())}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to search students.");
            }

            setStudents(data.students || []);
        } catch (err) {
            setError(err.message || "Unable to connect to the server.");
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    if (user?.role !== "teacher") {
        return null;
    }

    return (
        <section className="student-search">
            <div className="student-search-heading">
                <div>
                    <h2>Student Directory</h2>
                    <p>Find students using their name or CRN.</p>
                </div>
                <span className="student-search-icon">⌕</span>
            </div>

            <form className="student-search-form" onSubmit={handleSearch}>
                <input
                    type="search"
                    placeholder="Enter student name or CRN..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Search students by name or CRN"
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Searching..." : "Search"}
                </button>
            </form>

            {error && <p className="student-search-error">{error}</p>}

            {searched && !loading && !error && (
                <p className="student-search-count">
                    {students.length} student{students.length !== 1 ? "s" : ""} found
                </p>
            )}

            {searched && !loading && !error && students.length === 0 && (
                <div className="student-search-empty">
                    No matching students found. Try another name or CRN.
                </div>
            )}

            {students.length > 0 && (
                <div className="student-search-results">
                    {students.map((student) => (
                        <article
                            className="student-search-card"
                            key={student._id}
                        >
                            <div className="student-search-avatar">
                                {student.name?.charAt(0).toUpperCase() || "S"}
                            </div>

                            <div className="student-search-details">
                                <h3>{student.name}</h3>
                                <p>{student.email}</p>

                                <div className="student-search-meta">
                                    <span>CRN: {student.crn || "Not available"}</span>
                                    <span>Course: {student.course || "Not available"}</span>
                                    <span>
                                        Semester: {student.semester ?? "Not available"}
                                    </span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

export default StudentSearch;

