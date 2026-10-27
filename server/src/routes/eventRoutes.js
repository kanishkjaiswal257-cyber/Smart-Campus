
import express from "express";
import mongoose from "mongoose";

import Event from "../models/Event.js";

import {
    verifyToken,
    requireAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

const allowedCategories = [
    "Academic",
    "Cultural",
    "Sports",
    "Workshop",
    "Seminar",
    "General",
];

const allowedStatuses = [
    "Draft",
    "Published",
    "Cancelled",
];

// Format event records without exposing registrations of other users.
function formatEvent(event, userId = null) {
    const data =
        typeof event.toObject === "function"
            ? event.toObject()
            : { ...event };

    const registrations = data.registrations || [];

    data.registrationCount = registrations.length;

    data.isRegistered = userId
        ? registrations.some(
            (registration) =>
                String(registration.user?._id || registration.user) ===
                String(userId)
        )
        : false;

    delete data.registrations;

    return data;
}

// Safely validate date values.
function parseDate(value) {
    if (value === null || value === "") {
        return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

// ============================================
// GET PUBLISHED EVENTS
// Accessible to authenticated users
// GET /api/events
// ============================================

router.get("/", verifyToken, async (req, res) => {
    try {
        const events = await Event.find({
            status: "Published",
        })
            .sort({ eventDate: 1 })
            .lean();

        const userId = req.user?._id || req.user?.id;

        const formattedEvents = events.map((event) => {
            const registrations = event.registrations || [];

            const formatted = {
                ...event,
                registrationCount: registrations.length,
                isRegistered: userId
                    ? registrations.some(
                        (registration) =>
                            String(
                                registration.user?._id ||
                                registration.user
                            ) === String(userId)
                    )
                    : false,
            };

            delete formatted.registrations;

            return formatted;
        });

        return res.status(200).json({
            success: true,
            total: formattedEvents.length,
            events: formattedEvents,
        });
    } catch (error) {
        console.error("Fetch events error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load events.",
        });
    }
});

// ============================================
// GET ALL EVENTS
// Admin only
// GET /api/events/all
// ============================================

router.get("/all", verifyToken, requireAdmin, async (req, res) => {
    try {
        const events = await Event.find()
            .sort({ eventDate: 1 })
            .lean();

        const formattedEvents = events.map((event) =>
            formatEvent(event)
        );

        return res.status(200).json({
            success: true,
            total: formattedEvents.length,
            events: formattedEvents,
        });
    } catch (error) {
        console.error("Fetch all events error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch events.",
        });
    }
});

// ============================================
// CREATE EVENT
// Admin only
// POST /api/events
// ============================================

router.post("/", verifyToken, requireAdmin, async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            location,
            eventDate,
            registrationDeadline,
            maxAttendees,
            status,
        } = req.body;

        if (
            typeof title !== "string" ||
            !title.trim() ||
            typeof description !== "string" ||
            !description.trim() ||
            typeof location !== "string" ||
            !location.trim() ||
            !eventDate
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Title, description, location, and event date are required.",
            });
        }

        if (
            title.trim().length > 150 ||
            description.trim().length > 3000 ||
            location.trim().length > 200
        ) {
            return res.status(400).json({
                success: false,
                message: "One or more fields exceed the allowed length.",
            });
        }

        const parsedEventDate = parseDate(eventDate);

        if (!parsedEventDate) {
            return res.status(400).json({
                success: false,
                message: "Invalid event date.",
            });
        }

        let parsedDeadline = null;

        if (
            registrationDeadline !== undefined &&
            registrationDeadline !== null &&
            registrationDeadline !== ""
        ) {
            parsedDeadline = parseDate(registrationDeadline);

            if (!parsedDeadline) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid registration deadline.",
                });
            }

            if (parsedDeadline > parsedEventDate) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Registration deadline cannot be after the event date.",
                });
            }
        }

        const selectedCategory = category || "General";
        const selectedStatus = status || "Published";

        if (!allowedCategories.includes(selectedCategory)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event category.",
            });
        }

        if (!allowedStatuses.includes(selectedStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event status.",
            });
        }

        let attendeeLimit = null;

        if (
            maxAttendees !== undefined &&
            maxAttendees !== null &&
            maxAttendees !== ""
        ) {
            attendeeLimit = Number(maxAttendees);

            if (
                !Number.isInteger(attendeeLimit) ||
                attendeeLimit < 1
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Maximum attendees must be a positive whole number.",
                });
            }
        }

        const userId = req.user?._id || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user not found.",
            });
        }

        const event = await Event.create({
            title: title.trim(),
            description: description.trim(),
            category: selectedCategory,
            location: location.trim(),
            eventDate: parsedEventDate,
            registrationDeadline: parsedDeadline,
            maxAttendees: attendeeLimit,
            status: selectedStatus,
            createdBy: userId,
        });

        return res.status(201).json({
            success: true,
            message: "Event created successfully.",
            event: formatEvent(event),
        });
    } catch (error) {
        console.error("Create event error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create event.",
        });
    }
});

// ============================================
// UPDATE EVENT
// Admin only
// PUT /api/events/:id
// ============================================

