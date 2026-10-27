
import express from "express";

import {
    verifyToken,
} from "../middleware/authMiddleware.js";

import {
    getPublishedNotices,
    getAllNotices,
    createNotice,
    updateNotice,
    deleteNotice,
} from "../controllers/noticeController.js";

const router = express.Router();

// Only admin can manage all notices
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin access required.",
        });
    }

    next();
};

// Public: View published notices
router.get("/", getPublishedNotices);

// Admin: View every notice, including drafts
router.get("/all", verifyToken, requireAdmin, getAllNotices);

// Admin: Create, update and delete notices
router.post("/", verifyToken, requireAdmin, createNotice);
router.put("/:id", verifyToken, requireAdmin, updateNotice);
router.delete("/:id", verifyToken, requireAdmin, deleteNotice);

export default router;

