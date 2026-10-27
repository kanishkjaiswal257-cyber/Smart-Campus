import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },


        itemType: {
            type: String,
            enum: ["Notice", "Event", "Material", "Faculty"],
            required: true,
        },

        itemId: {
            type: String,
            required: true,
            trim: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        description: {
            type: String,
            default: "",
            maxlength: 2000,
        },

        link: {
            type: String,
            default: "",
            maxlength: 300,
        },
    },
    {
        timestamps: true,
    }


);

// Prevent duplicate bookmarks for the same user and item.
bookmarkSchema.index(
    {
        user: 1,
        itemType: 1,
        itemId: 1,
    },
    {
        unique: true,
    }
);

const Bookmark = mongoose.model("Bookmark", bookmarkSchema);

export default Bookmark;
