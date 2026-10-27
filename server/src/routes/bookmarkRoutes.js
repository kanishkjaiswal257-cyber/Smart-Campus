import express from "express";
import mongoose from "mongoose";

import Bookmark from "../models/Bookmark.js";

import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

const allowedTypes = [
    "Notice",
    "Event",
    "Material",
    "Faculty",
];

// ============================================
// GET MY BOOKMARKS
// ============================================

router.get("/", verifyToken, async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;


        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please log in again.",
            });
        }

        const bookmarks = await Bookmark.find({
            user: userId,
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            total: bookmarks.length,
            bookmarks,
        });
    } catch (error) {
        console.error("Fetch bookmarks error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load bookmarks.",
        });
    }


});

// ============================================
// ADD A BOOKMARK
// ============================================

router.post("/", verifyToken, async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;


        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please log in again.",
            });
        }

        const {
            itemType,
            itemId,
            title,
            description,
            link,
        } = req.body;

        if (
            !allowedTypes.includes(itemType) ||
            typeof itemId !== "string" ||
            !itemId.trim() ||
            typeof title !== "string" ||
            !title.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid item type, item ID, and title are required.",
            });
        }

        if (title.trim().length > 200) {
            return res.status(400).json({
                success: false,
                message: "Title must not exceed 200 characters.",
            });
        }

        if (
            description !== undefined &&
            (
                typeof description !== "string" ||
                description.length > 2000
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Description must not exceed 2000 characters.",
            });
        }

        if (
            link !== undefined &&
            (
                typeof link !== "string" ||
                link.length > 300
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Link must not exceed 300 characters.",
            });
        }

        const bookmark = await Bookmark.create({
            user: userId,
            itemType,
            itemId: itemId.trim(),
            title: title.trim(),
            description: description?.trim() || "",
            link: link?.trim() || "",
        });

        return res.status(201).json({
            success: true,
            message: "Bookmark added successfully.",
            bookmark,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This item is already bookmarked.",
            });
        }

        console.error("Add bookmark error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add bookmark.",
        });
    }


});

// ============================================
// REMOVE A BOOKMARK
// ============================================

router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;


        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please log in again.",
            });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid bookmark ID.",
            });
        }

        // A user can remove only their own bookmark.
        const bookmark = await Bookmark.findOneAndDelete({
            _id: req.params.id,
            user: userId,
        });

        if (!bookmark) {
            return res.status(404).json({
                success: false,
                message: "Bookmark not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Bookmark removed successfully.",
        });
    } catch (error) {
        console.error("Remove bookmark error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to remove bookmark.",
        });
    }


});

export default router;
