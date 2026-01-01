import mongoose, { Schema, Types } from "mongoose";

const ContentBlockSchema = new Schema(
    {
        type: {
            type: String,
            enum: ["text", "image"],
            required: true
        },

        text: String,

        image: {
            url: String,
            alt: String,
            caption: String
        }
    },
    { _id: false }
);

const JournalSchema = new Schema(
    {
        title: {
            type: String,
            maxlength: 100
        },

        content: {
            type: [ContentBlockSchema],
            required: true
        },

        mood: {
            type: String,
            enum: ["very-sad", "sad", "neutral", "happy", "very-happy"],
            required: true
        },

        userId: {
            type: String,
            required: true,
            index: true
        },

        aiGeneratedCategory: {
            type: Types.ObjectId,
            ref: "Category",
            immutable: true
        },

        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: false }
);

export default mongoose.models.Journal || mongoose.model("Journal", JournalSchema);
