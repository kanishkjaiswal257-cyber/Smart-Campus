import { NavLink } from "react-router-dom";

// Student Menu
const studentMenu = [
    { name: "Dashboard", path: "/student/dashboard", icon: "🏠" },
    { name: "Notices", path: "/student/notices", icon: "🔔" },
    { name: "Study Materials", path: "/student/materials", icon: "📚" },
    { name: "Faculty", path: "/student/faculty", icon: "👨‍🏫" },
    { name: "Events", path: "/student/events", icon: "📅" },
    { name: "Campus Map", path: "/campus-map", icon: "📍" },
    { name: "Bookmarks", path: "/student/bookmarks", icon: "🔖" },
    { name: "Profile", path: "/student/profile", icon: "👤" },
];

// Teacher Menu
const teacherMenu = [
    { name: "Dashboard", path: "/teacher/dashboard", icon: "🏠" },
    { name: "Upload Materials", path: "/teacher/upload-material", icon: "📤" },
    { name: "My Materials", path: "/teacher/materials", icon: "📚" },
    { name: "Student Search", path: "/teacher/search-students", icon: "🔍" },
    { name: "Faculty Directory", path: "/teacher/faculty", icon: "👨‍🏫" },
    { name: "Notices", path: "/teacher/notices", icon: "📢" },
    { name: "Events", path: "/teacher/events", icon: "📅" },
    { name: "Profile", path: "/teacher/profile", icon: "👤" },
];

// Admin Menu
const adminMenu = [
    { name: "Dashboard", path: "/admin/dashboard", icon: "🏠" },
    { name: "Manage Users", path: "/admin/users", icon: "👥" },
    { name: "Add User", path: "/admin/add-user", icon: "➕" },
    { name: "Manage Faculty", path: "/admin/faculty", icon: "👨‍🏫" },
    { name: "Study Materials", path: "/admin/materials", icon: "📚" },
    { name: "Manage Notices", path: "/admin/notices", icon: "📢" },
    { name: "Manage Events", path: "/admin/events", icon: "📅" },
    { name: "Profile", path: "/admin/profile", icon: "👤" },
];

function Sidebar({ role = "student" }) {
    const menu =
        role === "admin"
            ? adminMenu
            : role === "teacher"
                ? teacherMenu
                : studentMenu;

    return (
        <aside className={`sidebar ${role}-sidebar`}>
            <div className="sidebar-brand">
                <span className="brand-icon">🎓</span>

                <div>
                    <h2>Smart Campus</h2>
                    <p>Learn · Connect · Grow</p>
                </div>
            </div>

            <nav className="sidebar-menu">
                {menu.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.name === "Dashboard"}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <button
                className="sidebar-logout"
                onClick={() => {
                    localStorage.removeItem("token");
                    window.location.href = "/login";
                }}
            >
                <span>↪</span> Logout
            </button>
        </aside>
    );
}

export default Sidebar;