import { Card, Text, Group, Badge, Button, Stack, Avatar, ActionIcon, Menu } from '@mantine/core';
import { IconMail, IconPhone, IconCalendar, IconDots, IconEdit, IconTrash, IconEye, IconUserCheck, IconUserX } from '@tabler/icons-react';
import { Student } from '../../types';
import { useNavigate } from 'react-router-dom';

interface StudentCardProps {
  student: Student & {
    class_count?: number;
    created_by_teacher?: { full_name: string };
  };
  onEdit?: (student: Student) => void;
  onDelete?: (studentId: string) => void;
  onToggleStatus?: (studentId: string, isActive: boolean) => void;
  showActions?: boolean;
}

export function StudentCard({ 
  student, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  showActions = true 
}: StudentCardProps) {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatBirthDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <Badge 
              color={student.is_active ? 'green' : 'red'} 
              size="sm"
              variant="light"
            >
              {student.is_active ? 'Aktif' : 'Tidak Aktif'}
            </Badge>
          </Group>
          
          {showActions && (
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray">
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconEye size={14} />}
                  onClick={() => navigate(`/teacher/students/${student.id}`)}
                >
                  Lihat Detail
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconEdit size={14} />}
                  onClick={() => onEdit?.(student)}
                >
                  Edit
                </Menu.Item>
                <Menu.Item
                  leftSection={student.is_active ? <IconUserX size={14} /> : <IconUserCheck size={14} />}
                  onClick={() => onToggleStatus?.(student.id, !student.is_active)}
                >
                  {student.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => onDelete?.(student.id)}
                >
                  Hapus
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Card.Section>

      <Stack gap="sm" mt="md">
        <Group gap="md">
          <Avatar size="lg" radius="xl" color="blue">
            {student.full_name.charAt(0)}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Text fw={600} size="lg" lineClamp={1}>
              {student.full_name}
            </Text>
            <Text size="sm" c="dimmed" lineClamp={1}>
              {student.email}
            </Text>
          </div>
        </Group>

        <Group gap="lg">
          <Group gap="xs">
            <IconMail size={16} color="var(--mantine-color-blue-6)" />
            <Text size="sm" c="dimmed">
              {student.email}
            </Text>
          </Group>
          
          {student.phone && (
            <Group gap="xs">
              <IconPhone size={16} color="var(--mantine-color-green-6)" />
              <Text size="sm" c="dimmed">
                {student.phone}
              </Text>
            </Group>
          )}
        </Group>

        <Group gap="lg">
          <Group gap="xs">
            <IconCalendar size={16} color="var(--mantine-color-orange-6)" />
            <Text size="sm" c="dimmed">
              Lahir: {formatBirthDate(student.birth_date)}
            </Text>
          </Group>
        </Group>

        {student.class_count !== undefined && (
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              Terdaftar di {student.class_count} kelas
            </Text>
          </Group>
        )}

        {student.created_by_teacher && (
          <Group gap="xs">
            <Avatar size="sm" radius="xl" color="gray">
              {student.created_by_teacher.full_name.charAt(0)}
            </Avatar>
            <Text size="xs" c="dimmed">
              Dibuat oleh {student.created_by_teacher.full_name}
            </Text>
          </Group>
        )}

        <Group gap="xs" mt="xs">
          <Text size="xs" c="dimmed">
            Bergabung: {formatDate(student.created_at)}
          </Text>
        </Group>

        <Group gap="sm" mt="md">
          <Button
            variant="light"
            size="sm"
            fullWidth
            onClick={() => navigate(`/teacher/students/${student.id}`)}
          >
            Lihat Detail
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
