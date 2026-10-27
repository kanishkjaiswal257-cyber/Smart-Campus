import express from "express";

import Notification from "../models/Notification.js";
import User from "../models/User.js";

import {
    verifyToken,
    requireAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ============================================
// GET MY NOTIFICATIONS
// STUDENT / TEACHER ACCESS
// ============================================

router.get("/", verifyToken, async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const notifications = await Notification.find({
            recipient: userId,
        })
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false,
        });

        return res.status(200).json({
            success: true,
            notifications,
            total: notifications.length,
            unreadCount,
        });
    } catch (error) {
        console.error("Fetch notifications error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load notifications.",
        });
    }
});

// ============================================
// GET UNREAD NOTIFICATION COUNT
// ============================================

router.get("/unread-count", verifyToken, async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false,
        });

        return res.status(200).json({
            success: true,
            unreadCount,
        });
    } catch (error) {
        console.error("Unread notification count error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch unread notification count.",
        });
    }
});

// ============================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================

router.patch("/read-all", verifyToken, async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        await Notification.updateMany(
            {
                recipient: userId,
                isRead: false,
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date(),
                },
            }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read.",
        });
    } catch (error) {
        console.error("Mark all as read error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update notifications.",
        });
    }
});

// ============================================
// MARK ONE NOTIFICATION AS READ
// ============================================

router.patch("/:id/read", verifyToken, async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                recipient: userId,
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date(),
                },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification marked as read.",
            notification,
        });
    } catch (error) {
        console.error("Mark notification as read error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update notification.",
        });
    }
});

// ============================================
// CREATE NOTIFICATION
// ADMIN ACCESS ONLY
// ============================================

router.post("/", verifyToken, requireAdmin, async (req, res) => {
    try {
        const {
            title,
            message,
            type,
            recipientRole,
            link,
        } = req.body;

        if (
            typeof title !== "string" ||
            !title.trim() ||
            typeof message !== "string" ||
            !message.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Title and message are required.",
            });
        }

        if (
            title.trim().length > 150 ||
            message.trim().length > 2000
        ) {
            return res.status(400).json({
                success: false,
                message: "Title or message exceeds the allowed length.",
            });
        }

        const allowedTypes = [
            "General",
            "Notice",
            "Event",
            "Academic",
            "Important",
        ];

        const notificationType = type || "General";

        if (!allowedTypes.includes(notificationType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification type.",
            });
        }

        if (
            !["student", "teacher", "all"].includes(recipientRole)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Recipient role must be student, teacher, or all.",
            });
        }

        if (
            link !== undefined &&
            (typeof link !== "string" || link.length > 300)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification link.",
            });
        }

        const roles =
            recipientRole === "all"
                ? ["student", "teacher"]
                : [recipientRole];

        const users = await User.find({
            role: { $in: roles },
            isActive: { $ne: false },
        }).select("_id");

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No active recipients found.",
            });
        }

        const documents = users.map((recipient) => ({
            title: title.trim(),
            message: message.trim(),
            type: notificationType,
            recipient: recipient._id,
            link: link?.trim() || "",
            createdBy: req.user?._id || req.user?.id,
        }));

        await Notification.insertMany(documents);

        return res.status(201).json({
            success: true,
            message: "Notifications sent successfully.",
            recipientCount: documents.length,
        });
    } catch (error) {
        console.error("Create notification error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send notifications.",
        });
    }
});

export default router;