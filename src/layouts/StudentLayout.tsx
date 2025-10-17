import { AppShell, Group, Text, Avatar, Menu, Button, NavLink, Burger } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { BottomNavigation } from '../components';
import { useResponsive } from '../hooks/useResponsive';
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Newspaper,
  LogOut,
  User,
} from 'lucide-react';

export function StudentLayout() {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { student, logoutStudent } = useStudentAuth();
  const { isMobile } = useResponsive();

  const handleLogout = () => {
    logoutStudent();
    navigate('/login-siswa');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard' },
    { icon: BookOpen, label: 'Kelas & Tugas', path: '/student/classroom' },
    { icon: Trophy, label: 'Leaderboard', path: '/student/leaderboard' },
    { icon: Newspaper, label: 'Newsroom', path: '/student/newsroom' },
  ];

  // Show loading or error if student data is not available
  if (!student) {
    return (
      <AppShell
        header={{ height: 60 }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Text size="lg" fw={700}>LMS - Siswa</Text>
          </Group>
        </AppShell.Header>
        <AppShell.Main>
          <div>Loading...</div>
        </AppShell.Main>
      </AppShell>
    );
  }

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
            <Text size="lg" fw={700}>LMS - Siswa</Text>
          </Group>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button variant="subtle" p={4}>
                <Group gap="xs">
                  <Avatar size={32} radius="xl" color="green">
                    {student.full_name.charAt(0)}
                  </Avatar>
                  <Text size="sm" hiddenFrom="xs">{student.full_name}</Text>
                </Group>
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>{student.email}</Menu.Label>
              <Menu.Item
                leftSection={<User size={16} />}
                onClick={() => navigate('/student/profile')}
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
      <BottomNavigation role="student" />
    </AppShell>
  );
}