router.put("/:id", verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID.",
            });
        }

        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }

        const {
            title,
            description,
            category,
            location,
            eventDate,
            registrationDeadline,
            maxAttendees,
            status,
        } = req.body;

        if (title !== undefined) {
            if (
                typeof title !== "string" ||
                !title.trim() ||
                title.trim().length > 150
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid event title.",
                });
            }

            event.title = title.trim();
        }

        if (description !== undefined) {
            if (
                typeof description !== "string" ||
                !description.trim() ||
                description.trim().length > 3000
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid event description.",
                });
            }

            event.description = description.trim();
        }

        if (location !== undefined) {
            if (
                typeof location !== "string" ||
                !location.trim() ||
                location.trim().length > 200
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid event location.",
                });
            }

            event.location = location.trim();
        }

        if (category !== undefined) {
            if (!allowedCategories.includes(category)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid event category.",
                });
            }

            event.category = category;
        }

        if (status !== undefined) {
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid event status.",
                });
            }

            event.status = status;
        }

        if (eventDate !== undefined) {
            const parsedEventDate = parseDate(eventDate);

            if (!parsedEventDate) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid event date.",
                });
            }

            event.eventDate = parsedEventDate;
        }

        if (registrationDeadline !== undefined) {
            if (
                registrationDeadline === null ||
                registrationDeadline === ""
            ) {
                event.registrationDeadline = null;
            } else {
                const parsedDeadline = parseDate(
                    registrationDeadline
                );

                if (!parsedDeadline) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid registration deadline.",
                    });
                }

                event.registrationDeadline = parsedDeadline;
            }
        }

        if (maxAttendees !== undefined) {
            if (maxAttendees === null || maxAttendees === "") {
                event.maxAttendees = null;
            } else {
                const attendeeLimit = Number(maxAttendees);

                if (
                    !Number.isInteger(attendeeLimit) ||
                    attendeeLimit < 1
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Maximum attendees must be a positive whole number.",
                    });
                }

                if (
                    attendeeLimit < event.registrations.length
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Maximum attendees cannot be less than the current registrations.",
                    });
                }

                event.maxAttendees = attendeeLimit;
            }
        }

        if (
            event.registrationDeadline &&
            event.registrationDeadline > event.eventDate
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Registration deadline cannot be after the event date.",
            });
        }

        await event.save();

        return res.status(200).json({
            success: true,
            message: "Event updated successfully.",
            event: formatEvent(event),
        });
    } catch (error) {
        console.error("Update event error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update event.",
        });
    }
});

// ============================================
// DELETE EVENT
// Admin only
// DELETE /api/events/:id
// ============================================

router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID.",
            });
        }

        const event = await Event.findByIdAndDelete(id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Event deleted successfully.",
        });
    } catch (error) {
        console.error("Delete event error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete event.",
        });
    }
});

// ============================================
// REGISTER FOR EVENT
// Student access only
// POST /api/events/:id/register
// ============================================

router.post("/:id/register", verifyToken, async (req, res) => {
    try {
        if (req.user?.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Only students can register for events.",
            });
        }

        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID.",
            });
        }

        const userId = req.user?._id || req.user?.id;

        const event = await Event.findById(id);

        if (!event || event.status !== "Published") {
            return res.status(404).json({
                success: false,
                message: "Published event not found.",
            });
        }

        if (event.eventDate <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Registration for this event is closed.",
            });
        }

        if (
            event.registrationDeadline &&
            event.registrationDeadline <= new Date()
        ) {
            return res.status(400).json({
                success: false,
                message: "The registration deadline has passed.",
            });
        }

        const alreadyRegistered = event.registrations.some(
            (registration) =>
                String(registration.user?._id || registration.user) ===
                String(userId)
        );

        if (alreadyRegistered) {
            return res.status(409).json({
                success: false,
                message: "You are already registered for this event.",
            });
        }

        if (
            event.maxAttendees !== null &&
            event.maxAttendees !== undefined &&
            event.registrations.length >= event.maxAttendees
        ) {
            return res.status(400).json({
                success: false,
                message: "This event has reached its registration limit.",
            });
        }

        event.registrations.push({
            user: userId,
            registeredAt: new Date(),
        });

        await event.save();

        return res.status(200).json({
            success: true,
            message: "Event registration successful.",
            event: formatEvent(event, userId),
        });
    } catch (error) {
        console.error("Event registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to register for this event.",
        });
    }
});

// ============================================
// CANCEL EVENT REGISTRATION
// Student access only
// DELETE /api/events/:id/register
// ============================================

router.delete("/:id/register", verifyToken, async (req, res) => {
    try {
        if (req.user?.role !== "student") {
            return res.status(403).json({
                success: false,
                message:
                    "Only students can cancel their registrations.",
            });
        }

        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID.",
            });
        }

        const userId = req.user?._id || req.user?.id;

        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }

        const registrationIndex = event.registrations.findIndex(
            (registration) =>
                String(registration.user?._id || registration.user) ===
                String(userId)
        );

        if (registrationIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "You are not registered for this event.",
            });
        }

        event.registrations.splice(registrationIndex, 1);

        await event.save();

        return res.status(200).json({
            success: true,
            message: "Event registration cancelled successfully.",
            event: formatEvent(event, userId),
        });
    } catch (error) {
        console.error("Cancel event registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to cancel event registration.",
        });
    }
});

export default router;
