import { Link } from "react-router-dom";

function Navbar() {
    return (
        <nav className="navbar">
            <Link to="/" className="navbar-logo">
                Smart<span>Campus</span>
            </Link>

            <div className="navbar-links">
                <Link to="/">Home</Link>
                <Link to="/faculty">Faculty</Link>
                <Link to="/weather">Weather</Link>
                <Link to="/campus-map">Campus Map</Link>
            </div>

            <Link to="/login" className="login-button">
                Login
            </Link>
        </nav>
    );
}

export default Navbar;