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
  Table,
  Checkbox,
  MultiSelect,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
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
  IconClock,
  IconEditOff,
  IconTrashX
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Bulk operations state
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  
  // Edit assignment state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      type: 'wajib' as 'wajib' | 'tambahan',
      class_ids: [] as string[], // Changed to array for multi-class support
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
      class_ids: (value, values) => (values.type === 'wajib' && (!value || value.length === 0) ? 'Pilih minimal satu kelas untuk tugas wajib' : null),
      target_grade: (value, values) => (values.type === 'tambahan' && !value ? 'Tingkat harus dipilih untuk tugas tambahan' : null),
    },
  });

  // Bulk edit form
  const bulkEditForm = useForm({
    initialValues: {
      deadline: null as Date | null,
      total_points: null as number | null,
      drive_link: '',
    },
  });

  // Edit assignment form
  const editForm = useForm({
    initialValues: {
      title: '',
      description: '',
      type: 'wajib' as 'wajib' | 'tambahan',
      class_ids: [] as string[],
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
      class_ids: (value, values) => (values.type === 'wajib' && (!value || value.length === 0) ? 'Pilih minimal satu kelas untuk tugas wajib' : null),
      target_grade: (value, values) => (values.type === 'tambahan' && !value ? 'Tingkat harus dipilih untuk tugas tambahan' : null),
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAssignments();
  }, [assignments, searchTerm, typeFilter, statusFilter, classFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssignments = filteredAssignments.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Bulk operation handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssignments(paginatedAssignments.map(a => a.id));
    } else {
      setSelectedAssignments([]);
    }
  };

  const handleSelectAssignment = (assignmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedAssignments(prev => [...prev, assignmentId]);
    } else {
      setSelectedAssignments(prev => prev.filter(id => id !== assignmentId));
    }
  };

  const handleBulkEdit = async (values: typeof bulkEditForm.values) => {
    if (!user || selectedAssignments.length === 0) return;

    try {
      setSubmitting(true);
      
      const updates: any = {};
      if (values.deadline) updates.deadline = values.deadline.toISOString();
      if (values.total_points) updates.total_points = values.total_points;
      if (values.drive_link) updates.drive_link = values.drive_link;

      await assignmentService.bulkUpdateAssignments(selectedAssignments, updates, user.id);
      
      notifications.show({
        title: 'Berhasil',
        message: `${selectedAssignments.length} tugas berhasil diperbarui`,
        color: 'green',
      });

      setBulkEditModalOpen(false);
      setSelectedAssignments([]);
      bulkEditForm.reset();
      await loadData();
    } catch (error) {
      console.error('Error bulk updating assignments:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal memperbarui tugas',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!user || selectedAssignments.length === 0) return;

    try {
      setSubmitting(true);
      await assignmentService.bulkDeleteAssignments(selectedAssignments, user.id);
      
      notifications.show({
        title: 'Berhasil',
        message: `${selectedAssignments.length} tugas berhasil dihapus`,
        color: 'green',
      });

      setBulkDeleteModalOpen(false);
      setSelectedAssignments([]);
      await loadData();
    } catch (error) {
      console.error('Error bulk deleting assignments:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal menghapus tugas',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Edit assignment handlers
  const handleEditAssignment = (assignment: Assignment) => {
    try {
      console.log('Editing assignment:', assignment);
      setEditingAssignment(assignment);
      
      // Get class IDs for wajib assignments
      let classIds: string[] = [];
      if (assignment.assignment_type === 'wajib') {
        if (assignment.class) {
          classIds = [assignment.class.id];
        } else if (assignment.assignment_classes && Array.isArray(assignment.assignment_classes)) {
          classIds = assignment.assignment_classes.map((ac: any) => {
            if (ac.class && ac.class.id) {
              return ac.class.id;
            }
            return ac.class_id; // fallback to direct class_id
          }).filter(Boolean);
        }
      }
      
      editForm.setValues({
        title: assignment.title || '',
        description: assignment.description || '',
        type: assignment.assignment_type || 'wajib',
        class_ids: classIds,
        target_grade: assignment.target_grade || '10',
        deadline: assignment.deadline ? new Date(assignment.deadline) : new Date(),
        total_points: assignment.total_points || 100,
        drive_link: assignment.drive_link || '',
      });
      
      setEditModalOpen(true);
    } catch (error) {
      console.error('Error opening edit modal:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal membuka form edit tugas',
        color: 'red',
      });
    }
  };

  const handleUpdateAssignment = async (values: typeof editForm.values) => {
    if (!user || !editingAssignment) return;

    try {
      setSubmitting(true);
      
      const updateData = {
        title: values.title,
        description: values.description,
        deadline: dayjs(values.deadline).format('YYYY-MM-DD HH:mm:ss'),
        total_points: values.total_points,
        assignment_type: values.type,
        class_ids: values.type === 'wajib' ? values.class_ids : undefined,
        target_grade: values.type === 'tambahan' ? values.target_grade : undefined,
        drive_link: values.drive_link || null,
      };

      await assignmentService.updateAssignment(editingAssignment.id, updateData, user.id);
      
      notifications.show({
        title: 'Berhasil',
        message: 'Tugas berhasil diperbarui',
        color: 'green',
      });

      setEditModalOpen(false);
      setEditingAssignment(null);
      editForm.reset();
      await loadData();
    } catch (error) {
      console.error('Error updating assignment:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal memperbarui tugas',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };


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
      
      console.log('Form values:', values);
      
      const assignmentData = {
        title: values.title,
        description: values.description,
        deadline: dayjs(values.deadline).format('YYYY-MM-DD HH:mm:ss'),
        total_points: values.total_points,
        assignment_type: values.type,
        class_ids: values.type === 'wajib' ? values.class_ids : undefined,
        target_grade: values.type === 'tambahan' ? values.target_grade : undefined,
        drive_link: values.drive_link || null,
        created_by: teacher.id,
      };

      console.log('Assignment data:', assignmentData);

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

  const getDeadlineStatus = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffInHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 0) {
      return { text: 'Expired', color: 'red' };
    } else if (diffInHours < 24) {
      return { text: 'Hampir Deadline', color: 'orange' };
    } else {
      return { text: 'Aktif', color: 'green' };
    }
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

        {/* Assignments Table */}
        {filteredAssignments.length > 0 ? (
          <Stack gap="md">
            {/* Bulk Actions */}
            {selectedAssignments.length > 0 && (
              <Paper p="md" withBorder bg="blue.0">
                <Group justify="space-between" align="center">
                  <Text size="sm" fw={500}>
                    {selectedAssignments.length} tugas dipilih
                  </Text>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconEditOff size={14} />}
                      onClick={() => setBulkEditModalOpen(true)}
                    >
                      Edit Massal
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      leftSection={<IconTrashX size={14} />}
                      onClick={() => setBulkDeleteModalOpen(true)}
                    >
                      Hapus Massal
                    </Button>
                  </Group>
                </Group>
              </Paper>
            )}

            <Card withBorder radius="md">
              <div style={{ overflowX: 'auto' }}>
                <Table striped highlightOnHover style={{ minWidth: 900 }}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w={40}>
                        <Checkbox
                          checked={selectedAssignments.length === paginatedAssignments.length && paginatedAssignments.length > 0}
                          indeterminate={selectedAssignments.length > 0 && selectedAssignments.length < paginatedAssignments.length}
                          onChange={(event) => handleSelectAll(event.currentTarget.checked)}
                        />
                      </Table.Th>
                      <Table.Th>Tugas</Table.Th>
                      <Table.Th>Tipe</Table.Th>
                      <Table.Th>Target</Table.Th>
                      <Table.Th>Deadline</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Poin</Table.Th>
                      <Table.Th>Aksi</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedAssignments.map((assignment) => {
                      const status = getAssignmentStatus(assignment);
                      const deadlineStatus = getDeadlineStatus(assignment.deadline);
                      
                      return (
                        <Table.Tr key={assignment.id}>
                          <Table.Td>
                            <Checkbox
                              checked={selectedAssignments.includes(assignment.id)}
                              onChange={(event) => handleSelectAssignment(assignment.id, event.currentTarget.checked)}
                            />
                          </Table.Td>
                          <Table.Td>
                            <div>
                              <Text fw={500} size="sm" lineClamp={1}>
                                {assignment.title.replace(/ - [a-f0-9-]+$/, '')}
                              </Text>
                              {assignment.description && (
                                <Text size="xs" c="dimmed" lineClamp={1} style={{ whiteSpace: 'pre-wrap' }}>
                                  {assignment.description}
                                </Text>
                              )}
                            </div>
                          </Table.Td>
                          <Table.Td>
                            <Badge 
                              color={getAssignmentTypeColor(assignment.assignment_type)} 
                              variant="light"
                              size="sm"
                            >
                              {getAssignmentTypeLabel(assignment.assignment_type)}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            {assignment.assignment_type === 'wajib' ? (
                              <Group gap="xs">
                                {assignment.class ? (
                                  <Badge variant="outline" size="sm">
                                    {assignment.class.name} - {formatGrade(assignment.class.grade)}
                                  </Badge>
                                ) : (
                                  <Text size="xs" c="dimmed">-</Text>
                                )}
                              </Group>
                            ) : assignment.assignment_type === 'tambahan' && assignment.target_grade ? (
                              <Badge variant="outline" size="sm">
                                Kelas {formatGrade(assignment.target_grade)}
                              </Badge>
                            ) : (
                              <Text size="xs" c="dimmed">-</Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <div>
                              <Text size="sm">
                                {dayjs(assignment.deadline).format('DD MMM YYYY')}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {dayjs(assignment.deadline).format('HH:mm')}
                              </Text>
                            </div>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={deadlineStatus.color} variant="light" size="sm">
                              {deadlineStatus.text}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" fw={500}>
                              {assignment.total_points}
                            </Text>
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
                                  leftSection={<IconEye size={14} />}
                                  onClick={() => navigate(`/teacher/assignments/${assignment.id}`)}
                                >
                                  Lihat Detail
                                </Menu.Item>
                                <Menu.Item
                                  leftSection={<IconEdit size={14} />}
                                  onClick={() => handleEditAssignment(assignment)}
                                >
                                  Edit
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
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </div>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <Text size="sm" c="dimmed">
                    Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredAssignments.length)} dari {filteredAssignments.length} tugas
                  </Text>
                  <Select
                    size="xs"
                    w={80}
                    value={itemsPerPage.toString()}
                    onChange={(value) => handleItemsPerPageChange(Number(value))}
                    data={[
                      { value: '5', label: '5' },
                      { value: '10', label: '10' },
                      { value: '20', label: '20' },
                      { value: '50', label: '50' },
                    ]}
                  />
                  <Text size="xs" c="dimmed">per halaman</Text>
                </Group>
                
                <Group gap="xs">
                  <Button
                    variant="light"
                    size="xs"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Sebelumnya
                  </Button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "filled" : "light"}
                        size="xs"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="light"
                    size="xs"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Selanjutnya
                  </Button>
                </Group>
              </Group>
            )}
          </Stack>
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
                      <MultiSelect
                        label="Target Kelas"
                        placeholder="Pilih satu atau lebih kelas"
                        data={classes.map(cls => ({
                          value: cls.id,
                          label: `${cls.name} - ${formatGrade(cls.grade)}`
                        }))}
                        required
                        {...form.getInputProps('class_ids')}
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

                    <DateTimePicker
                      label="Deadline"
                      placeholder="Pilih tanggal dan waktu deadline"
                      required
                      {...form.getInputProps('deadline')}
                      clearable
                      valueFormat="DD/MM/YYYY HH:mm"
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

        {/* Bulk Edit Modal */}
        <Modal
          opened={bulkEditModalOpen}
          onClose={() => setBulkEditModalOpen(false)}
          title="Edit Massal Tugas"
          size="md"
        >
          <form onSubmit={bulkEditForm.onSubmit(handleBulkEdit)}>
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Edit {selectedAssignments.length} tugas yang dipilih. Kosongkan field yang tidak ingin diubah.
              </Text>
              
              <DateTimePicker
                label="Deadline Baru (Opsional)"
                placeholder="Pilih deadline baru"
                {...bulkEditForm.getInputProps('deadline')}
              />
              
              <NumberInput
                label="Total Poin Baru (Opsional)"
                placeholder="Masukkan total poin baru"
                min={1}
                {...bulkEditForm.getInputProps('total_points')}
              />
              
              <TextInput
                label="Link Drive Baru (Opsional)"
                placeholder="https://drive.google.com/..."
                {...bulkEditForm.getInputProps('drive_link')}
              />
              
              <Group justify="flex-end" gap="sm">
                <Button
                  variant="light"
                  onClick={() => setBulkEditModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" loading={submitting}>
                  Update Tugas
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* Bulk Delete Confirmation Modal */}
        <ConfirmDialog
          opened={bulkDeleteModalOpen}
          onClose={() => setBulkDeleteModalOpen(false)}
          onConfirm={handleBulkDelete}
          title="Hapus Massal Tugas"
          message={`Apakah Anda yakin ingin menghapus ${selectedAssignments.length} tugas yang dipilih? Tindakan ini akan menghapus semua submission yang terkait dan tidak dapat dibatalkan.`}
          confirmLabel="Hapus Semua"
          cancelLabel="Batal"
          confirmColor="red"
        />

        {/* Edit Assignment Modal */}
        <Modal
          opened={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit Tugas"
          size="lg"
        >
          <form onSubmit={editForm.onSubmit(handleUpdateAssignment)}>
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
                      {...editForm.getInputProps('title')}
                    />
                    
                    <Textarea
                      label="Deskripsi"
                      placeholder="Deskripsi tugas (opsional)"
                      rows={4}
                      {...editForm.getInputProps('description')}
                    />

                    <Select
                      label="Tipe Tugas"
                      placeholder="Pilih tipe tugas"
                      data={[
                        { value: 'wajib', label: 'Tugas Wajib (untuk kelas tertentu)' },
                        { value: 'tambahan', label: 'Tugas Tambahan (untuk tingkat tertentu)' },
                      ]}
                      required
                      {...editForm.getInputProps('type')}
                    />

                    <NumberInput
                      label="Total Poin"
                      placeholder="100"
                      min={1}
                      required
                      {...editForm.getInputProps('total_points')}
                    />

                    <TextInput
                      label="Link Drive (Opsional)"
                      placeholder="https://drive.google.com/..."
                      {...editForm.getInputProps('drive_link')}
                    />
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="target" pt="md">
                  <Stack gap="md">
                    {editForm.values.type === 'wajib' ? (
                      <MultiSelect
                        label="Target Kelas"
                        placeholder="Pilih satu atau lebih kelas"
                        data={classes.map(cls => ({
                          value: cls.id,
                          label: `${cls.name} - ${formatGrade(cls.grade)}`
                        }))}
                        required
                        {...editForm.getInputProps('class_ids')}
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
                        {...editForm.getInputProps('target_grade')}
                      />
                    )}

                    <DateTimePicker
                      label="Deadline"
                      placeholder="Pilih deadline"
                      required
                      {...editForm.getInputProps('deadline')}
                    />
                  </Stack>
                </Tabs.Panel>
              </Tabs>

              <Group justify="flex-end" gap="sm">
                <Button
                  variant="light"
                  onClick={() => setEditModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" loading={submitting}>
                  Update Tugas
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </Stack>
    </Container>
  );
}
