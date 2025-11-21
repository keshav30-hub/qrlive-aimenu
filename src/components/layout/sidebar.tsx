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
import { useState } from 'react';

export function AppSidebar() {
  const [isAudioOn, setIsAudioOn] = useState(true);

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn);
    // Logic to play/mute notification sounds will go here
  };

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
            <Link href="/menu">
              <SidebarMenuButton>
                <BookOpen />
                <span>Menu</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/tasks">
              <SidebarMenuButton>
                <ListTodo />
                <span>Tasks</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/feedback">
              <SidebarMenuButton>
                <MessageSquare />
                <span>Feedback</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/setupqrmenu">
              <SidebarMenuButton>
                <QrCode />
                <span>QR Menu</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/events">
              <SidebarMenuButton>
                <Calendar />
                <span>Events</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/staff">
              <SidebarMenuButton>
                <Users />
                <span>Staff</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/settings">
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
            <SidebarMenuButton onClick={toggleAudio}>
              {isAudioOn ? <Volume2 /> : <VolumeX />}
              <span>{isAudioOn ? 'Sound On' : 'Sound Off'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="#">
              <SidebarMenuButton>
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
