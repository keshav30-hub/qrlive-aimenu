import {AppSidebar} from '@/components/layout/sidebar';
import {SidebarProvider} from '@/components/ui/sidebar';
import DashboardPage from './dashboard/page';

export default function Home() {
  return (
    <div className="h-screen overflow-hidden">
      <div className="flex h-full">
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
            <DashboardPage />
          </main>
        </SidebarProvider>
      </div>
    </div>
  );
}
