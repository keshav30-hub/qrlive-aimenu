
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { ChevronLeft, Send, Sparkles } from "lucide-react";
import { useState } from "react";

type Message = {
    id: number;
    sender: 'user' | 'aifa';
    text: string;
};

export default function AIFAPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            sender: 'aifa',
            text: "Hey there! I'm AIFA, your personal food guru. I'm like a genie in a bottle, but for your cravings. What culinary adventure are we embarking on today?"
        },
        {
            id: 2,
            sender: 'user',
            text: "I'm feeling a bit down, suggest something comforting."
        },
        {
            id: 3,
            sender: 'aifa',
            text: "I've prescribed you a dose of our cheesiest Margherita Pizza. It's clinically proven to lift spirits. Side effects may include extreme happiness and ordering another one."
        }
    ]);
    const [inputValue, setInputValue] = useState('');

    const handleSendMessage = () => {
        if (inputValue.trim()) {
            setMessages([...messages, { id: Date.now(), sender: 'user', text: inputValue.trim() }]);
            setInputValue('');
            // Here you would typically call your AI flow and get a response
        }
    };


    return (
        <div className="bg-gray-100 dark:bg-black min-h-screen">
            <div className="max-w-[480px] mx-auto bg-white dark:bg-gray-950 shadow-lg relative flex flex-col h-screen">
                <header className="p-4 flex items-center gap-2 sticky top-0 bg-white dark:bg-gray-950 z-10 border-b">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">AIFA</h1>
                        <p className="text-xs text-muted-foreground">powered by QRLIVE</p>
                    </div>
                </header>
                
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-6">
                        {messages.map(message => (
                            <div key={message.id} className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                                {message.sender === 'aifa' && (
                                    <Avatar className="h-8 w-8">
                                        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground">
                                            <Sparkles className="h-5 w-5" />
                                        </div>
                                    </Avatar>
                                )}
                                <div className={`rounded-lg px-4 py-2 max-w-[80%] ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-gray-200 dark:bg-gray-800'}`}>
                                    <p className="text-sm">{message.text}</p>
                                </div>
                             </div>
                        ))}
                    </div>
                </ScrollArea>

                <div className="p-4 bg-white dark:bg-gray-950 border-t">
                    <div className="flex items-center gap-2">
                        <Input 
                            placeholder="Ask me for suggestions..." 
                            className="flex-1"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button size="icon" onClick={handleSendMessage}>
                            <Send className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <footer className="text-center p-2 bg-gray-100 dark:bg-black">
                     <p className="text-xs text-muted-foreground">AIFA can make mistakes.</p>
                </footer>
            </div>
        </div>
    );
}
