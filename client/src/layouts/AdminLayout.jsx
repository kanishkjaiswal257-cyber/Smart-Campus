import Sidebar from "../components/Sidebar.jsx";

function AdminLayout({ children }) {
    return (
        <div className="dashboard-layout">
            <Sidebar role="admin" />

            <main className="dashboard-main">
                {children}
            </main>
        </div>
    );
}

export default AdminLayout;