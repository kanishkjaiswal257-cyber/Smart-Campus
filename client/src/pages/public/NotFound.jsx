import { Link } from "react-router-dom";

function NotFound() {
    return (
        <div className="page-container">
            <div className="not-found-container">
                <h1>404</h1>
                <h2>Oops! Page Not Found</h2>

                <p>
                    The page you are looking for doesn't exist or may have been moved.
                </p>

                <Link to="/" className="btn-primary">
                    Back to Home
                </Link>
            </div>
        </div>
    );
}

export default NotFound;