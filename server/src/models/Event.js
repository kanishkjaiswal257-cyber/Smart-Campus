import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
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
            maxlength: 3000,
        },

        category: {
            type: String,
            enum: [
                "Academic",
                "Cultural",
                "Sports",
                "Workshop",
                "Seminar",
                "General",
            ],
            default: "General",
        },

        location: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        eventDate: {
            type: Date,
            required: true,
        },

        registrationDeadline: {
            type: Date,
            default: null,
        },

        maxAttendees: {
            type: Number,
            min: 1,
            default: null,
        },

        status: {
            type: String,
            enum: ["Draft", "Published", "Cancelled"],
            default: "Published",
        },

        registrations: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },

                registeredAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }


);

eventSchema.index({
    status: 1,
    eventDate: 1,
});

const Event = mongoose.model("Event", eventSchema);

export default Event;
