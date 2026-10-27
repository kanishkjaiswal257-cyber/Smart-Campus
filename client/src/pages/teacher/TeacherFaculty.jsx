
import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:5000/api/faculty";

export default function TeacherFaculty() {
    const [faculty, setFaculty] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        const loadFaculty = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(API_URL, {
                    signal: controller.signal,
                });

                const data = await response.json();

                if (!response.ok || data.success === false) {
                    throw new Error(
                        data.message || "Unable to load faculty details."
                    );
                }

                // Only use records returned by the backend.
                setFaculty(Array.isArray(data.faculty) ? data.faculty : []);
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error("Faculty loading error:", err);
                    setError(
                        err.message || "Unable to connect to the faculty API."
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        loadFaculty();

        return () => controller.abort();
    }, []);

    const filteredFaculty = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return faculty;

        return faculty.filter((teacher) =>
            [
                teacher.name,
                teacher.email,
                teacher.department,
                teacher.employeeId,
            ].some((value) => String(value || "").toLowerCase().includes(query))
        );
    }, [faculty, search]);

    return (
        <main className="tf-page">
            <section className="tf-header">
                <div>
                    <p className="tf-eyebrow">SMART CAMPUS</p>
                    <h1>Faculty Directory</h1>
                    <p className="tf-subtitle">
                        View faculty members registered in the college portal.
                    </p>
                </div>

                <div className="tf-count">
                    <span>{faculty.length}</span>
                    <small>Faculty Members</small>
                </div>
            </section>

            <section className="tf-toolbar">
                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name, email or department..."
                    aria-label="Search faculty"
                />

                <button
                    type="button"
                    className="tf-refresh"
                    onClick={() => window.location.reload()}
                >
                    Refresh
                </button>
            </section>

            {loading && (
                <div className="tf-message">
                    <div className="tf-spinner" />
                    <p>Loading faculty members...</p>
                </div>
            )}

            {!loading && error && (
                <div className="tf-message tf-error">
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

            {!loading && !error && filteredFaculty.length === 0 && (
                <div className="tf-message">
                    <div className="tf-empty-icon">👨‍🏫</div>
                    <h3>
                        {search
                            ? "No matching faculty found"
                            : "No faculty members found"}
                    </h3>
                    <p>
                        {search
                            ? "Try searching with another name, email or department."
                            : "Active teacher accounts added through the admin portal will appear here."}
                    </p>
                </div>
            )}

            {!loading && !error && filteredFaculty.length > 0 && (
                <section className="tf-grid">
                    {filteredFaculty.map((teacher) => {
                        const initials = (teacher.name || "T")
                            .trim()
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((part) => part.charAt(0).toUpperCase())
                            .join("");

                        return (
                            <article
                                className="tf-card"
                                key={teacher._id || teacher.email}
                            >
                                <div className="tf-card-top">
                                    <div className="tf-avatar">
                                        {initials || "T"}
                                    </div>

                                    <span className="tf-badge">Faculty</span>
                                </div>

                                <h2>{teacher.name || "Unnamed Teacher"}</h2>

                                <p className="tf-department">
                                    {teacher.department || "Department not specified"}
                                </p>

                                <div className="tf-divider" />

                                <div className="tf-detail">
                                    <span className="tf-detail-icon">✉</span>
                                    <a href={`mailto:${teacher.email || ""}`}>
                                        {teacher.email || "Email not provided"}
                                    </a>
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}

            <style>{`
        .tf-page {
          padding: 28px;
          color: #172033;
          font-family: inherit;
        }

        .tf-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .tf-eyebrow {
          margin: 0 0 8px;
          color: #6366f1;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.8px;
        }

        .tf-header h1 {
          margin: 0;
          font-size: clamp(25px, 3vw, 34px);
          font-weight: 800;
        }

        .tf-subtitle {
          margin: 9px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .tf-count {
          min-width: 125px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: #ffffff;
          text-align: center;
        }

        .tf-count span {
          display: block;
          color: #4f46e5;
          font-size: 27px;
          font-weight: 800;
        }

        .tf-count small {
          color: #64748b;
          font-size: 12px;
        }

        .tf-toolbar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .tf-toolbar input {
          flex: 1;
          min-width: 0;
          padding: 13px 16px;
          border: 1px solid #dbe2ea;
          border-radius: 12px;
          outline: none;
          background: #ffffff;
          color: #172033;
          font: inherit;
        }

        .tf-toolbar input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }

        .tf-refresh,
        .tf-message button {
          padding: 12px 18px;
          border: none;
          border-radius: 10px;
          background: #4f46e5;
          color: #ffffff;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .tf-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(245px, 1fr));
          gap: 20px;
        }

        .tf-card {
          min-width: 0;
          padding: 22px;
          border: 1px solid #e5eaf1;
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 5px 20px rgba(15, 23, 42, 0.04);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .tf-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.09);
        }

        .tf-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }

        .tf-avatar {
          display: grid;
          width: 58px;
          height: 58px;
          flex-shrink: 0;
          place-items: center;
          border-radius: 17px;
          background: linear-gradient(135deg, #eef2ff, #ddd6fe);
          color: #4338ca;
          font-size: 21px;
          font-weight: 800;
        }

        .tf-badge {
          padding: 6px 10px;
          border-radius: 20px;
          background: #ecfdf5;
          color: #047857;
          font-size: 11px;
          font-weight: 800;
        }

        .tf-card h2 {
          margin: 0;
          overflow-wrap: anywhere;
          color: #172033;
          font-size: 18px;
          font-weight: 750;
        }

        .tf-department {
          margin: 8px 0 0;
          color: #6366f1;
          font-size: 13px;
          font-weight: 600;
        }

        .tf-divider {
          height: 1px;
          margin: 20px 0;
          background: #edf0f5;
        }

        .tf-detail {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: #64748b;
          font-size: 13px;
        }

        .tf-detail-icon {
          color: #6366f1;
          font-size: 16px;
        }

        .tf-detail a {
          overflow-wrap: anywhere;
          color: #475569;
          text-decoration: none;
        }

        .tf-detail a:hover {
          color: #4f46e5;
        }

        .tf-message {
          padding: 45px 20px;
          border: 1px dashed #cbd5e1;
          border-radius: 16px;
          background: #ffffff;
          text-align: center;
        }

        .tf-message h3 {
          margin: 10px 0;
          color: #172033;
        }

        .tf-message p {
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .tf-error {
          border-color: #fecaca;
          background: #fffafa;
        }

        .tf-empty-icon {
          font-size: 36px;
        }

        .tf-spinner {
          width: 30px;
          height: 30px;
          margin: 0 auto;
          border: 3px solid #e0e7ff;
          border-top-color: #4f46e5;
          border-radius: 50%;
          animation: tf-spin 0.8s linear infinite;
        }

        @keyframes tf-spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .tf-page {
            padding: 18px;
          }

          .tf-header {
            align-items: flex-start;
          }

          .tf-count {
            min-width: 85px;
            padding: 12px 8px;
          }

          .tf-toolbar {
            flex-direction: column;
          }

          .tf-refresh {
            align-self: flex-start;
          }

          .tf-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </main>
    );
}

