"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useUploadThing } from "@/lib/uploadthing";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createJournal } from "@/lib/actions/Journal.actions";
import { Loader2, Image as ImageIcon, X, Smile, Frown, Meh, Sparkles, CloudRain } from "lucide-react";
import { cn } from "@/lib/utils";

const MOODS = [
    { value: "calm", label: "Calm", icon: CloudRain, color: "bg-blue-100 text-blue-700" },
    { value: "happy", label: "Happy", icon: Smile, color: "bg-yellow-100 text-yellow-700" },
    { value: "grateful", label: "Grateful", icon: Sparkles, color: "bg-purple-100 text-purple-700" },
    { value: "reflective", label: "Reflective", icon: Meh, color: "bg-orange-100 text-orange-700" },
    { value: "stressed", label: "Stressed", icon: Frown, color: "bg-red-100 text-red-700" },
] as const;

const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    mood: z.enum(["calm", "happy", "grateful", "reflective", "stressed"]),
    content: z.array(
        z.object({
            type: z.enum(["text", "image"]),
            text: z.string().optional(),
            image: z.object({
                url: z.string(),
                alt: z.string().optional(),
                caption: z.string().optional(),
            }).optional(),
        })
    ).min(1, "At least one content block is required"),
});

function EntryForm() {
    const router = useRouter();
    const { userId } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            mood: "calm",
            content: [{ type: "text", text: "" }],
        },
    });

    // UploadThing hook
    const { startUpload, isUploading } = useUploadThing("imageUploader", {
        onClientUploadComplete: (res) => {
            console.log("Upload completed", res);
            if (res && res[0]) {
                const fileUrl = res[0].url || res[0].ufsUrl; // @ts-ignore
                if (!fileUrl) {
                    alert("Upload failed: No URL returned");
                    return;
                }

                const currentContent = form.getValues("content");
                const newBlock = {
                    type: "image" as const,
                    image: { url: fileUrl, alt: res[0].name, caption: "" }
                };

                form.setValue("content", [
                    newBlock,
                    ...currentContent,
                ], { shouldValidate: true, shouldDirty: true, shouldTouch: true });

                alert("Image uploaded!");
            }
        },
        onUploadError: (e) => {
            console.error("Upload error:", e);
            alert("Upload failed, please try again.");
        }
    });



    const content = form.watch("content");

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!userId) return;

        try {
            setIsSubmitting(true);

            console.log("Submitting values:", values);

            await createJournal({
                ...values,
                userId: userId,
            });

            router.push("/");
            router.refresh();
        } catch (error) {
            console.error("Failed to create entry:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    // Handlers for image upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        startUpload([file]);
        e.target.value = ""; // Reset input
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto">
                {/* Mood Selection */}
                <div className="space-y-4">
                    <h2 className="text-muted-foreground">How are you feeling?</h2>
                    <FormField
                        control={form.control}
                        name="mood"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex flex-wrap gap-3">
                                    {MOODS.map((mood) => {
                                        const Icon = mood.icon;
                                        const isSelected = field.value === mood.value;
                                        return (
                                            <button
                                                key={mood.value}
                                                type="button"
                                                onClick={() => field.onChange(mood.value)}
                                                className={cn(
                                                    "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                                                    isSelected
                                                        ? mood.color + " ring-2 ring-offset-2 ring-offset-background ring-current font-medium"
                                                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                                )}
                                            >
                                                <div className={cn(
                                                    "p-1 rounded-full",
                                                    isSelected ? "bg-white/20" : "bg-transparent"
                                                )}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                {mood.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Title */}
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="Give your entry a title..."
                                    className="text-4xl font-serif font-bold border-none shadow-none px-0 py-6 h-auto placeholder:text-muted-foreground/50 focus-visible:ring-0 bg-transparent"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Content Editor */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Need a prompt?</span>
                    </div>

                    <div className="space-y-4 min-h-[300px]">
                        {content.map((block, index) => (
                            <div key={index} className="relative group">
                                {block.type === "text" && (
                                    <FormField
                                        control={form.control}
                                        name={`content.${index}.text`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        placeholder={index === 0 ? "Start writing your thoughts..." : "Continue writing..."}
                                                        className="border-none resize-none shadow-none focus-visible:ring-0 px-0 min-h-[100px] text-lg leading-relaxed bg-transparent"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {block.type === "image" && block.image && (
                                    <div className="relative rounded-lg overflow-hidden border bg-muted">
                                        <img
                                            src={block.image.url}
                                            alt={block.image.alt || "Entry image"}
                                            className="w-full h-auto max-h-[500px] object-contain"
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
                                            onClick={() => {
                                                const newContent = [...content];
                                                newContent.splice(index, 1);
                                                form.setValue("content", newContent);
                                            }}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Toolbar / Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t">
                        <div className="relative">
                            <input
                                type="file"
                                id="image-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={isUploading}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isUploading}
                                onClick={() => document.getElementById("image-upload")?.click()}
                            >
                                {isUploading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <ImageIcon className="w-4 h-4 mr-2" />
                                )}
                                Add Image
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting} size="lg">
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Entry
                    </Button>
                </div>
            </form>
        </Form>
    );
}

export default EntryForm;
