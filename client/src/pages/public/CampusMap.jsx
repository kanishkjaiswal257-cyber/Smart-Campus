import { useEffect, useState } from "react";

const DEFAULT_LOCATION =
    "Allenhouse Business School, Kanpur, Uttar Pradesh, India";

const NOMINATIM_API =
    "https://nominatim.openstreetmap.org/search";

function CampusMap() {
    const [searchInput, setSearchInput] = useState(DEFAULT_LOCATION);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Find a location using OpenStreetMap's geocoding service.
    const findLocation = async (query) => {
        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            setError("Please enter a campus, place, or city name.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams({
                format: "jsonv2",
                q: trimmedQuery,
                limit: "1",
            });

            const response = await fetch(
                `${NOMINATIM_API}?${params.toString()}`
            );

            if (!response.ok) {
                throw new Error(
                    "The map service is temporarily unavailable. Please try again."
                );
            }

            const results = await response.json();

            if (!Array.isArray(results) || results.length === 0) {
                throw new Error(
                    "Location not found. Try a different name or enter a complete address."
                );
            }

            const result = results[0];

            setLocation({
                name: result.display_name,
                latitude: Number(result.lat),
                longitude: Number(result.lon),
            });
        } catch (err) {
            console.error("Campus map error:", err);
            setError(
                err.message ||
                "Unable to find this location. Check your internet connection."
            );
        } finally {
            setLoading(false);
        }
    };

    // Load the college-area map when the page opens.
    useEffect(() => {
        findLocation(DEFAULT_LOCATION);
    }, []);

    const handleSubmit = (event) => {
        event.preventDefault();
        findLocation(searchInput);
    };

    // Build an interactive OpenStreetMap embed around the selected location.
    const mapUrl = location
        ? (() => {
            const lat = location.latitude;
            const lon = location.longitude;

            const west = lon - 0.015;
            const south = lat - 0.01;
            const east = lon + 0.015;
            const north = lat + 0.01;

            const params = new URLSearchParams({
                bbox: `${west},${south},${east},${north}`,
                layer: "mapnik",
                marker: `${lat},${lon}`,
            });

            return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
        })()
        : "";

    const openMapUrl = location
        ? `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=16/${location.latitude}/${location.longitude}`
        : "#";

    const directionsUrl = location
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            location.name
        )}`
        : "#";

    return (
        <main className="campus-map-page">
            {/* Page Header */}
            <section className="campus-map-hero">
                <div className="campus-map-hero-content">
                    <span className="campus-map-eyebrow">
                        SMART CAMPUS NAVIGATION
                    </span>

                    <h1>
                        Explore Your <span>Campus</span> 🗺️
                    </h1>

                    <p>
                        Find your college, discover nearby places, and
                        get directions to your destination.
                    </p>
                </div>

                <div className="campus-map-hero-icon">📍</div>
            </section>

            {/* Location Search */}
            <section className="campus-map-search-card">
                <div className="campus-map-section-heading">
                    <div className="campus-map-heading-icon">🔎</div>

                    <div>
                        <h2>Find a Location</h2>
                        <p>
                            Search for a campus, building, landmark, or city.
                        </p>
                    </div>
                </div>

                <form
                    className="campus-map-search-form"
                    onSubmit={handleSubmit}
                >
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(event) =>
                            setSearchInput(event.target.value)
                        }
                        placeholder="Enter college name, address, or city..."
                        aria-label="Search for a location"
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Searching..." : "Search Location"}
                    </button>
                </form>

                {error && (
                    <div className="campus-map-error" role="alert">
                        <span>⚠️</span>
                        <p>{error}</p>
                    </div>
                )}
            </section>

            {/* Map */}
            <section className="campus-map-main-card">
                <div className="campus-map-toolbar">
                    <div>
                        <span className="campus-map-live-dot"></span>
                        <strong>Interactive Map</strong>
                    </div>

                    {location && (
                        <span className="campus-map-status">
                            Location found
                        </span>
                    )}
                </div>

                {loading && !location ? (
                    <div className="campus-map-loading">
                        <div className="campus-map-spinner"></div>
                        <h3>Finding your location...</h3>
                        <p>Please wait while the map loads.</p>
                    </div>
                ) : location ? (
                    <iframe
                        key={`${location.latitude}-${location.longitude}`}
                        title={`Map showing ${location.name}`}
                        src={mapUrl}
                        className="campus-map-iframe"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                ) : (
                    <div className="campus-map-empty">
                        <span>🗺️</span>
                        <h3>Search for a location</h3>
                        <p>
                            Enter a place name above to display the map.
                        </p>
                    </div>
                )}

                {location && (
                    <div className="campus-map-location-details">
                        <div className="campus-map-location-icon">📍</div>

                        <div className="campus-map-location-text">
                            <span>SELECTED LOCATION</span>
                            <h3>{location.name}</h3>

                            <p>
                                Latitude: {location.latitude.toFixed(5)}
                                {" • "}
                                Longitude: {location.longitude.toFixed(5)}
                            </p>
                        </div>
                    </div>
                )}

                <div className="campus-map-actions">
                    <a
                        className="campus-map-action primary"
                        href={directionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => {
                            if (!location) event.preventDefault();
                        }}
                    >
                        🧭 Get Directions
                    </a>

                    <a
                        className="campus-map-action secondary"
                        href={openMapUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => {
                            if (!location) event.preventDefault();
                        }}
                    >
                        ↗ Open Full Map
                    </a>
                </div>

                <p className="campus-map-attribution">
                    Map data © OpenStreetMap contributors
                </p>
            </section>

            {/* Quick Search Cards */}
            <section className="campus-map-tips">
                <div>
                    <span>💡</span>
                    <div>
                        <h3>Search tip</h3>
                        <p>
                            Include the city or state with a college name
                            to help find the correct campus.
                        </p>
                    </div>
                </div>

                <div>
                    <span>🧭</span>
                    <div>
                        <h3>Need directions?</h3>
                        <p>
                            Search for your destination and select Get
                            Directions to open the route in Google Maps.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default CampusMap;