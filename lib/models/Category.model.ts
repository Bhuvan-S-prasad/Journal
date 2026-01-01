import mongoose, { Schema } from "mongoose";

const CategorySchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },

        color: {
            type: String,
            match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
            default: null
        }
    },
    {
        timestamps: false
    }
);

export default mongoose.models.Category || mongoose.model("Category", CategorySchema);
