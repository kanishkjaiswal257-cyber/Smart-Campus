import Sidebar from "../components/Sidebar.jsx";

function TeacherLayout({ children }) {
    return (
        <div className="dashboard-layout">
            <Sidebar role="teacher" />

            <main className="dashboard-main">
                {children}
            </main>
        </div>
    );
}

export default TeacherLayout;