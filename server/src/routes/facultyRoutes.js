
import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Get faculty members registered by admin
router.get("/", async (req, res) => {
    try {
        const { search } = req.query;

        // Find active teacher accounts registered in the database
        const filter = {
            role: "teacher",
            isActive: true,
        };

        // Optional search by name, email, department, or employee ID
        if (search && search.trim()) {
            const searchRegex = new RegExp(
                search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                "i"
            );

            filter.$or = [
                { name: searchRegex },
                { email: searchRegex },
                { department: searchRegex },
                { employeeId: searchRegex },
            ];
        }

        const faculty = await User.find(filter)
            .select("name email department employeeId role isActive")
            .sort({ name: 1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: faculty.length,
            faculty,
        });
    } catch (error) {
        // Show the actual reason in the backend terminal
        console.error("Faculty directory error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load faculty directory.",
        });
    }
});

export default router;

