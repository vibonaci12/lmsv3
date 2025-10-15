import { AppShell, Group, Text, Avatar, Menu, Button, NavLink, Burger } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Teacher } from '../types';
import { BottomNavigation } from '../components';
import { useResponsive } from '../hooks/useResponsive';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileText,
  LogOut,
  User,
} from 'lucide-react';

export function TeacherLayout() {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isMobile } = useResponsive();
  const teacher = user as Teacher;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher/dashboard' },
    { icon: BookOpen, label: 'Kelas', path: '/teacher/classes' },
    { icon: ClipboardList, label: 'Tugas', path: '/teacher/assignments' },
    { icon: FileText, label: 'Leaderboard', path: '/teacher/leaderboard' },
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'md',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
            <Text size="lg" fw={700}>LMS - Guru</Text>
          </Group>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button variant="subtle" p={4}>
                <Group gap="xs">
                  <Avatar size={32} radius="xl" color="blue">
                    {teacher.full_name.charAt(0)}
                  </Avatar>
                  <Text size="sm" hiddenFrom="xs">{teacher.full_name}</Text>
                </Group>
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>{teacher.email}</Menu.Label>
              <Menu.Item
                leftSection={<User size={16} />}
                onClick={() => navigate('/teacher/profile')}
              >
                Profil
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<LogOut size={16} />}
                onClick={handleLogout}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" visibleFrom="md">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            label={item.label}
            leftSection={<item.icon size={20} />}
            active={location.pathname === item.path}
            onClick={() => navigate(item.path)}
            mb={4}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main style={{ paddingBottom: isMobile ? '80px' : '0' }}>
        <Outlet />
      </AppShell.Main>
      
      {/* Bottom Navigation - Only visible on mobile */}
      <BottomNavigation role="teacher" />
    </AppShell>
  );
}
