import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Card,
  Table,
  Badge,
  ActionIcon,
  Modal,
  TextInput,
  Select,
  SimpleGrid,
  Paper,
  Avatar,
  Menu,
  Alert
} from '@mantine/core';
import { 
  IconArrowLeft,
  IconUsers, 
  IconPlus,
  IconSearch,
  IconDots,
  IconEdit,
  IconTrash,
  IconMail,
  IconPhone,
  IconCalendar
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useAuth } from '../../contexts/AuthContext';
import { Student } from '../../types';
import { classService } from '../../services/classService';
import { studentService } from '../../services/studentService';
import { LoadingSpinner, EmptyState, ConfirmDialog } from '../../components';
import { notifications } from '@mantine/notifications';
import { formatGrade } from '../../utils/romanNumerals';

export function ClassStudents() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const teacher = user!;
  
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const addForm = useForm({
    initialValues: {
      studentId: '',
    },
    validate: {
      studentId: (value) => (!value ? 'Pilih siswa' : null),
    },
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [classInfo, allStudentsData] = await Promise.all([
        classService.getClassById(id),
        studentService.getAllStudents()
      ]);

      // Get enrolled students
      const enrolledStudents = classInfo.class_students?.map((cs: any) => cs.student) || [];
      
      // Filter out already enrolled students
      const availableStudents = allStudentsData.filter(
        student => !enrolledStudents.some((enrolled: Student) => enrolled.id === student.id)
      );

      setClassData(classInfo);
      setStudents(enrolledStudents);
      setAllStudents(availableStudents);
    } catch (error) {
      console.error('Error loading data:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal memuat data kelas',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (values: typeof addForm.values) => {
    try {
      await classService.enrollStudent(id!, values.studentId);
      notifications.show({
        title: 'Berhasil',
        message: 'Siswa berhasil ditambahkan ke kelas',
        color: 'green',
      });
      setAddModalOpen(false);
      addForm.reset();
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal menambahkan siswa',
        color: 'red',
      });
    }
  };

  const handleRemoveStudent = async () => {
    if (!selectedStudent) return;

    try {
      await classService.unenrollStudent(id!, selectedStudent.id);
      notifications.show({
        title: 'Berhasil',
        message: 'Siswa berhasil dikeluarkan dari kelas',
        color: 'green',
      });
      setDeleteModalOpen(false);
      setSelectedStudent(null);
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal mengeluarkan siswa',
        color: 'red',
      });
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner message="Memuat data siswa..." />;
  }

  if (!classData) {
    return (
      <Container size="xl" py="xl">
        <EmptyState
          icon={IconUsers}
          title="Kelas tidak ditemukan"
          description="Kelas yang Anda cari tidak ditemukan"
          actionLabel="Kembali ke Daftar Kelas"
          onAction={() => navigate('/teacher/classes')}
        />
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <ActionIcon
              variant="subtle"
              onClick={() => navigate(`/teacher/classes/${id}`)}
            >
              <IconArrowLeft size={16} />
            </ActionIcon>
            <div>
              <Title order={1}>Kelola Siswa</Title>
              <Text c="dimmed">
                {classData.name} - {formatGrade(classData.grade)}
              </Text>
            </div>
          </Group>
          
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setAddModalOpen(true)}
            disabled={allStudents.length === 0}
          >
            Tambah Siswa
          </Button>
        </Group>

        {/* Stats */}
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconUsers size={32} color="var(--mantine-color-blue-6)" />
              <div>
                <Text size="lg" fw={600}>{students.length}</Text>
                <Text size="sm" c="dimmed">Total Siswa</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconCalendar size={32} color="var(--mantine-color-green-6)" />
              <div>
                <Text size="lg" fw={600}>{allStudents.length}</Text>
                <Text size="sm" c="dimmed">Siswa Tersedia</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconUsers size={32} color="var(--mantine-color-orange-6)" />
              <div>
                <Text size="lg" fw={600}>{classData.class_code}</Text>
                <Text size="sm" c="dimmed">Kode Kelas</Text>
              </div>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Search */}
        <Card withBorder>
          <Group gap="md">
            <TextInput
              placeholder="Cari siswa..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1 }}
            />
          </Group>
        </Card>

        {/* Students Table */}
        <Card withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600}>Daftar Siswa ({filteredStudents.length})</Text>
            </Group>

            {filteredStudents.length > 0 ? (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Siswa</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Tanggal Lahir</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th width={50}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredStudents.map((student) => (
                    <Table.Tr key={student.id}>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar size="sm" radius="xl" color="blue">
                            {student.full_name.charAt(0)}
                          </Avatar>
                          <div>
                            <Text fw={500}>{student.full_name}</Text>
                            <Text size="sm" c="dimmed">ID: {student.id}</Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <IconMail size={14} />
                          <Text size="sm">{student.email}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {new Date(student.birth_date).toLocaleDateString('id-ID')}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color="green" variant="light" size="sm">
                          Terdaftar
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              color="red"
                              leftSection={<IconTrash size={14} />}
                              onClick={() => {
                                setSelectedStudent(student);
                                setDeleteModalOpen(true);
                              }}
                            >
                              Keluarkan dari Kelas
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <EmptyState
                icon={IconUsers}
                title="Tidak ada siswa"
                description={searchTerm ? 
                  "Tidak ada siswa yang sesuai dengan pencarian" : 
                  "Belum ada siswa yang terdaftar di kelas ini"
                }
                actionLabel={allStudents.length > 0 ? "Tambah Siswa" : undefined}
                onAction={allStudents.length > 0 ? () => setAddModalOpen(true) : undefined}
              />
            )}
          </Stack>
        </Card>

        {/* Add Student Modal */}
        <Modal
          opened={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title="Tambah Siswa ke Kelas"
          size="md"
        >
          <form onSubmit={addForm.onSubmit(handleAddStudent)}>
            <Stack gap="md">
              <Select
                label="Pilih Siswa"
                placeholder="Pilih siswa yang akan ditambahkan"
                data={allStudents.map(student => ({
                  value: student.id,
                  label: `${student.full_name} (${student.email})`
                }))}
                searchable
                required
                {...addForm.getInputProps('studentId')}
              />

              <Group justify="flex-end" gap="sm">
                <Button
                  variant="subtle"
                  onClick={() => setAddModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit">
                  Tambah Siswa
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          opened={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleRemoveStudent}
          title="Keluarkan Siswa"
          message={`Apakah Anda yakin ingin mengeluarkan ${selectedStudent?.full_name} dari kelas ini?`}
          confirmLabel="Keluarkan"
          cancelLabel="Batal"
          confirmColor="red"
        />
      </Stack>
    </Container>
  );
}
