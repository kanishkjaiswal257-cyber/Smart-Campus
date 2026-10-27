
import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:5000/api/notices";

export default function TeacherNotices() {
    const [notices, setNotices] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadNotices = async (signal) => {
        try {
            setLoading(true);
            setError("");

            const token = sessionStorage.getItem("token");

            const response = await fetch(API_URL, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                signal,
            });

            const data = await response.json();

            if (!response.ok || data.success === false) {
                throw new Error(
                    data.message || "Unable to load college notices."
                );
            }

            // Support common API response formats.
            const records = Array.isArray(data)
                ? data
                : Array.isArray(data.notices)
                    ? data.notices
                    : Array.isArray(data.data)
                        ? data.data
                        : [];

            // Render only actual API records; no demo data.
            setNotices(records);
        } catch (err) {
            if (err.name !== "AbortError") {
                console.error("Notices loading error:", err);
                setError(
                    err.message || "Unable to connect to the notices API."
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

        loadNotices(controller.signal);

        return () => controller.abort();
    }, []);

    const filteredNotices = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return notices;

        return notices.filter((notice) =>
            [
                notice.title,
                notice.description,
                notice.content,
                notice.category,
                notice.status,
            ].some((value) =>
                String(value || "").toLowerCase().includes(query)
            )
        );
    }, [notices, search]);

    const formatDate = (value) => {
        if (!value) return "Date not available";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Date not available";
        }

        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <main className="tn-page">
            <header className="tn-header">
                <div>
                    <p className="tn-eyebrow">SMART CAMPUS</p>
                    <h1>College Notices</h1>
                    <p className="tn-subtitle">
                        View important announcements and college updates.
                    </p>
                </div>

                <div className="tn-count">
                    <span>{notices.length}</span>
                    <small>Total Notices</small>
                </div>
            </header>

            <section className="tn-toolbar">
                <input
                    type="search"
                    placeholder="Search notices by title or content..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Search notices"
                />

                <button
                    type="button"
                    onClick={() => loadNotices()}
                    disabled={loading}
                >
                    {loading ? "Loading..." : "Refresh"}
                </button>
            </section>

            {loading && (
                <div className="tn-message">
                    <div className="tn-spinner" />
                    <p>Loading notices from the database...</p>
                </div>
            )}

            {!loading && error && (
                <div className="tn-message tn-error">
                    <h3>Unable to load notices</h3>
                    <p>{error}</p>
                    <button type="button" onClick={() => loadNotices()}>
                        Try Again
                    </button>
                </div>
            )}

            {!loading && !error && filteredNotices.length === 0 && (
                <div className="tn-message">
                    <div className="tn-empty-icon">📢</div>
                    <h3>
                        {search ? "No matching notices found" : "No notices found"}
                    </h3>
                    <p>
                        {search
                            ? "Try another search term."
                            : "Notices retrieved from the database will appear here."}
                    </p>
                </div>
            )}

            {!loading && !error && filteredNotices.length > 0 && (
                <section className="tn-grid">
                    {filteredNotices.map((notice, index) => (
                        <article
                            className="tn-card"
                            key={notice._id || notice.id || `${notice.title}-${index}`}
                        >
                            <div className="tn-card-top">
                                <span className="tn-icon">📢</span>

                                <span
                                    className={`tn-status ${String(notice.status || "").toLowerCase() === "published"
                                        ? "tn-published"
                                        : "tn-other-status"
                                        }`}
                                >
                                    {notice.status || "Notice"}
                                </span>
                            </div>

                            <h2>{notice.title || "Untitled Notice"}</h2>

                            <p className="tn-description">
                                {notice.description ||
                                    notice.content ||
                                    notice.message ||
                                    "No description available."}
                            </p>

                            <div className="tn-divider" />

                            <div className="tn-meta">
                                <span>📅</span>
                                <span>
                                    {formatDate(
                                        notice.publishedAt ||
                                        notice.createdAt ||
                                        notice.date
                                    )}
                                </span>
                            </div>

                            {notice.category && (
                                <span className="tn-category">
                                    {notice.category}
                                </span>
                            )}
                        </article>
                    ))}
                </section>
            )}

            <style>{`
        .tn-page {
          padding: 28px;
          color: #172033;
          font-family: inherit;
        }

        .tn-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 28px;
        }

        .tn-eyebrow {
          margin: 0 0 8px;
          color: #4f46e5;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.8px;
        }

        .tn-header h1 {
          margin: 0;
          font-size: clamp(25px, 3vw, 34px);
          font-weight: 800;
        }

        .tn-subtitle {
          margin-top: 9px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .tn-count {
          min-width: 125px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: #fff;
          text-align: center;
        }

        .tn-count span {
          display: block;
          color: #4f46e5;
          font-size: 27px;
          font-weight: 800;
        }

        .tn-count small {
          color: #64748b;
          font-size: 12px;
        }

        .tn-toolbar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .tn-toolbar input {
          flex: 1;
          min-width: 0;
          padding: 13px 16px;
          border: 1px solid #dbe2ea;
          border-radius: 12px;
          outline: none;
          background: #fff;
          color: #172033;
          font: inherit;
        }

        .tn-toolbar input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, .12);
        }

        .tn-toolbar button,
        .tn-message button {
          padding: 12px 18px;
          border: none;
          border-radius: 10px;
          background: #4f46e5;
          color: #fff;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .tn-toolbar button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .tn-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }

        .tn-card {
          min-width: 0;
          padding: 22px;
          border: 1px solid #e5eaf1;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 5px 20px rgba(15, 23, 42, .04);
          transition: transform .2s, box-shadow .2s;
        }

        .tn-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(15, 23, 42, .09);
        }

        .tn-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }

        .tn-icon {
          display: grid;
          width: 50px;
          height: 50px;
          place-items: center;
          border-radius: 15px;
          background: #eef2ff;
          font-size: 24px;
        }

        .tn-status {
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
        }

        .tn-published {
          background: #ecfdf5;
          color: #047857;
        }

        .tn-other-status {
          background: #f1f5f9;
          color: #475569;
        }

        .tn-card h2 {
          margin: 0;
          color: #172033;
          font-size: 18px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .tn-description {
          margin: 12px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.7;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .tn-divider {
          height: 1px;
          margin: 20px 0 14px;
          background: #edf0f5;
        }

        .tn-meta {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #64748b;
          font-size: 13px;
        }

        .tn-category {
          display: inline-block;
          margin-top: 13px;
          padding: 5px 9px;
          border-radius: 8px;
          background: #f5f3ff;
          color: #6d28d9;
          font-size: 11px;
          font-weight: 700;
        }

        .tn-message {
          padding: 45px 20px;
          border: 1px dashed #cbd5e1;
          border-radius: 16px;
          background: #fff;
          text-align: center;
        }

        .tn-message h3 {
          margin: 10px 0;
          color: #172033;
        }

        .tn-message p {
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .tn-error {
          border-color: #fecaca;
          background: #fffafa;
        }

        .tn-empty-icon {
          font-size: 36px;
        }

        .tn-spinner {
          width: 30px;
          height: 30px;
          margin: 0 auto;
          border: 3px solid #e0e7ff;
          border-top-color: #4f46e5;
          border-radius: 50%;
          animation: tn-spin .8s linear infinite;
        }

        @keyframes tn-spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .tn-page {
            padding: 18px;
          }

          .tn-header {
            align-items: flex-start;
          }

          .tn-count {
            min-width: 85px;
            padding: 12px 8px;
          }

          .tn-toolbar {
            flex-direction: column;
          }

          .tn-toolbar button {
            align-self: flex-start;
          }

          .tn-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </main>
    );
}

