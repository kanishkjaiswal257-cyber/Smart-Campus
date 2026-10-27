import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import connectDB from "./config/db.js";

import User from "./models/User.js";
import Material from "./models/Material.js";
import Notice from "./models/Notice.js";
import Event from "./models/Event.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import noticeRoutes from "./routes/noticeRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import bookmarkRoutes from "./routes/bookmarkRoutes.js";

import {
  verifyToken,
  requireAdmin,
} from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors());
app.use(express.json());

// ============================================
// API ROUTES
// ============================================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/notifications", notificationRoutes);

// Faculty Directory API
app.use("/api/faculty", facultyRoutes);

app.use("/api/events", eventRoutes);
app.use("/api/bookmarks", bookmarkRoutes);

// ============================================
// ADMIN DASHBOARD STATISTICS
// ADMIN ACCESS ONLY
// ============================================

app.get(
  "/api/dashboard/stats",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [
        totalStudents,
        totalTeachers,
        totalMaterials,
        publishedNotices,
      ] = await Promise.all([
        User.countDocuments({
          role: "student",
          isActive: { $ne: false },
        }),

        User.countDocuments({
          role: "teacher",
          isActive: { $ne: false },
        }),

        Material.countDocuments(),

        Notice.countDocuments({
          status: "Published",
        }),
      ]);

      return res.status(200).json({
        success: true,
        stats: {
          totalStudents,
          totalTeachers,
          totalMaterials,
          publishedNotices,
        },
      });
    } catch (error) {
      console.error("Dashboard statistics error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load dashboard statistics.",
      });
    }
  }
);

// ============================================
// ADMIN DASHBOARD RECENT ACTIVITIES
// ADMIN ACCESS ONLY
// ============================================

app.get(
  "/api/dashboard/activities",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [users, materials, notices, events] = await Promise.all([
        User.find({
          role: { $in: ["student", "teacher"] },
        })
          .select("name role createdAt")
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),

        Material.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),

        Notice.find({
          status: "Published",
        })
          .select("title createdAt publishedAt")
          .sort({ publishedAt: -1, createdAt: -1 })
          .limit(10)
          .lean(),

        Event.find()
          .select("title createdAt")
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
      ]);

      const activities = [];

      // User account activities
      users.forEach((user) => {
        activities.push({
          id: `user-${user._id}`,
          title:
            user.role === "student"
              ? "New student account created"
              : "New teacher account created",
          description: `${user.name || "A user"} account was added to the portal.`,
          icon: user.role === "student" ? "🎓" : "👨‍🏫",
          createdAt: user.createdAt || null,
        });
      });

      // Study material activities
      materials.forEach((material) => {
        const materialTitle =
          material.title ||
          material.name ||
          material.originalName ||
          material.fileName ||
          "Study material";

        activities.push({
          id: `material-${material._id}`,
          title: "Study material uploaded",
          description: `${materialTitle} was added to the portal.`,
          icon: "📚",
          createdAt: material.createdAt || null,
        });
      });

      // Published notice activities
      notices.forEach((notice) => {
        activities.push({
          id: `notice-${notice._id}`,
          title: "College notice published",
          description: `${notice.title} was published on the portal.`,
          icon: "📢",
          createdAt: notice.publishedAt || notice.createdAt || null,
        });
      });

      // Event activities
      events.forEach((event) => {
        activities.push({
          id: `event-${event._id}`,
          title: "College event created",
          description: `${event.title} was added to the event list.`,
          icon: "📅",
          createdAt: event.createdAt || null,
        });
      });

      // Sort activities by newest date
      activities.sort((a, b) => {
        const dateA = a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;

        const dateB = b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;

        return dateB - dateA;
      });

      return res.status(200).json({
        success: true,
        total: activities.length,
        activities: activities.slice(0, 8),
      });
    } catch (error) {
      console.error("Recent activities error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load recent activities.",
      });
    }
  }
);

// ============================================
// SERVE UPLOADED STUDY MATERIALS
// ============================================

app.use(
  "/uploads/materials",
  express.static(path.resolve("uploads/materials"))
);

// ============================================
// ROOT ROUTE
// ============================================

app.get("/", (req, res) => {
  res.send("Smart Campus Backend is running successfully!");
});

// ============================================
// TEST MONGODB CONNECTION AND USER MODEL
// ============================================

app.get("/api/test-db", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    return res.status(200).json({
      success: true,
      message: "MongoDB is working with the User model!",
      totalUsers,
    });
  } catch (error) {
    console.error("Database query error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Database query failed",
    });
  }
});

// ============================================
// START SERVER AFTER CONNECTING TO MONGODB
// ============================================

const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(
        `Smart Campus Backend running on http://localhost:${PORT}`
      );
      console.log(
        `Faculty Directory API: http://localhost:${PORT}/api/faculty`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();