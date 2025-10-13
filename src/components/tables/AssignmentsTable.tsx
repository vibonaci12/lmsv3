import { Table, Text, Badge, Group, ActionIcon, Menu, Progress } from '@mantine/core';
import { IconDots, IconEdit, IconTrash, IconEye, IconUsers } from '@tabler/icons-react';
import { Assignment } from '../../types';
import { useNavigate } from 'react-router-dom';

interface AssignmentsTableProps {
  assignments: (Assignment & {
    class?: { name: string; grade: string };
    questions?: { count: number };
    submissions?: { count: number };
  })[];
  onEdit?: (assignment: Assignment) => void;
  onDelete?: (assignmentId: string) => void;
  showActions?: boolean;
}

export function AssignmentsTable({ 
  assignments, 
  onEdit, 
  onDelete, 
  showActions = true 
}: AssignmentsTableProps) {
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

  const getDeadlineStatus = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'overdue', color: 'red', text: 'Terlambat' };
    } else if (diffDays === 0) {
      return { status: 'today', color: 'orange', text: 'Hari ini' };
    } else if (diffDays <= 3) {
      return { status: 'soon', color: 'yellow', text: `${diffDays} hari` };
    } else {
      return { status: 'normal', color: 'green', text: `${diffDays} hari` };
    }
  };

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Tugas</Table.Th>
          <Table.Th>Tipe</Table.Th>
          <Table.Th>Target</Table.Th>
          <Table.Th>Deadline</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Pengumpulan</Table.Th>
          <Table.Th>Poin</Table.Th>
          {showActions && <Table.Th>Aksi</Table.Th>}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {assignments.map((assignment) => {
          const deadlineStatus = getDeadlineStatus(assignment.deadline);
          
          return (
            <Table.Tr key={assignment.id}>
              <Table.Td>
                <div>
                  <Text fw={500} size="sm" lineClamp={1}>
                    {assignment.title}
                  </Text>
                  {assignment.description && (
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {assignment.description}
                    </Text>
                  )}
                </div>
              </Table.Td>
              <Table.Td>
                <Badge 
                  color={getTypeColor(assignment.assignment_type)} 
                  variant="light"
                  size="sm"
                >
                  {getTypeLabel(assignment.assignment_type)}
                </Badge>
              </Table.Td>
              <Table.Td>
                {assignment.class ? (
                  <div>
                    <Text size="sm" fw={500}>
                      {assignment.class.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Kelas {assignment.class.grade}
                    </Text>
                  </div>
                ) : assignment.target_grade ? (
                  <Text size="sm">
                    Kelas {assignment.target_grade}
                  </Text>
                ) : (
                  <Text size="sm" c="dimmed">
                    -
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                <div>
                  <Text size="sm">
                    {formatDate(assignment.deadline)}
                  </Text>
                </div>
              </Table.Td>
              <Table.Td>
                <Badge 
                  color={deadlineStatus.color} 
                  variant="light"
                  size="sm"
                >
                  {deadlineStatus.text}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <IconUsers size={14} color="var(--mantine-color-blue-6)" />
                  <Text size="sm">
                    {assignment.submissions?.count || 0}
                  </Text>
                </Group>
              </Table.Td>
              <Table.Td>
                <Text size="sm" fw={500}>
                  {assignment.total_points}
                </Text>
              </Table.Td>
              {showActions && (
                <Table.Td>
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
                </Table.Td>
              )}
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}
