
import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import Material from "../models/Material.js";

import {
    uploadMaterial,
    getMyMaterials,
    deleteMaterial,
} from "../controllers/materialController.js";

const router = express.Router();

// Allow only teachers to access teacher-specific routes.
const requireTeacher = (req, res, next) => {
    if (!req.user || req.user.role !== "teacher") {
        return res.status(403).json({
            success: false,
            message: "Teacher access required.",
        });
    }

    next();
};

// Get all uploaded study materials.
// Students, teachers, and admins can view materials after logging in.
router.get("/", verifyToken, async (req, res) => {
    try {
        const materials = await Material.find()
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: materials.length,
            materials,
        });
    } catch (error) {
        console.error("Fetch all materials error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load study materials.",
        });
    }
});

// Upload study material (teachers only)
router.post(
    "/",
    verifyToken,
    requireTeacher,
    upload.single("file"),
    uploadMaterial
);

// Get materials uploaded by the logged-in teacher
router.get(
    "/my",
    verifyToken,
    requireTeacher,
    getMyMaterials
);

// Delete study material (teachers only)
router.delete(
    "/:id",
    verifyToken,
    requireTeacher,
    deleteMaterial
);

export default router;

