function Home() {
    return (
        <div className="home">
            <section className="hero">
                <div className="hero-content">
                    <p className="hero-label">
                        YOUR COLLEGE, ONE PLATFORM
                    </p>

                    <h1>
                        Welcome to <span>Smart Campus</span>
                    </h1>

                    <p className="hero-description">
                        Your one-stop destination for college notices,
                        events, study materials, faculty information,
                        and campus assistance.
                    </p>

                    <div className="hero-buttons">
                        <a href="/login" className="primary-button">
                            Get Started
                        </a>

                        <a href="/faculty" className="secondary-button">
                            Explore Faculty
                        </a>
                    </div>
                </div>
            </section>

            <section className="features-section">
                <div className="section-heading">
                    <p>EXPLORE OUR CAMPUS</p>

                    <h2>Everything You Need in One Place</h2>

                    <span>
                        Access useful college services through a single portal.
                    </span>
                </div>

                <div className="feature-grid">
                    <div className="feature-card">
                        <div className="feature-icon">📢</div>
                        <h3>College Notices</h3>
                        <p>Stay updated with important college announcements.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">📅</div>
                        <h3>Campus Events</h3>
                        <p>Discover workshops, competitions, and college events.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">📚</div>
                        <h3>Study Materials</h3>
                        <p>Access learning resources shared by your teachers.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">👨‍🏫</div>
                        <h3>Faculty Directory</h3>
                        <p>Find faculty information and departments.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🌦️</div>
                        <h3>Live Weather</h3>
                        <p>Check weather information before planning your day.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">📍</div>
                        <h3>Campus Map</h3>
                        <p>Explore campus locations and facilities.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;