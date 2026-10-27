import Sidebar from "../components/Sidebar.jsx";

function StudentLayout({ children }) {
    return (
        <div className="dashboard-layout">
            <Sidebar role="student" />

            <main className="dashboard-main">
                {children}
            </main>
        </div>
    );
}

export default StudentLayout;