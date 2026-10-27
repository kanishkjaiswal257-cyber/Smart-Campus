import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        // NEW PASSWORD FIELD
        password: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: String,
            enum: ["student", "teacher", "admin"],
            required: true
        },

        crn: {
            type: String,
            trim: true,
            sparse: true,
            unique: true
        },

        employeeId: {
            type: String,
            trim: true,
            sparse: true,
            unique: true
        },

        department: {
            type: String,
            trim: true,
            default: ""
        },

        course: {
            type: String,
            trim: true,
            default: ""
        },

        semester: {
            type: Number,
            min: 1,
            max: 12
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;