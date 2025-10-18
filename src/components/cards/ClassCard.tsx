import { Card, Text, Group, Badge, Button, Stack, Avatar, ActionIcon, Menu } from '@mantine/core';
import { IconUsers, IconCalendar, IconDots, IconEdit, IconTrash, IconEye } from '@tabler/icons-react';
import { Class } from '../../types';
import { useNavigate } from 'react-router-dom';
import { formatGrade } from '../../utils/romanNumerals';

interface ClassCardProps {
  classData: Class & {
    student_count?: number;
    created_by_teacher?: { full_name: string };
  };
  onEdit?: (classData: Class) => void;
  onDelete?: (classId: string) => void;
  showActions?: boolean;
}

export function ClassCard({ 
  classData, 
  onEdit, 
  onDelete, 
  showActions = true 
}: ClassCardProps) {
  const navigate = useNavigate();

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case '10': return 'blue';
      case '11': return 'green';
      case '12': return 'orange';
      default: return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <Badge color={getGradeColor(classData.grade)} size="sm">
              {formatGrade(classData.grade)}
            </Badge>
            <Text fw={600} size="md" lineClamp={1}>
              {classData.name}
            </Text>
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
                  onClick={() => navigate(`/teacher/classes/${classData.id}`)}
                >
                  Lihat Detail
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconEdit size={14} />}
                  onClick={() => onEdit?.(classData)}
                >
                  Edit
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => onDelete?.(classData.id)}
                >
                  Hapus
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Card.Section>

      <Stack gap="sm" mt="md">
        <div>
          <Text size="sm" c="dimmed" lineClamp={2}>
            {classData.description || 'Tidak ada deskripsi'}
          </Text>
        </div>

        <Group gap="lg">
          <Group gap="xs">
            <IconUsers size={16} color="var(--mantine-color-blue-6)" />
            <Text size="sm" c="dimmed">
              {classData.student_count || 0} siswa
            </Text>
          </Group>
          
          <Group gap="xs">
            <IconCalendar size={16} color="var(--mantine-color-green-6)" />
            <Text size="sm" c="dimmed">
              {formatDate(classData.created_at)}
            </Text>
          </Group>
        </Group>

        <Group gap="xs" mt="xs">
          <Text size="xs" c="dimmed">Kode Kelas:</Text>
          <Badge variant="outline" size="xs">
            {classData.class_code}
          </Badge>
        </Group>

        {classData.created_by_teacher && (
          <Group gap="xs">
            <Avatar size="sm" radius="xl" color="blue">
              {classData.created_by_teacher.full_name?.charAt(0) || 'T'}
            </Avatar>
            <Text size="xs" c="dimmed">
              Dibuat oleh {classData.created_by_teacher.full_name || 'Unknown Teacher'}
            </Text>
          </Group>
        )}

        <Group gap="sm" mt="md">
          <Button
            variant="light"
            size="sm"
            fullWidth
            onClick={() => navigate(`/teacher/classes/${classData.id}`)}
          >
            Lihat Detail
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
