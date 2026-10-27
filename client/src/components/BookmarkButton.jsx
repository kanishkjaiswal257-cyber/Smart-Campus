import { useCallback, useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/bookmarks";

function BookmarkButton({
    itemType,
    itemId,
    title,
    description = "",
    link = "",
}) {
    const [bookmarkId, setBookmarkId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState("");


    const getToken = () => sessionStorage.getItem("token");

    const checkBookmark = useCallback(async () => {
        try {
            const token = getToken();

            if (!token || !itemId) {
                setBookmarkId(null);
                return;
            }

            const response = await fetch(API_URL, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to check bookmark."
                );
            }

            const existingBookmark = (data.bookmarks || []).find(
                (item) =>
                    item.itemType === itemType &&
                    String(item.itemId) === String(itemId)
            );

            setBookmarkId(existingBookmark?._id || null);
        } catch (err) {
            console.error("Bookmark check error:", err);
        } finally {
            setChecking(false);
        }
    }, [itemId, itemType]);

    useEffect(() => {
        checkBookmark();

        const handleChange = () => {
            checkBookmark();
        };

        window.addEventListener(
            "smartcampus-bookmarks-changed",
            handleChange
        );

        return () => {
            window.removeEventListener(
                "smartcampus-bookmarks-changed",
                handleChange
            );
        };
    }, [checkBookmark]);

    const handleBookmark = async () => {
        try {
            setLoading(true);
            setError("");

            const token = getToken();

            if (!token) {
                throw new Error("Please log in to use bookmarks.");
            }

            if (!itemId || !title?.trim()) {
                throw new Error("Bookmark information is missing.");
            }

            const response = bookmarkId
                ? await fetch(`${API_URL}/${bookmarkId}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                : await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        itemType,
                        itemId: String(itemId),
                        title: title.trim(),
                        description,
                        link,
                    }),
                });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to update bookmark."
                );
            }

            setBookmarkId(
                bookmarkId ? null : data.bookmark?._id || null
            );

            window.dispatchEvent(
                new Event("smartcampus-bookmarks-changed")
            );
        } catch (err) {
            console.error("Bookmark action error:", err);
            setError(err.message || "Unable to update bookmark.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bookmark-button-wrapper">
            <button
                type="button"
                className={`bookmark-toggle-button ${bookmarkId ? "is-saved" : ""
                    }`}
                onClick={handleBookmark}
                disabled={checking || loading || !itemId}
            >
                {checking
                    ? "Checking..."
                    : loading
                        ? "Please wait..."
                        : bookmarkId
                            ? "🔖 Saved · Remove"
                            : "🔖 Add Bookmark"}
            </button>

            {error && (
                <p className="bookmark-button-error">
                    {error}
                </p>
            )}
        </div>
    );


}

export default BookmarkButton;
