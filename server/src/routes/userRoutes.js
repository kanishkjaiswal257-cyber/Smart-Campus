import express from "express";
import bcrypt from "bcryptjs";

import User from "../models/User.js";

import {
    verifyToken,
    requireAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ============================================
// CREATE A NEW STUDENT OR TEACHER
// ADMIN ACCESS ONLY
// ============================================

router.post("/", verifyToken, requireAdmin, async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            crn,
            employeeId,
            department,
            course,
            semester,
        } = req.body;


        if (!name?.trim() || !email?.trim() || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password, and role are required.",
            });
        }

        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters.",
            });
        }

        if (!["student", "teacher"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be student or teacher.",
            });
        }

        if (role === "student" && !crn?.trim()) {
            return res.status(400).json({
                success: false,
                message: "CRN is required for students.",
            });
        }

        if (role === "teacher" && !employeeId?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Employee ID is required for teachers.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "This email address is already registered.",
            });
        }

        const userData = {
            name: name.trim(),
            email: normalizedEmail,
            password: await bcrypt.hash(password, 12),
            role,
            department: department?.trim() || "",
            course: course?.trim() || "",
        };

        if (role === "student") {
            userData.crn = crn.trim();

            if (semester !== undefined && semester !== "") {
                const semesterNumber = Number(semester);

                if (
                    !Number.isInteger(semesterNumber) ||
                    semesterNumber < 1 ||
                    semesterNumber > 8
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Semester must be between 1 and 8.",
                    });
                }

                userData.semester = semesterNumber;
            }
        }

        if (role === "teacher") {
            userData.employeeId = employeeId.trim();
        }

        const user = await User.create(userData);

        return res.status(201).json({
            success: true,
            message: `${role === "student" ? "Student" : "Teacher"
                } account created successfully.`,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                crn: user.crn,
                employeeId: user.employeeId,
                department: user.department,
                course: user.course,
                semester: user.semester,
                isActive: user.isActive,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email, CRN, or employee ID already exists.",
            });
        }

        console.error("Create user error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create user.",
        });
    }


});

// ============================================
// GET ALL STUDENTS AND TEACHERS
// ADMIN ACCESS ONLY
// ============================================

router.get("/", verifyToken, requireAdmin, async (req, res) => {
    try {
        const users = await User.find({
            role: { $in: ["student", "teacher"] },
        })
            .select("-password -__v")
            .sort({ createdAt: -1 });


        return res.status(200).json({
            success: true,
            totalUsers: users.length,
            users,
        });
    } catch (error) {
        console.error("Fetch users error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch users.",
        });
    }


});

// ============================================
// GET LOGGED-IN STUDENT PROFILE
// ============================================

router.get("/profile", verifyToken, async (req, res) => {
    try {
        const userId =
            req.user?._id ||
            req.user?.id ||
            req.user?.userId;


        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User authentication failed. Please log in again.",
            });
        }

        if (req.user?.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Student access required.",
            });
        }

        const user = await User.findById(userId).select("-password -__v");

        if (!user || user.isActive === false) {
            return res.status(404).json({
                success: false,
                message: "Student account not found or inactive.",
            });
        }

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("GET /api/users/profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load profile.",
        });
    }

});

// ============================================
// UPDATE LOGGED-IN STUDENT PROFILE
// ============================================

