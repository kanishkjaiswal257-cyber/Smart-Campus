

import { useEffect, useMemo, useState } from "react";
import StudentLayout from "../../layouts/StudentLayout.jsx";

const API_URL = "http://localhost:5000/api/materials";
const SERVER_URL = "http://localhost:5000";

function StudentMaterials() {
    const [materials, setMaterials] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [semesterFilter, setSemesterFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch actual materials uploaded by faculty
    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                setLoading(true);
                setError("");

                const token = sessionStorage.getItem("token");

                const response = await fetch(API_URL, {
                    headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {},
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load study materials."
                    );
                }

                // Read materials returned by the backend.
                const records = Array.isArray(data)
                    ? data
                    : Array.isArray(data.materials)
                        ? data.materials
                        : Array.isArray(data.data)
                            ? data.data
                            : [];

                setMaterials(records);
            } catch (err) {
                console.error("Student materials error:", err);
                setError(
                    err.message ||
                    "Unable to connect to the server. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchMaterials();
    }, []);

    // Search and semester filtering
    const filteredMaterials = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return materials.filter((material) => {
            const title = material.title || "";
            const subject = material.subject || "";
            const description = material.description || "";

            const matchesSearch =
                !query ||
                title.toLowerCase().includes(query) ||
                subject.toLowerCase().includes(query) ||
                description.toLowerCase().includes(query);

            const matchesSemester =
                semesterFilter === "all" ||
                String(material.semester) === semesterFilter;

            return matchesSearch && matchesSemester;
        });
    }, [materials, searchTerm, semesterFilter]);

    const formatDate = (value) => {
        if (!value) return "Date unavailable";

        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? "Date unavailable"
            : date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
    };

    const getFileType = (material) => {
        const fileName = material.fileName || material.fileUrl || "";
        const extension = fileName.split(".").pop()?.split("?")[0];

        return extension ? extension.toUpperCase() : "FILE";
    };

    const getFileUrl = (material) => {
        if (!material.fileUrl) return "";

        if (
            material.fileUrl.startsWith("http://") ||
            material.fileUrl.startsWith("https://")
        ) {
            return material.fileUrl;
        }

        return `${SERVER_URL}${material.fileUrl.startsWith("/")
            ? material.fileUrl
            : `/${material.fileUrl}`
            }`;
    };

    return (
        <StudentLayout>
            <main className="student-materials-page">
                <style>{`
                    .student-materials-page {
                        padding: 28px;
                        color: #172033;
                    }

                    .student-materials-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 20px;
                        flex-wrap: wrap;
                        margin-bottom: 25px;
                    }

                    .student-materials-header h1 {
                        margin: 0 0 8px;
                        font-size: clamp(25px, 3vw, 32px);
                    }

                    .student-materials-header p {
                        margin: 0;
                        color: #687386;
                        line-height: 1.6;
                    }

                    .student-materials-count {
                        background: #eaf2ff;
                        color: #2458bd;
                        padding: 10px 15px;
                        border-radius: 12px;
                        font-weight: 700;
                        white-space: nowrap;
                    }

                    .student-materials-toolbar {
                        display: flex;
                        gap: 12px;
                        flex-wrap: wrap;
                        margin-bottom: 22px;
                    }

                    .student-materials-toolbar input,
                    .student-materials-toolbar select {
                        box-sizing: border-box;
                        min-height: 46px;
                        padding: 11px 14px;
                        border: 1px solid #dce3ed;
                        border-radius: 10px;
                        background: #fff;
                        color: #172033;
                        font: inherit;
                    }

                    .student-materials-toolbar input {
                        flex: 1;
                        min-width: 220px;
                    }

                    .student-materials-toolbar select {
                        min-width: 160px;
                    }

                    .student-materials-grid {
                        display: grid;
                        grid-template-columns: repeat(
                            auto-fit,
                            minmax(min(100%, 270px), 1fr)
                        );
                        gap: 20px;
                    }

                    .student-material-card {
                        display: flex;
                        flex-direction: column;
                        padding: 21px;
                        background: #fff;
                        border: 1px solid #e5eaf2;
                        border-radius: 16px;
                        box-shadow: 0 5px 18px rgba(28, 43, 68, 0.05);
                        min-width: 0;
                    }

                    .student-material-top {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 10px;
                        flex-wrap: wrap;
                        margin-bottom: 16px;
                    }

                    .student-material-type {
                        display: inline-block;
                        padding: 7px 10px;
                        background: #eaf2ff;
                        color: #2458bd;
                        border-radius: 8px;
                        font-size: 12px;
                        font-weight: 800;
                    }

                    .student-material-semester {
                        color: #697586;
                        font-size: 12px;
                    }

                    .student-material-card h2 {
                        margin: 0 0 10px;
                        font-size: 19px;
                        line-height: 1.45;
                        overflow-wrap: anywhere;
                    }

                    .student-material-description {
                        color: #687386;
                        font-size: 14px;
                        line-height: 1.6;
                        margin: 0 0 15px;
                        overflow-wrap: anywhere;
                    }

                    .student-material-meta {
                        margin-top: auto;
                        padding-top: 12px;
                        border-top: 1px solid #edf0f5;
                    }

                    .student-material-meta p {
                        margin: 8px 0;
                        color: #596579;
                        font-size: 13px;
                        overflow-wrap: anywhere;
                    }

                    .student-material-meta strong {
                        color: #263449;
                    }

                    .student-material-actions {
                        margin-top: 17px;
                    }

                    .student-material-download {
                        display: block;
                        width: 100%;
                        box-sizing: border-box;
                        text-align: center;
                        text-decoration: none;
                        background: #2458bd;
                        color: white;
                        padding: 12px;
                        border-radius: 10px;
                        font-size: 14px;
                        font-weight: 700;
                    }

                    .student-material-download:hover {
                        background: #19479e;
                    }

                    .student-material-message {
                        padding: 18px;
                        margin-bottom: 20px;
                        border-radius: 12px;
                        line-height: 1.6;
                    }

                    .student-material-error {
                        color: #a52525;
                        background: #fff0f0;
                        border: 1px solid #ffd3d3;
                    }

                    .student-material-state {
                        padding: 45px 20px;
                        text-align: center;
                        background: #fff;
                        border: 1px dashed #d5deea;
                        border-radius: 16px;
                    }

                    .student-material-state h2 {
                        margin: 10px 0;
                        font-size: 20px;
                    }

                    .student-material-state p {
                        color: #687386;
                        line-height: 1.6;
                    }

                    @media (max-width: 600px) {
                        .student-materials-page {
                            padding: 16px;
                        }

                        .student-materials-toolbar input,
                        .student-materials-toolbar select {
                            width: 100%;
                            min-width: 0;
                        }
                    }
                `}</style>

                <section className="student-materials-header">
                    <div>
                        <h1>Study Materials 📚</h1>
                        <p>
                            Access notes, presentations, and resources uploaded
                            by your faculty.
                        </p>
                    </div>

                    <div className="student-materials-count">
                        {loading
                            ? "Loading..."
                            : `${filteredMaterials.length} Materials`}
                    </div>
                </section>

                <section className="student-materials-toolbar">
                    <input
                        type="search"
                        placeholder="Search by title, subject, or description..."
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

                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
                            (semester) => (
                                <option key={semester} value={semester}>
                                    Semester {semester}
                                </option>
                            )
                        )}
                    </select>
                </section>

                {error && (
                    <div
                        className="student-materials-message student-material-error"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="student-material-state">
                        <h2>Loading study materials...</h2>
                        <p>Fetching resources from the server.</p>
                    </div>
                ) : filteredMaterials.length === 0 ? (
                    <div className="student-material-state">
                        <div style={{ fontSize: 38 }}>📚</div>

                        <h2>
                            {materials.length === 0
                                ? "No study materials available"
                                : "No matching materials found"}
                        </h2>

                        <p>
                            {materials.length === 0
                                ? "Materials uploaded by faculty will appear here once they are available."
                                : "Try a different search term or semester."}
                        </p>

                        {error && (
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                            >
                                Try Again
                            </button>
                        )}
                    </div>
                ) : (
                    <section className="student-materials-grid">
                        {filteredMaterials.map((material) => {
                            const fileUrl = getFileUrl(material);

                            const facultyName =
                                typeof material.uploadedBy === "object"
                                    ? material.uploadedBy?.name
                                    : material.teacherName ||
                                    material.facultyName;

                            return (
                                <article
                                    className="student-material-card"
                                    key={material._id || material.id}
                                >
                                    <div className="student-material-top">
                                        <span className="student-material-type">
                                            {getFileType(material)}
                                        </span>

                                        {material.semester && (
                                            <span className="student-material-semester">
                                                Semester {material.semester}
                                            </span>
                                        )}
                                    </div>

                                    <h2>{material.title || "Untitled Material"}</h2>

                                    {material.description && (
                                        <p className="student-material-description">
                                            {material.description}
                                        </p>
                                    )}

                                    <div className="student-material-meta">
                                        <p>
                                            <strong>Subject:</strong>{" "}
                                            {material.subject || "Not specified"}
                                        </p>

                                        {facultyName && (
                                            <p>
                                                <strong>Uploaded by:</strong>{" "}
                                                {facultyName}
                                            </p>
                                        )}

                                        <p>
                                            <strong>Upload date:</strong>{" "}
                                            {formatDate(material.createdAt)}
                                        </p>
                                    </div>

                                    <div className="student-material-actions">
                                        {fileUrl ? (
                                            <a
                                                className="student-material-download"
                                                href={fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Open / Download Material ↗
                                            </a>
                                        ) : (
                                            <span
                                                className="student-material-semester"
                                            >
                                                File link is not available.
                                            </span>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}
            </main>
        </StudentLayout>
    );
}

export default StudentMaterials;

