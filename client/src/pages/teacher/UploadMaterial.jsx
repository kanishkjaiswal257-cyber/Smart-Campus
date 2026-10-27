import { useState } from "react";

function UploadMaterial() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [subject, setSubject] = useState("");
    const [semester, setSemester] = useState("");
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setMessageType("");

        if (!title.trim() || !subject.trim() || !semester || !file) {
            setMessage("Please complete all required fields and select a file.");
            setMessageType("error");
            return;
        }

        const allowedExtensions = /\.(pdf|doc|docx|ppt|pptx)$/i;
        if (!allowedExtensions.test(file.name)) {
            setMessage("Choose a PDF, DOC, DOCX, PPT, or PPTX file.");
            setMessageType("error");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setMessage("The file must be 10 MB or smaller.");
            setMessageType("error");
            return;
        }

        const token = sessionStorage.getItem("token");
        if (!token) {
            setMessage("Your session has expired. Please log in again.");
            setMessageType("error");
            return;
        }

        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("description", description.trim());
        formData.append("subject", subject.trim());
        formData.append("semester", semester);
        formData.append("file", file);

        setLoading(true);

        try {
            const response = await fetch("http://localhost:5000/api/materials", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Upload failed. Please try again.");
            }

            setMessage(data.message || "Study material uploaded successfully!");
            setMessageType("success");
            setTitle("");
            setDescription("");
            setSubject("");
            setSemester("");
            setFile(null);

            const fileInput = document.getElementById("material-file");
            if (fileInput) fileInput.value = "";
        } catch (error) {
            setMessage(
                error.message || "Unable to connect to the server. Please try again."
            );
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="upload-page">
            <section className="upload-card">
                <div className="upload-page-heading">
                    <span className="upload-heading-icon" aria-hidden="true">📚</span>
                    <div>
                        <p className="upload-eyebrow">TEACHER RESOURCES</p>
                        <h1>Upload Study Material</h1>
                        <p className="upload-subtitle">
                            Share study resources with your students.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="upload-form">
                    <div className="upload-field">
                        <label htmlFor="material-title">Material Title <span>*</span></label>
                        <input
                            id="material-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Introduction to Java"
                            maxLength={120}
                            required
                        />
                    </div>

                    <div className="upload-field">
                        <label htmlFor="material-subject">Subject <span>*</span></label>
                        <input
                            id="material-subject"
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g. Programming in Java"
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="upload-field">
                        <label htmlFor="material-semester">Semester <span>*</span></label>
                        <select
                            id="material-semester"
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            required
                        >
                            <option value="">Select semester</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                                <option key={item} value={item}>
                                    Semester {item}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="upload-field">
                        <label htmlFor="material-description">Description <span className="optional-label">(optional)</span></label>
                        <textarea
                            id="material-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a short description of this resource"
                            rows={3}
                            maxLength={500}
                        />
                    </div>

                    <div className="upload-field">
                        <label htmlFor="material-file">Choose a file <span>*</span></label>
                        <label className="upload-file-picker" htmlFor="material-file">
                            <span aria-hidden="true">📎</span>
                            <span>{file ? file.name : "Choose PDF, DOC, DOCX, PPT, or PPTX"}</span>
                            <span className="upload-file-button">Browse</span>
                        </label>
                        <input
                            id="material-file"
                            className="upload-file-input"
                            type="file"
                            accept=".pdf,.doc,.docx,.ppt,.pptx"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            required
                        />
                        <small className="upload-hint">Maximum file size: 10 MB.</small>
                    </div>

                    {message && (
                        <div className={`upload-message ${messageType}`} role="status">
                            {message}
                        </div>
                    )}

                    <button type="submit" className="upload-submit-button" disabled={loading}>
                        {loading ? "Uploading..." : "⬆ Upload Material"}
                    </button>
                </form>
            </section>
        </main>
    );
}

export default UploadMaterial;
