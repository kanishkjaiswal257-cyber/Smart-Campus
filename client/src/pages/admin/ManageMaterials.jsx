
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout.jsx";

const API_URL = "http://localhost:5000/api/materials";

function getToken() {
    return (
        sessionStorage.getItem("token") ||
        localStorage.getItem("token")
    );
}

function getFileUrl(fileUrl) {
    if (!fileUrl) return "";

    // Support both absolute URLs and backend-relative file paths.
    if (/^https?:\/\//i.test(fileUrl)) {
        return fileUrl;
    }

    return `http://localhost:5000${fileUrl.startsWith("/") ? "" : "/"
        }${fileUrl} `;
}

function getFileType(material) {
    const fileName = material.fileName || material.fileUrl || "";
    const extension = fileName.split(".").pop()?.toUpperCase();

    return ["PDF", "DOC", "DOCX", "PPT", "PPTX"].includes(extension)
        ? extension
        : "FILE";
}

function formatDate(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? "Date unavailable"
        : date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
}

function ManageMaterials() {
    const [materials, setMaterials] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [semesterFilter, setSemesterFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch actual study materials from the backend.
    const fetchMaterials = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const token = getToken();

            if (!token) {
                throw new Error(
                    "Your session has expired. Please log in again."
                );
            }

            const response = await fetch(API_URL, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token} `,
                },
            });

            const contentType =
                response.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {
                throw new Error(
                    "Invalid server response. Check the backend server."
                );
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load study materials."
                );
            }

            const records = Array.isArray(data)
                ? data
                : Array.isArray(data.materials)
                    ? data.materials
                    : [];

            // Do not use hardcoded or demo material records.
            setMaterials(records);
        } catch (err) {
            console.error("Manage materials error:", err);
            setError(
                err.message || "Unable to connect to the backend."
            );
            setMaterials([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMaterials();
    }, [fetchMaterials]);

    // Search actual database records.
    const filteredMaterials = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return materials.filter((material) => {
            const uploader =
                typeof material.uploadedBy === "object"
                    ? material.uploadedBy?.name
                    : material.uploadedByName;

            const matchesSearch =
                !query ||
                material.title?.toLowerCase().includes(query) ||
                material.subject?.toLowerCase().includes(query) ||
                material.description?.toLowerCase().includes(query) ||
                uploader?.toLowerCase().includes(query);

            const matchesSemester =
                semesterFilter === "all" ||
                String(material.semester) === semesterFilter;

            return matchesSearch && matchesSemester;
        });
    }, [materials, searchTerm, semesterFilter]);

    return (
        <AdminLayout>
            <main className="admin-materials-page">


                <section className="materials-header">
                    <div>
                        <p className="materials-eyebrow">
                            ACADEMIC RESOURCES
                        </p>

                        <h1>Manage Study Materials 📚</h1>

                        <p>
                            View study materials uploaded by faculty
                            and access their files.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="materials-refresh"
                        onClick={fetchMaterials}
                        disabled={loading}
                    >
                        ↻ Refresh
                    </button>
                </section>

                <section className="materials-stats">
                    <article className="materials-stat">
                        <p>Total Materials</p>
                        <h2>{loading ? "…" : materials.length}</h2>
                    </article>

                    <article className="materials-stat">
                        <p>Matching Materials</p>
                        <h2>{loading ? "…" : filteredMaterials.length}</h2>
                    </article>

                    <article className="materials-stat">
                        <p>Semesters Covered</p>
                        <h2>
                            {loading
                                ? "…"
                                : new Set(
                                    materials
                                        .map((item) => item.semester)
                                        .filter(
                                            (value) =>
                                                value !== undefined &&
                                                value !== null &&
                                                value !== ""
                                        )
                                ).size}
                        </h2>
                    </article>
                </section>

                {error && (
                    <div className="materials-message materials-error" role="alert">
                        <strong>Unable to load study materials.</strong>
                        <p>{error}</p>

                        <button
                            type="button"
                            className="materials-refresh"
                            onClick={fetchMaterials}
                            disabled={loading}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                <section className="materials-toolbar">
                    <input
                        type="search"
                        placeholder="Search title, subject, description..."
                        aria-label="Search study materials"
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(event.target.value)
                        }
                    />

                    <select
                        aria-label="Filter by semester"
                        value={semesterFilter}
                        onChange={(event) =>
                            setSemesterFilter(event.target.value)
                        }
                    >
                        <option value="all">All Semesters</option>

                        {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                            <option key={semester} value={String(semester)}>
                                Semester {semester}
                            </option>
                        ))}
                    </select>
                </section>

                {!loading && !error && (
                    <p className="materials-count">
                        Showing {filteredMaterials.length} of{" "}
                        {materials.length} database record(s).
                    </p>
                )}

                <section className="materials-table-wrap">
                    {loading ? (
                        <div className="materials-state">
                            Loading study materials...
                        </div>
                    ) : error ? (
                        <div className="materials-state">
                            <h2>Materials could not be loaded</h2>
                            <p>Check the error message above and try again.</p>
                        </div>
                    ) : filteredMaterials.length === 0 ? (
                        <div className="materials-state">
                            <h2>
                                {materials.length === 0
                                    ? "No study materials found"
                                    : "No matching materials"}
                            </h2>

                            <p>
                                {materials.length === 0
                                    ? "Faculty-uploaded materials will appear here when available in the database."
                                    : "Try another search term or semester filter."}
                            </p>

                            {materials.length === 0 && (
                                <Link to="/admin/dashboard">
                                    Return to Admin Dashboard
                                </Link>
                            )}
                        </div>
                    ) : (
                        <table className="materials-table">
                            <thead>
                                <tr>
                                    <th>Study Material</th>
                                    <th>Subject</th>
                                    <th>Semester</th>
                                    <th>File Type</th>
                                    <th>Uploaded Date</th>
                                    <th>File</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredMaterials.map((material) => {
                                    const fileUrl = getFileUrl(material.fileUrl);

                                    return (
                                        <tr key={material._id}>
                                            <td>
                                                <span className="material-title">
                                                    {material.title || "Untitled Material"}
                                                </span>

                                                {material.description && (
                                                    <small className="material-description">
                                                        {material.description}
                                                    </small>
                                                )}
                                            </td>

                                            <td>{material.subject || "—"}</td>

                                            <td>
                                                {material.semester
                                                    ? `Semester ${material.semester} `
                                                    : "—"}
                                            </td>

                                            <td>
                                                <span className="material-type">
                                                    {getFileType(material)}
                                                </span>
                                            </td>

                                            <td>
                                                {formatDate(material.createdAt)}
                                            </td>

                                            <td>
                                                {fileUrl ? (
                                                    <a
                                                        className="material-download"
                                                        href={fileUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        ↗ Open / Download
                                                    </a>
                                                ) : (
                                                    <span className="material-unavailable">
                                                        File unavailable
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </section>
            </main>
        </AdminLayout>
    );
}

export default ManageMaterials;