"use client";

import { ChangeEvent, useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
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
    content: z.string().min(1, "Content is required"),
    image: z.array(z.string()).optional(),
});

const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, React.ComponentProps<typeof Textarea>>((props, ref) => {
    const { value, onChange, className, ...rest } = props;
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    return (
        <Textarea
            {...rest}
            value={value}
            ref={textareaRef}
            onChange={(e) => {
                adjustHeight();
                onChange?.(e);
            }}
            className={cn("overflow-hidden resize-none min-h-[50px]", className)}
            rows={1}
        />
    );
});
AutoResizeTextarea.displayName = "AutoResizeTextarea";

function EntryForm() {
    const router = useRouter();
    const { userId } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [fileUrls, setFileUrls] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { startUpload } = useUploadThing("media", {
        onUploadProgress: (progress) => {
            console.log("Upload progress:", progress);
        },
        onClientUploadComplete: (res) => {
            console.log("Client upload complete", res);
        },
        onUploadError: (error) => {
            console.error("Upload error encounterd", error);
        }
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            mood: "calm",
            content: "",
            image: [],
        },
    });

    const content = form.watch("content");

    const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();

        setIsUploading(true);

        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);

            if (files.length + newFiles.length > 4) {
                alert("You can only upload up to 4 images.");
                return;
            }

            setFiles(prev => [...prev, ...newFiles]);

            newFiles.forEach(file => {
                if (!file.type.includes('image')) return;

                const fileReader = new FileReader();
                fileReader.onload = (event) => {
                    const imageDataUrl = event.target?.result?.toString() || '';
                    setFileUrls(prev => [...prev, imageDataUrl]);
                }
                fileReader.readAsDataURL(file);
            });
        }
        setIsUploading(false);
    }

    const removeImage = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setFileUrls(prev => prev.filter((_, i) => i !== index));
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            let uploadedImageUrls: string[] = [];

            if (!userId) {
                return;
            }

            if (files.length > 0) {
                try {
                    console.log("Starting image upload...");
                    const uploadPromise = startUpload(files);
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("Upload timed out")), 60000)
                    );

                    const imgRes = await Promise.race([uploadPromise, timeoutPromise]) as any;

                    if (imgRes && imgRes.length > 0) {
                        uploadedImageUrls = imgRes.map((res: any) => res.ufsUrl);

                        uploadedImageUrls = imgRes.map((res: any) => res.url || res.ufsUrl);

                        console.log("Images uploaded successfully", uploadedImageUrls);
                    } else {
                        console.error("Image upload failed or returned no results");
                        throw new Error("Upload failed (no results)");
                    }
                } catch (uploadError) {
                    console.error("Error uploading images:", uploadError);
                    alert("Failed to upload images: " + (uploadError instanceof Error ? uploadError.message : "Unknown error"));
                    setIsSubmitting(false);
                    return;
                }
            }


            // AI Categorization
            let categoryId = "";
            try {
                console.log("Categorizing entry...");
                const categoryRes = await fetch("/api/categorize", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: values.title,
                        content: values.content,
                        userId,
                    }),
                });

                if (categoryRes.ok) {
                    const data = await categoryRes.json();
                    categoryId = data.categoryId;
                    console.log("Category assigned:", data.categoryTitle);
                } else {
                    console.warn("Categorization failed, proceeding without category");
                }
            } catch (error) {
                console.error("Error categorizing entry:", error);
            }

            console.log("Submitting journal entry with params:", { ...values, imageCount: uploadedImageUrls.length, categoryId });

            await createJournal({
                title: values.title,
                mood: values.mood,
                content: values.content,
                image: uploadedImageUrls,
                userId,
                aiGeneratedCategory: categoryId,
            });

            console.log("Entry created successfully");
            router.push("/entries");
        } catch (error) {
            console.error("Error submitting entry:", error);
            alert("Failed to create journal entry. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }


    if (!userId) {
        return null;
    }

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
                                    className="text-4xl font-serif font-bold border-none shadow-none focus-visible:ring-background px-0 py-6 h-auto placeholder:text-muted-foreground/50 bg-transparent"
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
                        <span>How was your day?</span>
                    </div>

                    <div className="space-y-4 min-h-[225px]">
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <AutoResizeTextarea
                                            {...field}
                                            placeholder="Start writing your thoughts..."
                                            className="border-none shadow-none focus-visible:ring-background px-0 min-h-[100px] text-lg leading-relaxed bg-transparent placeholder:text-muted-foreground/50"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {fileUrls.length > 0 && (
                            <div className={`mt-4 ${fileUrls.length > 1
                                ? "flex gap-3 overflow-x-auto pb-2 h-64"
                                : ""
                                }`}>
                                {fileUrls.map((url, index) => (
                                    <div
                                        key={index}
                                        className={`relative rounded-xl overflow-hidden border bg-muted group ${fileUrls.length === 1
                                            ? "w-full max-h-[500px]"
                                            : "h-full shrink-0 aspect-3/4"
                                            }`}
                                    >
                                        <img
                                            src={url}
                                            alt={`Entry image ${index + 1}`}
                                            className={`${fileUrls.length === 1
                                                ? "w-full h-auto object-cover"
                                                : "w-full h-full object-cover"
                                                }`}
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeImage(index)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Toolbar / Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t">
                        <div className="relative">
                            <input
                                type="file"
                                id="image-upload"
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleImage}
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
                    <Button type="submit"
                        className="bg-primary text-white hover:bg-chart-5 hover:text-primary"
                        disabled={isSubmitting || isUploading}
                        size="lg">
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Entry
                    </Button>
                </div>
            </form>
        </Form >
    );
}

export default EntryForm;