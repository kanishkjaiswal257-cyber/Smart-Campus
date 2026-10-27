import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Context
import { AuthProvider } from "./context/AuthContext.jsx";

// Components
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Public Pages
import Home from "./pages/public/Home.jsx";
import Login from "./pages/public/Login.jsx";
import VerifyOTP from "./pages/public/VerifyOTP.jsx";
import Weather from "./pages/public/Weather.jsx";
import CampusMap from "./pages/public/CampusMap.jsx";
import FacultyDirectory from "./pages/public/FacultyDirectory.jsx";
import NotFound from "./pages/public/NotFound.jsx";

// Notification Page
import Notifications from "./pages/Notifications.jsx";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import StudentMaterials from "./pages/student/StudentMaterials.jsx";
import StudentFaculty from "./pages/student/StudentFaculty.jsx";
import StudentNotices from "./pages/student/StudentNotices.jsx";
import StudentEvents from "./pages/student/StudentEvents.jsx";
import StudentBookmarks from "./pages/student/StudentBookmarks.jsx";
import StudentProfile from "./pages/student/StudentProfile.jsx";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard.jsx";
import UploadMaterial from "./pages/teacher/UploadMaterial.jsx";
import MyMaterials from "./pages/teacher/MyMaterials.jsx";
import SearchStudents from "./pages/teacher/SearchStudents.jsx";
import StudentDetails from "./pages/teacher/StudentDetails.jsx";
import TeacherFaculty from "./pages/teacher/TeacherFaculty.jsx";
import TeacherNotices from "./pages/teacher/TeacherNotices.jsx";
import TeacherProfile from "./pages/teacher/TeacherProfile.jsx";
import TeacherEvents from "./pages/teacher/TeacherEvents.jsx";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AddUser from "./pages/admin/AddUser.jsx";
import ManageUsers from "./pages/admin/ManageUsers.jsx";
import ManageFaculty from "./pages/admin/ManageFaculty.jsx";
import ManageMaterials from "./pages/admin/ManageMaterials.jsx";
import ManageNotices from "./pages/admin/ManageNotices.jsx";
import ManageEvents from "./pages/admin/ManageEvents.jsx";
import AdminProfile from "./pages/admin/AdminProfile.jsx";
import SendNotification from "./pages/admin/SendNotification.jsx";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter basename={import.meta.env.BASE_URL}>
                <Routes>
        {/* ================= PUBLIC ROUTES ================= */}


        <Route
            path="/"
            element={
                <>
                    <Navbar />
                    <Home />
                </>
            }
        />

        <Route path="/login" element={<Login />} />

        <Route
            path="/verify-otp"
            element={<VerifyOTP />}
        />

        <Route
            path="/weather"
            element={<Weather />}
        />

        <Route
            path="/campus-map"
            element={<CampusMap />}
        />

        <Route
            path="/faculty"
            element={<FacultyDirectory />}
        />

        {/* ================= STUDENT ROUTES ================= */}

        <Route
            element={
                <ProtectedRoute allowedRoles={["student"]} />
            }
        >
            <Route
                path="/student/dashboard"
                element={<StudentDashboard />}
            />

            <Route
                path="/student/materials"
                element={<StudentMaterials />}
            />

            <Route
                path="/student/faculty"
                element={<StudentFaculty />}
            />

            <Route
                path="/student/notices"
                element={<StudentNotices />}
            />

            <Route
                path="/student/events"
                element={<StudentEvents />}
            />

            <Route
                path="/student/bookmarks"
                element={<StudentBookmarks />}
            />

            <Route
                path="/student/profile"
                element={<StudentProfile />}
            />

            <Route
                path="/student/notifications"
                element={<Notifications />}
            />
        </Route>

        {/* ================= TEACHER ROUTES ================= */}

        <Route
            element={
                <ProtectedRoute allowedRoles={["teacher"]} />
            }
        >
            <Route
                path="/teacher/dashboard"
                element={<TeacherDashboard />}
            />

            <Route
                path="/teacher/upload-material"
                element={<UploadMaterial />}
            />

            <Route
                path="/teacher/materials"
                element={<MyMaterials />}
            />

            <Route
                path="/teacher/search-students"
                element={<SearchStudents />}
            />

            <Route
                path="/teacher/student-details"
                element={<StudentDetails />}
            />

            <Route
                path="/teacher/faculty"
                element={<TeacherFaculty />}
            />

            <Route
                path="/teacher/notices"
                element={<TeacherNotices />}
            />

            {/* Teacher Events — Added */}
            <Route
                path="/teacher/events"
                element={<TeacherEvents />}
            />

            <Route
                path="/teacher/profile"
                element={<TeacherProfile />}
            />

            <Route
                path="/teacher/notifications"
                element={<Notifications />}
            />
        </Route>

        {/* ================= ADMIN ROUTES ================= */}

        <Route
            element={
                <ProtectedRoute allowedRoles={["admin"]} />
            }
        >
            <Route
                path="/admin/dashboard"
                element={<AdminDashboard />}
            />

            <Route
                path="/admin/add-user"
                element={<AddUser />}
            />

            <Route
                path="/admin/users"
                element={<ManageUsers />}
            />

            <Route
                path="/admin/faculty"
                element={<ManageFaculty />}
            />

            <Route
                path="/admin/materials"
                element={<ManageMaterials />}
            />

            <Route
                path="/admin/notices"
                element={<ManageNotices />}
            />

            <Route
                path="/admin/events"
                element={<ManageEvents />}
            />

            <Route
                path="/admin/profile"
                element={<AdminProfile />}
            />

            <Route
                path="/admin/send-notification"
                element={<SendNotification />}
            />
        </Route>

        {/* ================= 404 ROUTE ================= */}

        <Route
            path="/404"
            element={<NotFound />}
        />

        <Route
            path="*"
            element={<Navigate to="/404" replace />}
        />
    </Routes>
    </BrowserRouter>
    </AuthProvider>
    );


}

export default App;
