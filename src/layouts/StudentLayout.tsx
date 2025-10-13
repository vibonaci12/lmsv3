import { AppShell, Burger, Group, Text, NavLink, Avatar, Menu, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Student } from '../types';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  BarChart3,
  LogOut,
  User,
} from 'lucide-react';

export function StudentLayout() {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const student = user as Student;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard' },
    { icon: BookOpen, label: 'Kelas Saya', path: '/student/classes' },
    { icon: ClipboardList, label: 'Tugas', path: '/student/assignments' },
    { icon: BarChart3, label: 'Nilai', path: '/student/grades' },
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
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

      <AppShell.Navbar p="md">
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

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
