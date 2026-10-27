import Material from "../models/Material.js";
import fs from "fs/promises";
import path from "path";

export const uploadMaterial = async (req, res) => {
    let savedFilePath;

    try {
        const {
            title,
            description,
            subject,
            semester
        } = req.body;

        if (!title?.trim() || !subject?.trim() || !semester) {
            if (req.file) {
                await fs.unlink(req.file.path).catch(() => {});
            }

            return res.status(400).json({
                success: false,
                message: "Title, subject and semester are required."
            });
        }

        const semesterNumber = Number(semester);

        if (
            !Number.isInteger(semesterNumber) ||
            semesterNumber < 1 ||
            semesterNumber > 8
        ) {
            if (req.file) {
                await fs.unlink(req.file.path).catch(() => {});
            }

            return res.status(400).json({
                success: false,
                message: "Semester must be between 1 and 8."
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a study material file."
            });
        }

        savedFilePath = req.file.path;

        const material = await Material.create({
            title: title.trim(),
            description: description?.trim() || "",
            subject: subject.trim(),
            semester: semesterNumber,
            fileUrl: `/uploads/materials/${req.file.filename}`,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            uploadedBy: req.user._id
        });

        return res.status(201).json({
            success: true,
            message: "Study material uploaded successfully.",
            material
        });
    } catch (error) {
        if (savedFilePath) {
            await fs.unlink(savedFilePath).catch(() => {});
        }

        console.error("Upload material error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to upload study material."
        });
    }
};

export const getMyMaterials = async (req, res) => {
    try {
        const materials = await Material.find({
            uploadedBy: req.user._id
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            total: materials.length,
            materials
        });
    } catch (error) {
        console.error("Fetch materials error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch study materials."
        });
    }
};

export const deleteMaterial = async (req, res) => {
    try {
        const material = await Material.findOne({
            _id: req.params.id,
            uploadedBy: req.user._id
        });

        if (!material) {
            return res.status(404).json({
                success: false,
                message: "Material not found or you do not own it."
            });
        }

        const filePath = path.resolve(
            "uploads/materials",
            path.basename(material.fileUrl)
        );

        await material.deleteOne();

        await fs.unlink(filePath).catch((error) => {
            if (error.code !== "ENOENT") {
                console.error("File deletion error:", error.message);
            }
        });

        return res.status(200).json({
            success: true,
            message: "Study material deleted successfully."
        });
    } catch (error) {
        console.error("Delete material error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to delete study material."
        });
    }
};