import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function ProtectedRoute({ allowedRoles = [] }) {
    const { user, token } = useAuth();


    // Redirect users who are not logged in
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // Allow only the roles permitted for this route
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirect to the correct dashboard for their role
        if (user.role === "admin") {
            return <Navigate to="/admin/dashboard" replace />;
        }

        if (user.role === "teacher") {
            return <Navigate to="/teacher/dashboard" replace />;
        }

        if (user.role === "student") {
            return <Navigate to="/student/dashboard" replace />;
        }

        return <Navigate to="/" replace />;
    }

    return <Outlet />;


}

export default ProtectedRoute;
