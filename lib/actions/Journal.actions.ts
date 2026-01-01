"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import Journal from "../models/Journal.model";
import { connectToDB } from "../mongoose";

interface CreateJournalParams {
    title?: string;
    content: {
        type: "text" | "image";
        text?: string;
        image?: {
            url: string;
            alt?: string;
            caption?: string;
        };
    }[];
    mood: "very-sad" | "sad" | "neutral" | "happy" | "very-happy";
    userId: string;
    aiGeneratedCategory?: string;
}

interface UpdateJournalParams {
    journalId: string;
    title?: string;
    content?: {
        type: "text" | "image";
        text?: string;
        image?: {
            url: string;
            alt?: string;
            caption?: string;
        };
    }[];
    mood?: "very-sad" | "sad" | "neutral" | "happy" | "very-happy";
    aiGeneratedCategory?: string;
}

export async function createJournal({
    title,
    content,
    mood,
    userId,
    aiGeneratedCategory,
}: CreateJournalParams) {
    try {
        const { userId: authenticatedUserId } = await auth();

        if (!authenticatedUserId || authenticatedUserId !== userId) {
            throw new Error("Unauthorized");
        }

        if (!title || typeof title !== "string" || title.trim().length === 0) {
            throw new Error("Title is required and must be a non-empty string");
        }

        if (!content || !Array.isArray(content) || content.length === 0) {
            throw new Error("Content is required and cannot be empty");
        }

        const validMoods = ["very-sad", "sad", "neutral", "happy", "very-happy"];
        if (!validMoods.includes(mood)) {
            throw new Error("Invalid mood provided");
        }

        await connectToDB();

        const newJournal = await Journal.create({
            title,
            content,
            mood,
            userId,
            aiGeneratedCategory,
        });

        revalidatePath("/entries");
        revalidatePath("/profile");
        return JSON.parse(JSON.stringify(newJournal));
    } catch (error: any) {
        throw new Error(`Failed to create journal: ${error.message}`);
    }
}

export async function getJournalById(journalId: string) {
    try {
        await connectToDB();

        const journal = await Journal.findById(journalId);

        if (!journal) {
            throw new Error("Journal not found");
        }

        return JSON.parse(JSON.stringify(journal));
    } catch (error: any) {
        throw new Error(`Failed to fetch journal: ${error.message}`);
    }
}

export async function getJournalsByUser(userId: string) {
    try {
        await connectToDB();

        const journals = await Journal.find({ userId }).sort({ createdAt: -1 });

        return JSON.parse(JSON.stringify(journals));
    } catch (error: any) {
        throw new Error(`Failed to fetch user journals: ${error.message}`);
    }
}

export async function updateJournal({
    journalId,
    title,
    content,
    mood,
    aiGeneratedCategory,
}: UpdateJournalParams) {
    try {
        await connectToDB();

        const updatedJournal = await Journal.findByIdAndUpdate(
            journalId,
            {
                title,
                content,
                mood,
                aiGeneratedCategory,
            },
            { new: true }
        );

        if (!updatedJournal) {
            throw new Error("Journal not found");
        }

        revalidatePath(`/journal/${journalId}`);
        revalidatePath("/entries");
        revalidatePath("/profile");
        return JSON.parse(JSON.stringify(updatedJournal));
    } catch (error: any) {
        throw new Error(`Failed to update journal: ${error.message}`);
    }
}

export async function deleteJournal(journalId: string) {
    try {
        await connectToDB();

        const deletedJournal = await Journal.findByIdAndDelete(journalId);

        if (!deletedJournal) {
            throw new Error("Journal not found");
        }

        revalidatePath("/entries");
        revalidatePath("/profile");
        return JSON.parse(JSON.stringify(deletedJournal));
    } catch (error: any) {
        throw new Error(`Failed to delete journal: ${error.message}`);
    }
}
