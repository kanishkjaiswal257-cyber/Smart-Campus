import Notice from "../models/Notice.js";

// GET: All published notices
export const getPublishedNotices = async (req, res) => {
  try {
    const notices = await Notice.find({ status: "Published" })
      .populate("createdBy", "name role")
      .sort({ publishedAt: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notices.length,
      notices,
    });
  } catch (error) {
    console.error("Get notices error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch notices.",
    });
  }
};

// GET: All notices for admin
export const getAllNotices = async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notices.length,
      notices,
    });
  } catch (error) {
    console.error("Get all notices error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch notices.",
    });
  }
};

// POST: Create a notice
export const createNotice = async (req, res) => {
  try {
    const { title, description, category, priority, status } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required.",
      });
    }

    const noticeStatus = status === "Draft" ? "Draft" : "Published";

    const notice = await Notice.create({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status: noticeStatus,
      createdBy: req.user._id,
      publishedAt:
        noticeStatus === "Draft" ? null : new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Notice created successfully.",
      notice,
    });
  } catch (error) {
    console.error("Create notice error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to create notice.",
    });
  }
};

// PUT: Update a notice
export const updateNotice = async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "description",
      "category",
      "priority",
      "status",
    ];

    const updates = {};

    // Collect only permitted fields
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Validate title
    if (
      updates.title !== undefined &&
      (typeof updates.title !== "string" ||
        !updates.title.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Title cannot be empty.",
      });
    }

    // Validate description
    if (
      updates.description !== undefined &&
      (typeof updates.description !== "string" ||
        !updates.description.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Description cannot be empty.",
      });
    }

    // Remove unnecessary spaces
    if (updates.title !== undefined) {
      updates.title = updates.title.trim();
    }

    if (updates.description !== undefined) {
      updates.description = updates.description.trim();
    }

    // Find the existing notice
    const existingNotice = await Notice.findById(
      req.params.id
    );

    if (!existingNotice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found.",
      });
    }

    // Set publication date only when a draft is published
    // for the first time.
    if (
      updates.status === "Published" &&
      existingNotice.status !== "Published"
    ) {
      updates.publishedAt = new Date();
    }

    // Update the notice
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Notice updated successfully.",
      notice,
    });
  } catch (error) {
    console.error("Update notice error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to update notice.",
    });
  }
};

// DELETE: Delete a notice
export const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(
      req.params.id
    );

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notice deleted successfully.",
    });
  } catch (error) {
    console.error("Delete notice error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to delete notice.",
    });
  }
};
