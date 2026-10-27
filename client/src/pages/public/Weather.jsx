import { useState } from "react";


const GEOCODING_API =
    "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_API =
    "https://api.open-meteo.com/v1/forecast";

function getWeatherDescription(code) {
    const weatherConditions = {
        0: { text: "Clear Sky", icon: "☀️" },
        1: { text: "Mainly Clear", icon: "🌤️" },
        2: { text: "Partly Cloudy", icon: "⛅" },
        3: { text: "Overcast", icon: "☁️" },
        45: { text: "Foggy", icon: "🌫️" },
        48: { text: "Foggy", icon: "🌫️" },
        51: { text: "Light Drizzle", icon: "🌦️" },
        53: { text: "Drizzle", icon: "🌦️" },
        55: { text: "Heavy Drizzle", icon: "🌧️" },
        56: { text: "Freezing Drizzle", icon: "🌨️" },
        57: { text: "Freezing Drizzle", icon: "🌨️" },
        61: { text: "Light Rain", icon: "🌧️" },
        63: { text: "Rain", icon: "🌧️" },
        65: { text: "Heavy Rain", icon: "🌧️" },
        66: { text: "Freezing Rain", icon: "🌨️" },
        67: { text: "Heavy Freezing Rain", icon: "🌨️" },
        71: { text: "Light Snow", icon: "🌨️" },
        73: { text: "Snow", icon: "❄️" },
        75: { text: "Heavy Snow", icon: "❄️" },
        77: { text: "Snow Grains", icon: "❄️" },
        80: { text: "Rain Showers", icon: "🌦️" },
        81: { text: "Rain Showers", icon: "🌧️" },
        82: { text: "Heavy Rain Showers", icon: "🌧️" },
        85: { text: "Snow Showers", icon: "🌨️" },
        86: { text: "Heavy Snow Showers", icon: "❄️" },
        95: { text: "Thunderstorm", icon: "⛈️" },
        96: { text: "Thunderstorm with Hail", icon: "⛈️" },
        99: { text: "Thunderstorm with Hail", icon: "⛈️" },
    };


    return weatherConditions[code] || {
        text: "Weather Unavailable",
        icon: "🌍",
    };


}

function formatDay(dateString) {
    return new Date(`${dateString}T12:00:00`).toLocaleDateString(
        "en-IN",
        {
            weekday: "short",
            day: "numeric",
            month: "short",
        }
    );
}

