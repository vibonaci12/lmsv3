import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Button,
  TextInput,
  Select,
  SimpleGrid,
  Paper,
  Badge,
  Modal,
  Textarea,
  NumberInput,
  Tabs,
  Card,
  ActionIcon,
  Menu,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { 
  IconPlus, 
  IconSearch, 
  IconClipboardList,
  IconCalendar,
  IconUsers,
  IconDots,
  IconEdit,
  IconTrash,
  IconCopy,
  IconEye,
  IconClock
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useAuth } from '../../contexts/AuthContext';
import { Assignment } from '../../types';
import { assignmentService } from '../../services/assignmentService';
import { classService } from '../../services/classService';
import { LoadingSpinner, EmptyState, ConfirmDialog } from '../../components';
import { notifications } from '@mantine/notifications';
import { formatGrade } from '../../utils/romanNumerals';
import dayjs from 'dayjs';

export function AssignmentList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const teacher = user!;
  
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState(assignments);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      type: 'wajib' as 'wajib' | 'tambahan',
      target_class_id: '',
      target_grade: '10' as '10' | '11' | '12',
      deadline: new Date(),
      total_points: 100,
      drive_link: '',
    },
    validate: {
      title: (value) => (!value ? 'Judul tugas harus diisi' : null),
      type: (value) => (!value ? 'Tipe tugas harus dipilih' : null),
      deadline: (value) => (!value ? 'Deadline harus diisi' : null),
      total_points: (value) => (value <= 0 ? 'Total poin harus lebih dari 0' : null),
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAssignments();
  }, [assignments, searchTerm, typeFilter, statusFilter, classFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsData, classesData] = await Promise.all([
        assignmentService.getAllAssignments(),
        classService.getAllClasses()
      ]);

      setAssignments(assignmentsData);
      setClasses(classesData);
    } catch (error) {
      console.error('Error loading data:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal memuat data tugas',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAssignments = () => {
    let filtered = assignments;

    if (searchTerm) {
      filtered = filtered.filter(assignment =>
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(assignment => assignment.assignment_type === typeFilter);
    }

    if (statusFilter) {
      const now = new Date();
      filtered = filtered.filter(assignment => {
        const deadline = new Date(assignment.deadline);
        switch (statusFilter) {
          case 'active':
            return deadline > now;
          case 'expired':
            return deadline <= now;
          case 'draft':
            return assignment.assignment_type === 'tambahan';
          default:
            return true;
        }
      });
    }

    if (classFilter) {
      filtered = filtered.filter(assignment => 
        assignment.class_id === classFilter
      );
    }

    setFilteredAssignments(filtered);
  };

  const handleCreateAssignment = async (values: typeof form.values) => {
    try {
      setSubmitting(true);
      
      const assignmentData = {
        ...values,
        deadline: dayjs(values.deadline).format('YYYY-MM-DD HH:mm:ss'),
        created_by: teacher.id,
        assignment_type: values.type,
        drive_link: values.drive_link || null,
      };

      await assignmentService.createSimpleAssignment(assignmentData);

      notifications.show({
        title: 'Berhasil',
        message: 'Tugas berhasil dibuat',
        color: 'green',
      });

      setCreateModalOpen(false);
      form.reset();
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal membuat tugas',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!selectedAssignment) return;

    try {
      await assignmentService.deleteAssignment(selectedAssignment.id, teacher.id);
      notifications.show({
        title: 'Berhasil',
        message: 'Tugas berhasil dihapus',
        color: 'green',
      });
      setDeleteModalOpen(false);
      setSelectedAssignment(null);
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal menghapus tugas',
        color: 'red',
      });
    }
  };

  const getAssignmentStatus = (assignment: Assignment) => {
    const now = new Date();
    const deadline = new Date(assignment.deadline);
    
    if (assignment.assignment_type === 'tambahan') return { label: 'Tambahan', color: 'orange' };
    if (deadline <= now) return { label: 'Expired', color: 'red' };
    return { label: 'Active', color: 'green' };
  };

  const getAssignmentTypeLabel = (type: string) => {
    return type === 'wajib' ? 'Tugas Wajib' : 'Tugas Tambahan';
  };

  const getAssignmentTypeColor = (type: string) => {
    return type === 'wajib' ? 'blue' : 'orange';
  };

  if (loading) {
    return <LoadingSpinner message="Memuat data tugas..." />;
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={1}>Manajemen Tugas</Title>
            <Text c="dimmed">Kelola dan buat tugas untuk siswa</Text>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateModalOpen(true)}
          >
            Buat Tugas
          </Button>
        </Group>

        {/* Stats */}
        <SimpleGrid cols={{ base: 1, sm: 4 }}>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconClipboardList size={32} color="var(--mantine-color-blue-6)" />
              <div>
                <Text size="lg" fw={600}>{assignments.length}</Text>
                <Text size="sm" c="dimmed">Total Tugas</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconCalendar size={32} color="var(--mantine-color-green-6)" />
              <div>
                <Text size="lg" fw={600}>
                  {assignments.filter(a => getAssignmentStatus(a).label === 'Active').length}
                </Text>
                <Text size="sm" c="dimmed">Tugas Aktif</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconClock size={32} color="var(--mantine-color-red-6)" />
              <div>
                <Text size="lg" fw={600}>
                  {assignments.filter(a => getAssignmentStatus(a).label === 'Expired').length}
                </Text>
                <Text size="sm" c="dimmed">Tugas Expired</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconUsers size={32} color="var(--mantine-color-orange-6)" />
              <div>
                <Text size="lg" fw={600}>{classes.length}</Text>
                <Text size="sm" c="dimmed">Total Kelas</Text>
              </div>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Filters */}
        <Paper p="md" withBorder>
          <Group gap="md">
            <TextInput
              placeholder="Cari tugas..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Tipe Tugas"
              data={[
                { value: 'wajib', label: 'Tugas Wajib' },
                { value: 'tambahan', label: 'Tugas Tambahan' },
              ]}
              value={typeFilter}
              onChange={(value) => setTypeFilter(value || '')}
              clearable
            />
            <Select
              placeholder="Status"
              data={[
                { value: 'active', label: 'Aktif' },
                { value: 'expired', label: 'Expired' },
                { value: 'draft', label: 'Draft' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || '')}
              clearable
            />
            <Select
              placeholder="Kelas"
              data={classes.map(cls => ({
                value: cls.id,
                label: `${cls.name} - ${formatGrade(cls.grade)}`
              }))}
              value={classFilter}
              onChange={(value) => setClassFilter(value || '')}
              clearable
            />
          </Group>
        </Paper>

        {/* Assignments List */}
        {filteredAssignments.length > 0 ? (
          <SimpleGrid cols={{ base: 1, lg: 2 }}>
            {filteredAssignments.map((assignment) => {
              const status = getAssignmentStatus(assignment);
              return (
                <Card key={assignment.id} shadow="sm" padding="lg" radius="md" withBorder>
                  <Card.Section withBorder inheritPadding py="xs">
                    <Group justify="space-between">
                      <Group gap="xs">
                        <Badge color={getAssignmentTypeColor(assignment.assignment_type)} size="sm">
                          {getAssignmentTypeLabel(assignment.assignment_type)}
                        </Badge>
                        <Badge color={status.color} variant="light" size="sm">
                          {status.label}
                        </Badge>
                      </Group>
                      
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
                            onClick={() => navigate(`/teacher/assignments/${assignment.id}/edit`)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconCopy size={14} />}
                            onClick={() => {
                              // TODO: Implement duplicate functionality
                              notifications.show({
                                title: 'Info',
                                message: 'Fitur duplikasi akan segera tersedia',
                                color: 'blue',
                              });
                            }}
                          >
                            Duplikasi
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setDeleteModalOpen(true);
                            }}
                          >
                            Hapus
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Card.Section>

                  <Stack gap="sm" mt="md">
                    <div>
                      <Text fw={600} size="lg" lineClamp={1}>
                        {assignment.title}
                      </Text>
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {assignment.description || 'Tidak ada deskripsi'}
                      </Text>
                    </div>

                    <Group gap="lg">
                      <Group gap="xs">
                        <IconCalendar size={16} color="var(--mantine-color-blue-6)" />
                        <Text size="sm" c="dimmed">
                          Deadline: {dayjs(assignment.deadline).format('DD MMM YYYY, HH:mm')}
                        </Text>
                      </Group>
                      
                      <Group gap="xs">
                        <IconClipboardList size={16} color="var(--mantine-color-green-6)" />
                        <Text size="sm" c="dimmed">
                          {assignment.total_points} poin
                        </Text>
                      </Group>
                    </Group>

                    {assignment.class_id && (
                      <Group gap="xs">
                        <Text size="sm" c="dimmed">Kelas:</Text>
                        <Badge variant="outline" size="sm">
                          Kelas {assignment.target_grade}
                        </Badge>
                      </Group>
                    )}

                    <Group gap="sm" mt="xs">
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
            })}
          </SimpleGrid>
        ) : (
          <EmptyState
            icon={IconClipboardList}
            title="Tidak ada tugas"
            description={searchTerm || typeFilter || statusFilter || classFilter ? 
              "Tidak ada tugas yang sesuai dengan filter" : 
              "Belum ada tugas yang dibuat"
            }
            actionLabel="Buat Tugas Pertama"
            onAction={() => setCreateModalOpen(true)}
          />
        )}

        {/* Create Assignment Modal */}
        <Modal
          opened={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Buat Tugas Baru"
          size="lg"
        >
          <form onSubmit={form.onSubmit(handleCreateAssignment)}>
            <Stack gap="md">
              <Tabs defaultValue="basic">
                <Tabs.List>
                  <Tabs.Tab value="basic">Informasi Dasar</Tabs.Tab>
                  <Tabs.Tab value="target">Target & Deadline</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="basic" pt="md">
                  <Stack gap="md">
                    <TextInput
                      label="Judul Tugas"
                      placeholder="Masukkan judul tugas"
                      required
                      {...form.getInputProps('title')}
                    />
                    
                    <Textarea
                      label="Deskripsi"
                      placeholder="Deskripsi tugas (opsional)"
                      rows={4}
                      {...form.getInputProps('description')}
                    />

                    <Select
                      label="Tipe Tugas"
                      placeholder="Pilih tipe tugas"
                      data={[
                        { value: 'wajib', label: 'Tugas Wajib (untuk kelas tertentu)' },
                        { value: 'tambahan', label: 'Tugas Tambahan (untuk tingkat tertentu)' },
                      ]}
                      required
                      {...form.getInputProps('type')}
                    />

                    <NumberInput
                      label="Total Poin"
                      placeholder="100"
                      min={1}
                      required
                      {...form.getInputProps('total_points')}
                    />

                    <TextInput
                      label="Link Drive (Opsional)"
                      placeholder="https://drive.google.com/..."
                      {...form.getInputProps('drive_link')}
                    />
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="target" pt="md">
                  <Stack gap="md">
                    {form.values.type === 'wajib' ? (
                      <Select
                        label="Target Kelas"
                        placeholder="Pilih kelas"
                        data={classes.map(cls => ({
                          value: cls.id,
                          label: `${cls.name} - ${formatGrade(cls.grade)}`
                        }))}
                        required
                        {...form.getInputProps('target_class_id')}
                      />
                    ) : (
                      <Select
                        label="Target Tingkat"
                        placeholder="Pilih tingkat"
                        data={[
                          { value: '10', label: 'Kelas X' },
                          { value: '11', label: 'Kelas XI' },
                          { value: '12', label: 'Kelas XII' },
                        ]}
                        required
                        {...form.getInputProps('target_grade')}
                      />
                    )}

                    <DateInput
                      label="Deadline"
                      placeholder="Pilih deadline"
                      required
                      {...form.getInputProps('deadline')}
                    />
                  </Stack>
                </Tabs.Panel>
              </Tabs>

              <Group justify="flex-end" gap="sm">
                <Button
                  variant="subtle"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button type="submit" loading={submitting}>
                  Buat Tugas
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          opened={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteAssignment}
          title="Hapus Tugas"
          message={`Apakah Anda yakin ingin menghapus tugas "${selectedAssignment?.title}"? Tindakan ini akan menghapus semua submission yang terkait.`}
          confirmLabel="Hapus"
          cancelLabel="Batal"
          confirmColor="red"
        />
      </Stack>
    </Container>
  );
}
