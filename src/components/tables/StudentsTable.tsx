import { Table, Text, Badge, Group, ActionIcon, Menu, Avatar, Checkbox } from '@mantine/core';
import { IconDots, IconEdit, IconTrash, IconEye, IconUserCheck, IconUserX } from '@tabler/icons-react';
import { Student } from '../../types';
import { useNavigate } from 'react-router-dom';

interface StudentsTableProps {
  students: (Student & {
    class_count?: number;
    created_by_teacher?: { full_name: string };
  })[];
  onEdit?: (student: Student) => void;
  onDelete?: (studentId: string) => void;
  onToggleStatus?: (studentId: string, isActive: boolean) => void;
  onSelect?: (studentIds: string[]) => void;
  selectedStudents?: string[];
  showActions?: boolean;
  showSelection?: boolean;
}

export function StudentsTable({ 
  students, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  onSelect,
  selectedStudents = [],
  showActions = true,
  showSelection = false
}: StudentsTableProps) {
  const navigate = useNavigate();

  const handleSelectAll = (checked: boolean) => {
    if (onSelect) {
      onSelect(checked ? students.map(s => s.id) : []);
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    if (onSelect) {
      if (checked) {
        onSelect([...selectedStudents, studentId]);
      } else {
        onSelect(selectedStudents.filter(id => id !== studentId));
      }
    }
  };

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
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <Table striped highlightOnHover style={{ minWidth: 900 }}>
        <Table.Thead>
          <Table.Tr>
            {showSelection && (
              <Table.Th>
                <Checkbox
                  checked={selectedStudents.length === students.length && students.length > 0}
                  indeterminate={selectedStudents.length > 0 && selectedStudents.length < students.length}
                  onChange={(event) => handleSelectAll(event.currentTarget.checked)}
                />
              </Table.Th>
            )}
            <Table.Th>Siswa</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Tanggal Lahir</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Kelas</Table.Th>
            <Table.Th>Bergabung</Table.Th>
            {showActions && <Table.Th>Aksi</Table.Th>}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
        {students.map((student) => (
          <Table.Tr key={student.id}>
            {showSelection && (
              <Table.Td>
                <Checkbox
                  checked={selectedStudents.includes(student.id)}
                  onChange={(event) => handleSelectStudent(student.id, event.currentTarget.checked)}
                />
              </Table.Td>
            )}
            <Table.Td>
              <Group gap="sm">
                <Avatar size="sm" radius="xl" color="blue">
                  {student.full_name.charAt(0)}
                </Avatar>
                <div>
                  <Text fw={500} size="sm">
                    {student.full_name}
                  </Text>
                  {student.phone && (
                    <Text size="xs" c="dimmed">
                      {student.phone}
                    </Text>
                  )}
                </div>
              </Group>
            </Table.Td>
            <Table.Td>
              <Text size="sm">{student.email}</Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm">{formatBirthDate(student.birth_date)}</Text>
            </Table.Td>
            <Table.Td>
              <Badge 
                color={student.is_active ? 'green' : 'red'} 
                variant="light"
                size="sm"
              >
                {student.is_active ? 'Aktif' : 'Tidak Aktif'}
              </Badge>
            </Table.Td>
            <Table.Td>
              <Text size="sm">
                {student.class_count || 0} kelas
              </Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm" c="dimmed">
                {formatDate(student.created_at)}
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
              </Table.Td>
            )}
          </Table.Tr>
        ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}