function Weather() {
    const [city, setCity] = useState("Kanpur");
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    const handleSearch = async (event) => {
        event.preventDefault();

        const searchCity = city.trim();

        if (!searchCity) {
            setError("Please enter a city name.");
            setWeather(null);
            return;
        }

        setLoading(true);
        setError("");
        setWeather(null);

        try {
            // Step 1: Find the city's latitude and longitude.
            const locationUrl =
                `${GEOCODING_API}?name=${encodeURIComponent(searchCity)}` +
                "&count=10&language=en&format=json";

            const locationResponse = await fetch(locationUrl);

            if (!locationResponse.ok) {
                throw new Error("Unable to search for this city.");
            }

            const locationData = await locationResponse.json();

            if (
                !Array.isArray(locationData.results) ||
                locationData.results.length === 0
            ) {
                throw new Error(
                    "City not found. Please check the spelling and try again."
                );
            }

            const normalizedCity = searchCity.toLowerCase();

            const location =
                locationData.results.find(
                    (place) =>
                        place.name.toLowerCase() === normalizedCity
                ) || locationData.results[0];

            // Step 2: Fetch current weather and a 5-day forecast.
            const weatherParams = new URLSearchParams({
                latitude: String(location.latitude),
                longitude: String(location.longitude),
                current:
                    "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
                daily:
                    "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset",
                temperature_unit: "celsius",
                wind_speed_unit: "kmh",
                timezone: "auto",
                forecast_days: "5",
            });

            const weatherResponse = await fetch(
                `${WEATHER_API}?${weatherParams.toString()}`
            );

            if (!weatherResponse.ok) {
                throw new Error(
                    "Unable to retrieve weather data. Please try again."
                );
            }

            const weatherData = await weatherResponse.json();

            if (!weatherData.current || !weatherData.daily) {
                throw new Error("Weather data is currently unavailable.");
            }

            setWeather({
                location,
                current: weatherData.current,
                daily: weatherData.daily,
            });
        } catch (err) {
            console.error("Weather API error:", err);

            setError(
                err.message ||
                "Unable to connect to the weather service. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const currentCondition = weather
        ? getWeatherDescription(weather.current.weather_code)
        : null;

    return (
        <main className="weather-page">
            <section className="weather-hero">
                <span className="weather-eyebrow">
                    SMART CAMPUS WEATHER
                </span>

                <h1>Campus Weather 🌤️</h1>

                <p>
                    Check current weather conditions and the upcoming
                    five-day forecast for your city.
                </p>

                <form
                    className="weather-search-form"
                    onSubmit={handleSearch}
                >
                    <label htmlFor="weather-city">
                        Enter City Name
                    </label>

                    <div className="weather-search-row">
                        <input
                            id="weather-city"
                            type="text"
                            value={city}
                            onChange={(event) =>
                                setCity(event.target.value)
                            }
                            placeholder="For example, Kanpur"
                            autoComplete="off"
                        />

                        <button
                            type="submit"
                            disabled={loading}
                        >
                            {loading
                                ? "Loading..."
                                : "Check Weather"}
                        </button>
                    </div>
                </form>
            </section>

            {error && (
                <div className="weather-error" role="alert">
                    <span>⚠️</span>
                    <p>{error}</p>
                </div>
            )}

            {loading && (
                <div className="weather-loading" role="status">
                    <span className="weather-spinner"></span>
                    <p>Getting the latest weather information...</p>
                </div>
            )}

            {weather && !loading && (
                <div className="weather-results">
                    <section className="current-weather-card">
                        <div className="current-weather-top">
                            <div>
                                <span className="weather-location-label">
                                    CURRENT WEATHER
                                </span>

                                <h2>
                                    {weather.location.name}
                                </h2>

                                <p className="weather-location-details">
                                    {[
                                        weather.location.admin1,
                                        weather.location.country,
                                    ]
                                        .filter(Boolean)
                                        .join(", ")}
                                </p>
                            </div>

                            <span className="current-weather-icon">
                                {currentCondition.icon}
                            </span>
                        </div>

                        <div className="current-temperature">
                            {Math.round(weather.current.temperature_2m)}
                            <span>°C</span>
                        </div>

                        <h3 className="current-weather-condition">
                            {currentCondition.text}
                        </h3>

                        <p className="feels-like">
                            Feels like{" "}
                            {Math.round(
                                weather.current.apparent_temperature
                            )}
                            °C
                        </p>

                        <div className="weather-details-grid">
                            <article className="weather-detail-card">
                                <span>💧</span>
                                <p>Humidity</p>
                                <strong>
                                    {
                                        weather.current
                                            .relative_humidity_2m
                                    }
                                    %
                                </strong>
                            </article>

                            <article className="weather-detail-card">
                                <span>💨</span>
                                <p>Wind Speed</p>
                                <strong>
                                    {weather.current.wind_speed_10m} km/h
                                </strong>
                            </article>

                            <article className="weather-detail-card">
                                <span>🌧️</span>
                                <p>Precipitation</p>
                                <strong>
                                    {weather.current.precipitation} mm
                                </strong>
                            </article>

                            <article className="weather-detail-card">
                                <span>
                                    {weather.current.is_day ? "🌞" : "🌙"}
                                </span>
                                <p>Time of Day</p>
                                <strong>
                                    {weather.current.is_day
                                        ? "Day"
                                        : "Night"}
                                </strong>
                            </article>
                        </div>
                    </section>

                    <section className="weather-forecast-section">
                        <div className="weather-section-heading">
                            <div>
                                <span>PLAN AHEAD</span>
                                <h2>5-Day Forecast</h2>
                            </div>

                            <span className="forecast-badge">
                                Daily forecast
                            </span>
                        </div>

                        <div className="weather-forecast-grid">
                            {weather.daily.time.map((date, index) => {
                                const condition = getWeatherDescription(
                                    weather.daily.weather_code[index]
                                );

                                return (
                                    <article
                                        className="weather-forecast-card"
                                        key={date}
                                    >
                                        <p className="forecast-date">
                                            {index === 0
                                                ? "Today"
                                                : formatDay(date)}
                                        </p>

                                        <span className="forecast-icon">
                                            {condition.icon}
                                        </span>

                                        <h3>{condition.text}</h3>

                                        <div className="forecast-temperatures">
                                            <strong>
                                                {Math.round(
                                                    weather.daily
                                                        .temperature_2m_max[
                                                    index
                                                    ]
                                                )}
                                                °
                                            </strong>

                                            <span>
                                                {Math.round(
                                                    weather.daily
                                                        .temperature_2m_min[
                                                    index
                                                    ]
                                                )}
                                                °
                                            </span>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>

                    <p className="weather-attribution">
                        Weather data provided by{" "}
                        <a
                            href="https://open-meteo.com/"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Open-Meteo
                        </a>
                    </p>
                </div>
            )}

            {!weather && !loading && !error && (
                <div className="weather-empty-state">
                    <span>🌍</span>
                    <h2>Discover Your City's Weather</h2>
                    <p>
                        Enter a city name and select Check Weather to
                        view current conditions and the forecast.
                    </p>
                </div>
            )}
        </main>
    );


}

export default Weather;
