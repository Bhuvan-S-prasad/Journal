import { OpenRouter } from '@openrouter/sdk';
import { z } from "zod";
import { getAllCategories, createCategory } from "@/lib/actions/Category.actions";


const openRouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
});

const CategoryResponseSchema = z.object({
    categoryAction: z.enum(["existing", "new"]),
    categoryId: z.string().optional(),
    newCategoryTitle: z.string().optional(),
    newCategoryColor: z.string().optional(),
    reasoning: z.string(),
});

export async function POST(req: Request) {
    try {
        const { title, content, userId } = await req.json();

        if (!userId) {
            return new Response("Unauthorized", { status: 401 });
        }

        if (!content || content.trim() === "") {
            return new Response("Content is required", { status: 400 });
        }

        console.log("Categorizing entry:", {
            title,
            contentLength: content.length,
        });

        // Fetch existing categories
        const existingCategories = await getAllCategories();

        console.log(
            `Found ${existingCategories.length} existing categories:`,
            existingCategories.map((c: any) => c.title)
        );

        // Prepare entry text
        const entryText = title
            ? `Title: ${title}\n\nContent: ${content}`
            : content;

        // Prompt
        const prompt = `You are a categorization expert for a personal journal application.

Analyze the following journal entry and determine the most appropriate category:

${entryText}

EXISTING CATEGORIES:
${existingCategories
                .map((c: any) => `- ${c.title} (ID: ${c._id}) [Color: ${c.color || "none"}]`)
                .join("\n")}

INSTRUCTIONS:
1. Review existing categories. MATCH EXISTING if closer than 70%.
2. Create NEW category only if distinct theme.
3. OUTPUT MUST BE VALID JSON ONLY. NO MARKDOWN. NO CODE BLOCKS.
4. JSON STRUCTURE:
{
  "categoryAction": "existing" | "new",
  "categoryId": "string (ID if existing, empty string if new)",
  "newCategoryTitle": "string (Title if new, empty string if existing)",
  "newCategoryColor": "string (Hex color if new, empty string if existing)",
  "reasoning": "string"
}

When creating new:
- "Theme & Subtheme" style (e.g. "Work & Career")
- Concise (2-4 words)
- Hex color provided

RESPOND ONLY WITH THE JSON OBJECT.`;

        // OpenRouter API 
        const completion = await openRouter.chat.send({
            model: "xiaomi/mimo-v2-flash:free",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],

        });

        const rawContent = completion.choices[0]?.message?.content;

        if (!rawContent) {
            throw new Error("No content received from AI");
        }

        let contentString = "";
        if (Array.isArray(rawContent)) {
            contentString = rawContent
                .filter((item: any) => item.type === 'text')
                .map((item: any) => item.text || '')
                .join('');
        } else {
            contentString = rawContent as string;
        }

        console.log("AI Raw Response:", contentString);

        // Clean and Parse JSON
        const cleanedContent = contentString.replace(/```json\n?|\n?```/g, "").trim();

        let parsedData;
        try {
            parsedData = JSON.parse(cleanedContent);
        } catch (e) {
            console.error("Failed to parse JSON:", cleanedContent);
            return new Response("AI returned invalid JSON", { status: 500 });
        }

        // Validate with Zod
        const result = CategoryResponseSchema.parse(parsedData);

        // Handle Category Creation/Selection using Server Actions
        let categoryId: string;
        let categoryTitle: string;

        if (result.categoryAction === "existing") {
            if (!result.categoryId || !result.categoryId.trim()) {
                const match = existingCategories.find((c: any) => c.title === result.newCategoryTitle); // heuristic
                if (match) {
                    categoryId = String(match._id);
                    categoryTitle = match.title;
                } else {
                    return new Response("Category ID missing for existing category", { status: 400 });
                }
            } else {
                const existingCategory = existingCategories.find(
                    (c: any) => String(c._id) === result.categoryId
                );

                if (!existingCategory) {
                    console.warn(`AI selected non-existent category ID: ${result.categoryId}. Falling back to creating new.`);

                    const newTitle = result.categoryId || "General";
                    const newColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 80%)`;

                    const newCategory = await createCategory({
                        title: newTitle,
                        color: newColor
                    });

                    categoryId = String(newCategory._id);
                    categoryTitle = newCategory.title;
                } else {
                    categoryId = String(existingCategory._id);
                    categoryTitle = existingCategory.title;
                }
            }
        } else {
            const newTitle = result.newCategoryTitle || "General";
            const newColor = result.newCategoryColor || `hsl(${Math.floor(Math.random() * 360)}, 70%, 80%)`;

            const newCategory = await createCategory({
                title: newTitle,
                color: newColor
            });

            categoryId = String(newCategory._id);
            categoryTitle = newCategory.title;
        }

        return Response.json({
            categoryId,
            categoryTitle,
            action: result.categoryAction,
            reasoning: result.reasoning,
        });

    } catch (error) {
        console.error("Error in categorization:", error);
        if (error instanceof Error) {
            console.error(error.stack);
        }
        return new Response(
            `Failed to categorize entry: ${error instanceof Error ? error.message : "Unknown error"}`,
            { status: 500 }
        );
    }
}
