
'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LockScreenProps {
    onUnlock: (role: string, name: string) => void;
    adminCode?: string;
    staff: { id: string; name: string; accessCode?: string }[];
}

export function LockScreen({ onUnlock, adminCode, staff }: LockScreenProps) {
    const [inputCode, setInputCode] = useState('');
    const [error, setError] = useState(false);
    const { toast } = useToast();

    const handleUnlock = () => {
        if (adminCode && inputCode === adminCode) {
            onUnlock("Admin", "Admin");
            return;
        }

        const matchedStaff = staff.find(s => s.accessCode === inputCode);
        if (matchedStaff) {
            onUnlock("Staff", matchedStaff.name);
            return;
        }

        setError(true);
        setTimeout(() => setError(false), 500); // Reset error state for animation
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-black">
            <Dialog open={true}>
                <DialogContent
                    className={`sm:max-w-md ${error ? 'animate-shake' : ''}`}
                    onInteractOutside={(e) => e.preventDefault()}
                    hideCloseButton={true}
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Dashboard Locked
                        </DialogTitle>
                        <DialogDescription>
                            Please enter the access code to continue.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="access-code" className="text-right">
                                Code
                            </Label>
                            <Input
                                id="access-code"
                                type="password"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                                className="col-span-3"
                                placeholder="Enter 6-digit code"
                                maxLength={6}
                            />
                        </div>
                        {error && <p className="text-center text-sm text-destructive">Incorrect code. Please try again.</p>}
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUnlock} className="w-full">
                            Unlock
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <style jsx>{`
                @keyframes shake {
                    10%, 90% {
                        transform: translate3d(-1px, 0, 0);
                    }
                    20%, 80% {
                        transform: translate3d(2px, 0, 0);
                    }
                    30%, 50%, 70% {
                        transform: translate3d(-4px, 0, 0);
                    }
                    40%, 60% {
                        transform: translate3d(4px, 0, 0);
                    }
                }
                .animate-shake {
                    animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
                    transform: translate3d(0, 0, 0);
                }
            `}</style>
        </div>
    );
}

declare module "@/components/ui/dialog" {
    interface DialogContentProps {
        hideCloseButton?: boolean;
    }
}

    