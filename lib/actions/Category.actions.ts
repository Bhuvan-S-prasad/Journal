"use server";

import { connectToDB } from "@/lib/mongoose";
import Category from "@/lib/models/Category.model";

export async function getAllCategories() {
    try {
        await connectToDB();
        const categories = await Category.find().sort({ title: 1 }).lean();
        return JSON.parse(JSON.stringify(categories));
    } catch (error) {
        console.error("Error fetching categories:", error);
        throw new Error("Failed to fetch categories");
    }
}

export async function getCategoryByTitle(title: string) {
    try {
        await connectToDB();
        const category = await Category.findOne({ title }).lean();
        return category ? JSON.parse(JSON.stringify(category)) : null;
    } catch (error) {
        console.error("Error fetching category by title:", error);
        throw new Error("Failed to fetch category by title");
    }
}

export async function createCategory({ title, color }: { title: string; color: string }) {
    try {
        await connectToDB();

        // Check for existing category 
        const existing = await Category.findOne({ title });
        if (existing) {
            return JSON.parse(JSON.stringify(existing));
        }

        const newCategory = await Category.create({ title, color });
        return JSON.parse(JSON.stringify(newCategory));
    } catch (error) {
        console.error("Error creating category:", error);
        throw new Error("Failed to create category");
    }
}