router.put("/profile", verifyToken, async (req, res) => {
    try {
        const userId =
            req.user?._id ||
            req.user?.id ||
            req.user?.userId;


        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User authentication failed. Please log in again.",
            });
        }

        if (req.user?.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Student access required.",
            });
        }

        const user = await User.findById(userId);

        if (!user || user.isActive === false) {
            return res.status(404).json({
                success: false,
                message: "Student account not found or inactive.",
            });
        }

        const { name, crn, course, department } = req.body;

        // Update name
        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Name cannot be empty.",
                });
            }

            user.name = name.trim();
        }

        // Update CRN
        if (crn !== undefined) {
            if (typeof crn !== "string" || !crn.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "CRN cannot be empty.",
                });
            }

            const normalizedCRN = crn.trim();

            const existingCRN = await User.findOne({
                crn: normalizedCRN,
                _id: { $ne: user._id },
            });

            if (existingCRN) {
                return res.status(409).json({
                    success: false,
                    message: "This CRN is already registered.",
                });
            }

            user.crn = normalizedCRN;
        }

        // Update course
        if (course !== undefined) {
            if (typeof course !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid course.",
                });
            }

            user.course = course.trim();
        }

        // Update department
        if (department !== undefined) {
            if (typeof department !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid department.",
                });
            }

            user.department = department.trim();
        }

        await user.save();

        const updatedUser = await User.findById(user._id).select(
            "-password -__v"
        );

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            user: updatedUser,
        });
    } catch (error) {
        console.error("PUT /api/users/profile error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This CRN is already registered.",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update profile.",
        });
    }


});

// ============================================
// SEARCH REGISTERED STUDENTS
// TEACHER ACCESS ONLY
//
// GET /api/users/search/students
// GET /api/users/search/students?search=Kanishk
//
// No search parameter: return all active students.
// With search parameter: filter by name, CRN, email,
// course, or department.
// ============================================

router.get("/search/students", verifyToken, async (req, res) => {
    try {
        if (req.user?.role !== "teacher") {
            return res.status(403).json({
                success: false,
                message: "Teacher access required.",
            });
        }

        const search =
            typeof req.query.search === "string"
                ? req.query.search.trim()
                : "";

        // Match only active student accounts.
        // $ne: false also includes older records where isActive
        // may not have been set explicitly.
        const filter = {
            role: "student",
            isActive: { $ne: false },
        };

        // Search is optional. Do not return a 400 response
        // when the page first loads without a search term.
        if (search.length > 0) {
            // Escape special characters so search input is treated as text.
            const safeSearch = search.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            const searchRegex = new RegExp(safeSearch, "i");

            filter.$or = [
                { name: searchRegex },
                { crn: searchRegex },
                { email: searchRegex },
                { course: searchRegex },
                { department: searchRegex },
            ];
        }

        const students = await User.find(filter)
            .select(
                "name email crn course semester department isActive createdAt"
            )
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        return res.status(200).json({
            success: true,
            total: students.length,
            students,
        });
    } catch (error) {
        console.error("Student search error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch registered students.",
        });
    }


});

// ============================================
// DEACTIVATE A STUDENT OR TEACHER
// ADMIN ACCESS ONLY
// ============================================

router.patch(
    "/:id/deactivate",
    verifyToken,
    requireAdmin,
    async (req, res) => {
        try {
            const user = await User.findById(req.params.id);


            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found.",
                });
            }

            if (user.role === "admin") {
                return res.status(403).json({
                    success: false,
                    message:
                        "Admin accounts cannot be deactivated through this route.",
                });
            }

            if (user.isActive === false) {
                return res.status(400).json({
                    success: false,
                    message: "This account is already inactive.",
                });
            }

            user.isActive = false;
            await user.save();

            return res.status(200).json({
                success: true,
                message: "User account deactivated successfully.",
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    isActive: user.isActive,
                },
            });
        } catch (error) {
            console.error("Deactivate user error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to deactivate user account.",
            });
        }
    }


);

// ============================================
// REACTIVATE A STUDENT OR TEACHER
// ADMIN ACCESS ONLY
// ============================================

router.patch(
    "/:id/reactivate",
    verifyToken,
    requireAdmin,
    async (req, res) => {
        try {
            const user = await User.findById(req.params.id);


            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found.",
                });
            }

            if (user.role === "admin") {
                return res.status(403).json({
                    success: false,
                    message:
                        "Admin accounts cannot be reactivated through this route.",
                });
            }

            if (user.isActive === true) {
                return res.status(400).json({
                    success: false,
                    message: "This account is already active.",
                });
            }

            user.isActive = true;
            await user.save();

            return res.status(200).json({
                success: true,
                message: "User account reactivated successfully.",
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    isActive: user.isActive,
                },
            });
        } catch (error) {
            console.error("Reactivate user error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to reactivate user account.",
            });
        }
    }


);

export default router;
