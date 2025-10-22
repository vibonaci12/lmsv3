import { Card, Text, Group, Badge, Button, Stack, Progress, ActionIcon, Menu } from '@mantine/core';
import { IconCalendar, IconUsers, IconDots, IconEdit, IconTrash, IconEye, IconClock } from '@tabler/icons-react';
import { Assignment } from '../../types';
import { useNavigate } from 'react-router-dom';

interface AssignmentCardProps {
  assignment: Assignment & {
    class?: { name: string; grade: string };
    questions?: { count: number };
    submissions?: { count: number };
  };
  onEdit?: (assignment: Assignment) => void;
  onDelete?: (assignmentId: string) => void;
  showActions?: boolean;
}

export function AssignmentCard({ 
  assignment, 
  onEdit, 
  onDelete, 
  showActions = true 
}: AssignmentCardProps) {
  const navigate = useNavigate();

  const getTypeColor = (type: string) => {
    return type === 'wajib' ? 'blue' : 'green';
  };

  const getTypeLabel = (type: string) => {
    return type === 'wajib' ? 'Wajib' : 'Tambahan';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeadlineStatus = () => {
    const now = new Date();
    const deadline = new Date(assignment.deadline);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'overdue', color: 'red', text: 'Terlambat' };
    } else if (diffDays === 0) {
      return { status: 'today', color: 'orange', text: 'Hari ini' };
    } else if (diffDays <= 3) {
      return { status: 'soon', color: 'yellow', text: `${diffDays} hari lagi` };
    } else {
      return { status: 'normal', color: 'green', text: `${diffDays} hari lagi` };
    }
  };

  const deadlineStatus = getDeadlineStatus();

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <Badge color={getTypeColor(assignment.assignment_type)} size="sm">
              {getTypeLabel(assignment.assignment_type)}
            </Badge>
            <Badge variant="light" color={deadlineStatus.color} size="sm">
              {deadlineStatus.text}
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
                  onClick={() => navigate(`/teacher/assignments/${assignment.id}`)}
                >
                  Lihat Detail
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconEdit size={14} />}
                  onClick={() => onEdit?.(assignment)}
                >
                  Edit
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => onDelete?.(assignment.id)}
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
          <Text fw={600} size="lg" lineClamp={1}>
            {assignment.title}
          </Text>
          <Text size="sm" c="dimmed" lineClamp={2} style={{ whiteSpace: 'pre-wrap' }}>
            {assignment.description || 'Tidak ada deskripsi'}
          </Text>
        </div>

        <Group gap="lg">
          <Group gap="xs">
            <IconCalendar size={16} color="var(--mantine-color-blue-6)" />
            <Text size="sm" c="dimmed">
              {formatDate(assignment.deadline)}
            </Text>
          </Group>
          
          <Group gap="xs">
            <IconUsers size={16} color="var(--mantine-color-green-6)" />
            <Text size="sm" c="dimmed">
              {assignment.submissions?.count || 0} pengumpulan
            </Text>
          </Group>
        </Group>

        <Group gap="lg">
          <Group gap="xs">
            <IconClock size={16} color="var(--mantine-color-orange-6)" />
            <Text size="sm" c="dimmed">
              {assignment.questions?.count || 0} soal
            </Text>
          </Group>
          
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              Total: {assignment.total_points} poin
            </Text>
          </Group>
        </Group>

        {assignment.class && (
          <Group gap="xs">
            <Badge variant="outline" size="sm">
              {assignment.class.name} - Kelas {assignment.class.grade}
            </Badge>
          </Group>
        )}

        {assignment.target_grade && !assignment.class && (
          <Group gap="xs">
            <Badge variant="outline" size="sm">
              Kelas {assignment.target_grade}
            </Badge>
          </Group>
        )}

        <Group gap="sm" mt="md">
          <Button
            variant="light"
            size="sm"
            fullWidth
            onClick={() => navigate(`/teacher/assignments/${assignment.id}`)}
          >
            Lihat Detail
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
