import { useEffect, useMemo, useState } from "react";

function MyMaterials() {
    const [materials, setMaterials] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [semesterFilter, setSemesterFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchMaterials = async () => {
            const token = sessionStorage.getItem("token");

            if (!token) {
                setError("Your session has expired. Please log in again.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch("http://localhost:5000/api/materials/my", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Unable to load your materials.");
                }

                setMaterials(Array.isArray(data.materials) ? data.materials : []);
            } catch (err) {
                setError(err.message || "Could not connect to the server.");
            } finally {
                setLoading(false);
            }
        };

        fetchMaterials();
    }, []);

    const filteredMaterials = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return materials.filter((material) => {
            const matchesSearch =
                !query ||
                material.title?.toLowerCase().includes(query) ||
                material.subject?.toLowerCase().includes(query);

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
            : date.toLocaleDateString();
    };

    const getFileType = (material) => {
        const fileName = material.fileName || material.fileUrl || "";
        const extension = fileName.split(".").pop()?.toUpperCase();
        return ["PDF", "DOC", "DOCX", "PPT", "PPTX"].includes(extension)
            ? extension
            : "FILE";
    };

    const handleDelete = async (material) => {
        const confirmed = window.confirm(
            `Delete "${material.title}"? This action cannot be undone.`
        );
        if (!confirmed) return;

        const token = sessionStorage.getItem("token");
        if (!token) {
            setError("Your session has expired. Please log in again.");
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:5000/api/materials/${material._id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Unable to delete this material.");
            }

            setMaterials((current) =>
                current.filter((item) => item._id !== material._id)
            );
            setError("");
        } catch (err) {
            setError(err.message || "Unable to delete this material.");
        }
    };

    return (
        <main className="my-materials-page">
            <section className="my-materials-header">
                <div>
                    <p className="my-materials-eyebrow">TEACHER RESOURCES</p>
                    <h1>My Study Materials</h1>
                    <p>View, search, download, and manage the resources you uploaded.</p>
                </div>
                <a className="my-materials-upload-link" href="/teacher/upload-material">
                    + Upload Material
                </a>
            </section>

            <section className="my-materials-toolbar">
                <input
                    type="search"
                    aria-label="Search materials"
                    placeholder="Search by title or subject..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                />

                <select
                    aria-label="Filter by semester"
                    value={semesterFilter}
                    onChange={(event) => setSemesterFilter(event.target.value)}
                >
                    <option value="all">All semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                        <option key={semester} value={semester}>
                            Semester {semester}
                        </option>
                    ))}
                </select>
            </section>

            {error && <div className="my-materials-message error" role="alert">{error}</div>}

            {loading ? (
                <div className="my-materials-state">Loading your materials...</div>
            ) : filteredMaterials.length === 0 ? (
                <div className="my-materials-state">
                    <span className="my-materials-empty-icon" aria-hidden="true">📚</span>
                    <h2>{materials.length === 0 ? "No materials uploaded yet" : "No matching materials"}</h2>
                    <p>
                        {materials.length === 0
                            ? "Materials you upload will appear here."
                            : "Try another title, subject, or semester filter."}
                    </p>
                    {materials.length === 0 && (
                        <a className="my-materials-upload-link" href="/teacher/upload-material">
                            Upload your first material
                        </a>
                    )}
                </div>
            ) : (
                <>
                    <p className="my-materials-count">
                        Showing {filteredMaterials.length} of {materials.length} material(s)
                    </p>
                    <section className="my-materials-grid">
                        {filteredMaterials.map((material) => (
                            <article className="my-material-card" key={material._id}>
                                <div className="my-material-card-top">
                                    <span className={`my-material-type ${getFileType(material).toLowerCase()}`}>
                                        {getFileType(material)}
                                    </span>
                                    <span className="my-material-semester">
                                        Semester {material.semester}
                                    </span>
                                </div>

                                <h2>{material.title}</h2>
                                {material.description && <p className="my-material-description">{material.description}</p>}

                                <div className="my-material-meta">
                                    <p><strong>Subject:</strong> {material.subject}</p>
                                    <p><strong>Uploaded:</strong> {formatDate(material.createdAt)}</p>
                                    {Number.isFinite(material.fileSize) && (
                                        <p><strong>Size:</strong> {(material.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                                    )}
                                </div>

                                <div className="my-material-actions">
                                    {material.fileUrl ? (
                                        <a
                                            className="my-material-download"
                                            href={`http://localhost:5000${material.fileUrl}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            download={material.fileName || true}
                                        >
                                            ↧ Open / Download
                                        </a>
                                    ) : (
                                        <span className="my-material-unavailable">File unavailable</span>
                                    )}
                                    <button
                                        type="button"
                                        className="my-material-delete"
                                        onClick={() => handleDelete(material)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </article>
                        ))}
                    </section>
                </>
            )}
        </main>
    );
}

export default MyMaterials;
