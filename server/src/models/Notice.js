
import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        category: {
            type: String,
            enum: ["General", "Academic", "Examination", "Event", "Holiday", "Urgent"],
            default: "General",
        },

        priority: {
            type: String,
            enum: ["Normal", "Important", "Urgent"],
            default: "Normal",
        },

        status: {
            type: String,
            enum: ["Draft", "Published"],
            default: "Published",
        },

        publishedAt: {
            type: Date,
            default: Date.now,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const Notice = mongoose.model("Notice", noticeSchema);

export default Notice;

