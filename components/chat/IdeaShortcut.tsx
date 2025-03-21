import React from 'react';
import { IoMdArrowUp } from "react-icons/io";

interface IdeaShortcutProps {
  onSelect?: (idea: string) => void;
}

const ideas = [
    {
        label: 'cafe Landing page',
        content: `A landing page for a cafe with a modern design.`
    },
    {
        label: 'Job board',
        content: `A job board application with:
• Search and filter by location/type
• Company profiles
• Job detail pages
Just the UI first, I'll add Supabase for data persistence later.`
    },
    {
        label: 'Social media feed',
        content: `A social media feed with posts, likes, comments and infinite scroll. Include a stories feature at the top like Instagram. Just the UI first.`
    },
    {
        label: 'Habit tracking app',
        content: `A minimal habit tracking app with daily streaks, monthly view and progress insights. Include habit categories and achievement badges.`
    },
    {
        label: 'Weather dashboard',
        content: `A weather dashboard using OpenWeatherMap API showing current weather, 5-day forecast and city search.

Let the user add their own API key in a local storage backed input and link to where to get the key, I'll add Supabase and my own API key there later.`
    },
    {
        label: 'E-commerce product page',
        content: `A modern e-commerce product page with image gallery, size/color variants, reviews section and related products. Focus on the UI/UX first, I'll integrate Supabase for product data later.`
    },
    {
        label: 'Task management app',
        content: `A task management app with categories, due dates, and priority levels. Include a calendar view and list view. Just the UI first, I'll add Supabase for data persistence later.`
    },
];

export default function IdeaShortcut({ onSelect }: IdeaShortcutProps) {
  const handleClick = (idea: string) => {
    if (onSelect) {
      onSelect(idea);
    }
  };

  return (
    <div className="relative flex max-w-full gap-1 mx-2">
      <div className="w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="flex gap-2.5 text-white dark:text-white">
          {ideas.map((idea, index) => (
            <button
              key={index}
              className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-zinc-800 px-3 py-1.5 transition-colors light:hover:bg-purple-600 dark:hover:border-purple-400"
              onClick={() => handleClick(idea.content)}
            >
              <p className="text-xs text-zinc-50">{idea.label}</p>
              <IoMdArrowUp className="shrink-0 h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
