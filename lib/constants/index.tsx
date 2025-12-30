import { BookOpen, BotMessageSquare, HomeIcon, NotebookPen, UserRound } from "lucide-react";

export const sidebarLinks = [
    {
        icon: <HomeIcon />,
        route: "/",
        label: "Home"
    },
    {
        icon: <BookOpen />,
        route: "/entries",
        label: "Entries"
    },
    {
        icon: <NotebookPen />,
        route: "/new-entry",
        label: "New Entry"
    },
    {
        icon: <BotMessageSquare />,
        route: "/ai-chat",
        label: "AI Chat",
    },
    {
        icon: <UserRound />,
        route: "/profile",
        label: "Profile"
    }
]