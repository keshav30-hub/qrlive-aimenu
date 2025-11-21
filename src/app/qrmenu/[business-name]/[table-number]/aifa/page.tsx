'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function AIFAPage() {
    const router = useRouter();

    return (
        <div className="bg-gray-100 dark:bg-black min-h-screen">
            <div className="max-w-[480px] mx-auto bg-white dark:bg-gray-950 shadow-lg relative min-h-screen">
                <header className="p-4 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-950 z-10 border-b">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <h1 className="text-xl font-bold capitalize">AI Food Assistant</h1>
                    </div>
                </header>
                <main className="p-4 flex flex-col items-center justify-center text-center h-[calc(100vh-80px)]">
                    <h2 className="text-2xl font-bold mb-4">Coming Soon!</h2>
                    <p className="text-muted-foreground">Our AI Food Assistant, "AIFA", is being prepared by our top chefs. It will soon be ready to help you with menu suggestions, allergen information, and more!</p>
                </main>
            </div>
        </div>
    );
}
