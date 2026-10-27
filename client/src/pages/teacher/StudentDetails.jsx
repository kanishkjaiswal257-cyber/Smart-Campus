function StudentDetails() {
    // Sample student data
    const student = {
        name: "Aman Sharma",
        crn: "1001",
        course: "BCA",
        semester: "3rd Semester",
        department: "Computer Applications",
        email: "student@example.com",
    };

    return (
        <div className="page-container">
            <h1>Student Details</h1>
            <p>View student academic and contact information.</p>

            <div className="student-card">
                <div className="profile-avatar">
                    {student.name.charAt(0)}
                </div>

                <h2>{student.name}</h2>

                <div className="profile-details">
                    <p>
                        <strong>CRN:</strong> {student.crn}
                    </p>
                    <p>
                        <strong>Course:</strong> {student.course}
                    </p>
                    <p>
                        <strong>Semester:</strong> {student.semester}
                    </p>
                    <p>
                        <strong>Department:</strong> {student.department}
                    </p>
                    <p>
                        <strong>Email:</strong> {student.email}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default StudentDetails;