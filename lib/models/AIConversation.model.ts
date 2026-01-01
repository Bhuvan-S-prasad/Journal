import mongoose, { Schema, Types } from "mongoose";

const MessageSchema = new Schema(
    {
        role: {
            type: String,
            enum: ["user", "assistant"],
            required: true
        },

        content: {
            type: String,
            required: true
        },

        timestamp: {
            type: Date,
            default: Date.now,
            required: true
        },

        relatedEntries: [
            {
                type: Types.ObjectId,
                ref: "Journal"
            }
        ]
    },
    { _id: false }
);


const AIConversationSchema = new Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true
        },

        messages: {
            type: [MessageSchema],
            default: []
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true
        },

        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: false
    }
);


AIConversationSchema.index(
    { userId: 1 },
    { unique: true, partialFilterExpression: { isActive: true } }
);


export default mongoose.models.AIConversation || mongoose.model("AIConversation", AIConversationSchema);
