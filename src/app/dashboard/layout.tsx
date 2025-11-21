'use client';
import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskNotificationProvider } from '@/context/TaskNotificationContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TaskNotificationProvider>
      <div className="h-screen overflow-hidden">
        <div className="flex h-full">
          <SidebarProvider>
            <AppSidebar />
            <main className="flex-1 overflow-y-auto bg-gray-100 p-4 dark:bg-black">
              {children}
            </main>
          </SidebarProvider>
        </div>
      </div>
    </TaskNotificationProvider>
  );
}
