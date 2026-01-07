import mongoose, { Schema, Types } from "mongoose";

const JournalSchema = new Schema(
    {
        title: {
            type: String,
            maxlength: 100
        },

        content: {
            type: String,
            required: true
        },

        mood: {
            type: String,
            enum: ["calm", "happy", "grateful", "reflective", "stressed"],
            required: true
        },

        userId: {
            type: String,
            required: true,
            index: true
        },

        aiGeneratedCategory: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: false
        },

        image: [String],

        createdAt: {
            type: Date,
            default: Date.now
        }

    },
    { timestamps: false }
);

if (mongoose.models.Journal) {
    delete mongoose.models.Journal;
}

export default mongoose.model("Journal", JournalSchema);
