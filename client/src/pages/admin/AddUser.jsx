import { useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

function AddUser() {
    const { token } = useAuth();

    const [role, setRole] = useState("student");

    const initialFormData = {
        name: "",
        email: "",
        password: "",
        crn: "",
        employeeId: "",
        department: "",
        course: "",
        semester: "3",
    };

    const [formData, setFormData] = useState(initialFormData);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loading, setLoading] = useState(false);

    // Handle input changes
    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));
    };

    // Handle role selection
    const handleRoleChange = (event) => {
        setRole(event.target.value);
        setMessage("");
        setMessageType("");
    };

    // Create student or teacher account
    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setMessageType("");

        if (!token) {
            setMessage("Your session has expired. Please log in again.");
            setMessageType("error");
            return;
        }

        if (formData.password.length < 8) {
            setMessage("Password must contain at least 8 characters.");
            setMessageType("error");
            return;
        }

        setLoading(true);

        const userData = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
            role,
            department: formData.department.trim(),
        };

        if (role === "student") {
            userData.crn = formData.crn.trim();
            userData.course = formData.course.trim();
            userData.semester = formData.semester;
        } else {
            userData.employeeId = formData.employeeId.trim();
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/users",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(userData),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Failed to create user."
                );
            }

            setMessage("✅ " + result.message);
            setMessageType("success");

            // Clear the form after successful creation
            setFormData(initialFormData);
        } catch (error) {
            setMessage(
                "❌ " +
                (error.message ||
                    "Unable to connect to the server.")
            );
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    // Clear form manually
    const handleReset = () => {
        setFormData(initialFormData);
        setMessage("");
        setMessageType("");
    };

    return (
        <AdminLayout>
            <section className="add-user-page">
                <div className="add-user-header">
                    <div>
                        <p className="page-eyebrow">USER MANAGEMENT</p>

                        <h1>Add New User</h1>

                        <p>
                            Create student and teacher accounts for
                            the Smart Campus portal.
                        </p>
                    </div>

                    <Link
                        to="/admin/dashboard"
                        className="back-button"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>

                <div className="add-user-card">
                    <div className="add-user-card-header">
                        <div className="add-user-icon">👤</div>

                        <div>
                            <h2>User Information</h2>

                            <p>
                                Enter the details below to create an
                                account.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Role selection */}
                        <div className="form-group">
                            <label htmlFor="role">User Role *</label>

                            <select
                                id="role"
                                value={role}
                                onChange={handleRoleChange}
                            >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                            </select>
                        </div>

                        <div className="form-grid">
                            {/* Full name */}
                            <div className="form-group">
                                <label htmlFor="name">
                                    Full Name *
                                </label>

                                <input
                                    id="name"
                                    type="text"
                                    name="name"
                                    placeholder="Enter full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    autoComplete="name"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div className="form-group">
                                <label htmlFor="email">
                                    College Email *
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="Enter email address"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            {/* Initial password */}
                            <div className="form-group">
                                <label htmlFor="password">
                                    Initial Password *
                                </label>

                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    placeholder="Create an initial password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                />

                                <small>
                                    Use at least 8 characters.
                                </small>
                            </div>

                            {/* Student fields */}
                            {role === "student" ? (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="crn">
                                            Student CRN *
                                        </label>

                                        <input
                                            id="crn"
                                            type="text"
                                            name="crn"
                                            placeholder="Enter CRN"
                                            value={formData.crn}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="course">
                                            Course *
                                        </label>

                                        <input
                                            id="course"
                                            type="text"
                                            name="course"
                                            placeholder="e.g. BCA"
                                            value={formData.course}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="semester">
                                            Semester *
                                        </label>

                                        <select
                                            id="semester"
                                            name="semester"
                                            value={formData.semester}
                                            onChange={handleChange}
                                            required
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(
                                                (number) => (
                                                    <option
                                                        key={number}
                                                        value={number}
                                                    >
                                                        Semester {number}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>
                                </>
                            ) : (
                                /* Teacher fields */
                                <div className="form-group">
                                    <label htmlFor="employeeId">
                                        Employee ID *
                                    </label>

                                    <input
                                        id="employeeId"
                                        type="text"
                                        name="employeeId"
                                        placeholder="Enter employee ID"
                                        value={formData.employeeId}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            )}

                            {/* Department */}
                            <div className="form-group">
                                <label htmlFor="department">
                                    Department *
                                </label>

                                <input
                                    id="department"
                                    type="text"
                                    name="department"
                                    placeholder="e.g. Computer Applications"
                                    value={formData.department}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Success and error messages */}
                        {message && (
                            <div
                                className={`form-message ${messageType}`}
                                role="status"
                            >
                                {message}
                            </div>
                        )}

                        {/* Form buttons */}
                        <div className="form-actions">
                            <button
                                type="submit"
                                className="submit-user-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Creating Account..."
                                    : `Create ${role === "student"
                                        ? "Student"
                                        : "Teacher"
                                    } Account`}
                            </button>

                            <button
                                type="button"
                                className="reset-form-button"
                                onClick={handleReset}
                                disabled={loading}
                            >
                                Clear Form
                            </button>
                        </div>
                    </form>
                </div>
            </section>
        </AdminLayout>
    );
}

export default AddUser;