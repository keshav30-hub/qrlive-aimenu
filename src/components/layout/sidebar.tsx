'use client';

import {
  BookOpen,
  LayoutDashboard,
  ListTodo,
  LogOut,
  MessageSquare,
  Settings,
  QrCode,
  Calendar,
  Users,
  Volume2,
  VolumeX,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useTaskNotification } from '@/context/TaskNotificationContext';
import { useFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export function AppSidebar() {
  const { isMuted, toggleMute, unlockAudio } = useTaskNotification();
  const { auth } = useFirebase();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleMuteToggle = () => {
    unlockAudio(); // Ensure audio is unlocked on first click
    toggleMute();
  }

  return (
    <Sidebar className="w-[10%]" collapsible="none">
      <SidebarHeader>
        <h2 className="text-2xl font-bold text-sidebar-foreground">QRLIVE</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard">
              <SidebarMenuButton>
                <LayoutDashboard />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/dashboard/menu">
              <SidebarMenuButton>
                <BookOpen />
                <span>Menu</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/dashboard/tasks">
              <SidebarMenuButton>
                <ListTodo />
                <span>Tasks</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/dashboard/feedback">
              <SidebarMenuButton>
                <MessageSquare />
                <span>Feedback</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/dashboard/setupqrmenu">
              <SidebarMenuButton>
                <QrCode />
                <span>QR Menu</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/dashboard/events">
              <SidebarMenuButton>
                <Calendar />
                <span>Events</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/dashboard/staff">
              <SidebarMenuButton>
                <Users />
                <span>Staff</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/dashboard/captain">
              <SidebarMenuButton>
                <UserCheck />
                <span>Captain</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/dashboard/settings">
              <SidebarMenuButton>
                <Settings />
                <span>Settings</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleMuteToggle}>
              {isMuted ? <VolumeX /> : <Volume2 />}
              <span>{isMuted ? 'Sound Off' : 'Sound On'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
