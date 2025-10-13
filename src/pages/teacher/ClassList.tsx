import { useState, useEffect } from 'react';
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
  Textarea
} from '@mantine/core';
import { 
  IconPlus, 
  IconSearch, 
  IconUsers,
  IconBook
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useAuth } from '../../contexts/AuthContext';
import { Class } from '../../types';
import { classService } from '../../services/classService';
import { ClassCard, LoadingSpinner, EmptyState, ConfirmDialog } from '../../components';
import { GRADE_OPTIONS, formatGrade } from '../../utils/romanNumerals';
// import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';

export function ClassList() {
  const { user } = useAuth();
  // const navigate = useNavigate();
  const teacher = user!;
  
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<(Class & { student_count?: number; created_by_teacher?: { full_name: string } })[]>([]);
  const [filteredClasses, setFilteredClasses] = useState(classes);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      grade: '10' as '10' | '11' | '12',
      description: '',
    },
    validate: {
      name: (value) => (!value ? 'Nama kelas harus diisi' : null),
      grade: (value) => (!value ? 'Kelas harus dipilih' : null),
    },
  });

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    filterClasses();
  }, [classes, searchTerm, gradeFilter, statusFilter]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await classService.getAllClasses();
      setClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal memuat data kelas',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterClasses = () => {
    let filtered = classes;

    if (searchTerm) {
      filtered = filtered.filter(cls => 
        cls.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (gradeFilter) {
      filtered = filtered.filter(cls => cls.grade === gradeFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(cls => 
        statusFilter === 'active' ? cls.is_active : !cls.is_active
      );
    }

    setFilteredClasses(filtered);
  };

  const handleCreateClass = async (values: typeof form.values) => {
    try {
      setSubmitting(true);
      const classCode = classService.generateClassCode();
      
      await classService.createClass({
        ...values,
        class_code: classCode,
        created_by: teacher.id,
      });

      notifications.show({
        title: 'Berhasil',
        message: 'Kelas berhasil dibuat',
        color: 'green',
      });

      setCreateModalOpen(false);
      form.reset();
      loadClasses();
    } catch (error) {
      console.error('Error creating class:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal membuat kelas',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClass = async (values: typeof form.values) => {
    if (!selectedClass) return;

    try {
      setSubmitting(true);
      await classService.updateClass(selectedClass.id, values, teacher.id);

      notifications.show({
        title: 'Berhasil',
        message: 'Kelas berhasil diperbarui',
        color: 'green',
      });

      setEditModalOpen(false);
      setSelectedClass(null);
      form.reset();
      loadClasses();
    } catch (error) {
      console.error('Error updating class:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal memperbarui kelas',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;

    try {
      setSubmitting(true);
      await classService.deleteClass(selectedClass.id, teacher.id);

      notifications.show({
        title: 'Berhasil',
        message: 'Kelas berhasil dihapus',
        color: 'green',
      });

      setDeleteModalOpen(false);
      setSelectedClass(null);
      loadClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal menghapus kelas',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (classData: Class) => {
    setSelectedClass(classData);
    form.setValues({
      name: classData.name,
      grade: classData.grade,
      subject: classData.subject,
      description: classData.description || '',
    });
    setEditModalOpen(true);
  };

  const openDeleteModal = (classData: Class) => {
    setSelectedClass(classData);
    setDeleteModalOpen(true);
  };

  if (loading) {
    return <LoadingSpinner message="Memuat data kelas..." />;
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={1}>Manajemen Kelas</Title>
            <Text c="dimmed">Kelola kelas pembelajaran Anda</Text>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateModalOpen(true)}
          >
            Buat Kelas Baru
          </Button>
        </Group>

        {/* Filters */}
        <Paper p="md" withBorder>
          <Group gap="md">
            <TextInput
              placeholder="Cari kelas..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Filter Kelas"
              data={GRADE_OPTIONS}
              value={gradeFilter}
              onChange={setGradeFilter}
              clearable
            />
            <Select
              placeholder="Filter Status"
              data={[
                { value: 'active', label: 'Aktif' },
                { value: 'inactive', label: 'Tidak Aktif' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              clearable
            />
          </Group>
        </Paper>

        {/* Stats */}
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconBook size={32} color="var(--mantine-color-blue-6)" />
              <div>
                <Text size="lg" fw={600}>{classes.length}</Text>
                <Text size="sm" c="dimmed">Total Kelas</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconUsers size={32} color="var(--mantine-color-green-6)" />
              <div>
                <Text size="lg" fw={600}>
                  {classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0)}
                </Text>
                <Text size="sm" c="dimmed">Total Siswa</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <Badge size="lg" color="green" variant="light">
                {classes.filter(cls => cls.is_active).length} Aktif
              </Badge>
              <Badge size="lg" color="red" variant="light">
                {classes.filter(cls => !cls.is_active).length} Tidak Aktif
              </Badge>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Classes Grid */}
        {filteredClasses.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
            {filteredClasses.map((classData) => (
              <ClassCard
                key={classData.id}
                classData={classData}
                onEdit={openEditModal}
                onDelete={(classId: string) => {
                  const classToDelete = classes.find(c => c.id === classId);
                  if (classToDelete) {
                    openDeleteModal(classToDelete);
                  }
                }}
              />
            ))}
          </SimpleGrid>
        ) : (
          <EmptyState
            icon={IconBook}
            title="Tidak ada kelas"
            description={searchTerm || gradeFilter || statusFilter ? 
              "Tidak ada kelas yang sesuai dengan filter" : 
              "Belum ada kelas yang dibuat"
            }
            actionLabel="Buat Kelas Pertama"
            onAction={() => setCreateModalOpen(true)}
          />
        )}

        {/* Create Class Modal */}
        <Modal
          opened={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Buat Kelas Baru"
          size="md"
        >
          <form onSubmit={form.onSubmit(handleCreateClass)}>
            <Stack gap="md">
              <TextInput
                label="Nama Kelas"
                placeholder="Contoh: Matematika Kelas 10A"
                required
                {...form.getInputProps('name')}
              />
              
              <Select
                label="Kelas"
                placeholder="Pilih kelas"
                data={GRADE_OPTIONS}
                required
                {...form.getInputProps('grade')}
              />
              
              
              <Textarea
                label="Deskripsi"
                placeholder="Deskripsi kelas (opsional)"
                rows={3}
                {...form.getInputProps('description')}
              />
              
              <Group justify="flex-end" gap="sm">
                <Button
                  variant="subtle"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button type="submit" loading={submitting}>
                  Buat Kelas
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* Edit Class Modal */}
        <Modal
          opened={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit Kelas"
          size="md"
        >
          <form onSubmit={form.onSubmit(handleEditClass)}>
            <Stack gap="md">
              <TextInput
                label="Nama Kelas"
                placeholder="Contoh: Matematika Kelas 10A"
                required
                {...form.getInputProps('name')}
              />
              
              <Select
                label="Kelas"
                placeholder="Pilih kelas"
                data={GRADE_OPTIONS}
                required
                {...form.getInputProps('grade')}
              />
              
              
              <Textarea
                label="Deskripsi"
                placeholder="Deskripsi kelas (opsional)"
                rows={3}
                {...form.getInputProps('description')}
              />
              
              <Group justify="flex-end" gap="sm">
                <Button
                  variant="subtle"
                  onClick={() => setEditModalOpen(false)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button type="submit" loading={submitting}>
                  Simpan Perubahan
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          opened={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteClass}
          title="Hapus Kelas"
          message={`Apakah Anda yakin ingin menghapus kelas "${selectedClass?.name}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Hapus"
          loading={submitting}
        />
      </Stack>
    </Container>
  );
}
