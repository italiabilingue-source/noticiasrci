"use client"

import { NewsSlider } from "@/components/news/NewsSlider";
import { BreakingNewsTicker } from "@/components/news/BreakingNewsTicker";

export default function HomePage() {
    return (
        <>
            <NewsSlider />
            <BreakingNewsTicker />
        </>
    );
}
