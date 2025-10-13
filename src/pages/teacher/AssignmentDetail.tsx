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
  Badge,
  ActionIcon,
  SimpleGrid,
  Paper,
  Table,
  Tabs,
  Progress,
  Alert,
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Select
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { 
  IconArrowLeft,
  IconClipboardList,
  IconCalendar,
  IconUsers,
  IconEdit,
  IconTrash,
  IconCopy,
  IconClock,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconTrophy,
  IconFileText
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { Assignment, Submission } from '../../types';
import { assignmentService } from '../../services/assignmentService';
import { submissionService } from '../../services/submissionService';
import { LoadingSpinner, EmptyState, ConfirmDialog } from '../../components';
import { notifications } from '@mantine/notifications';
import { formatGrade } from '../../utils/romanNumerals';
import dayjs from 'dayjs';

export function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const teacher = user!;
  
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [assignmentData, submissionsData] = await Promise.all([
        assignmentService.getAssignmentById(id),
        submissionService.getAssignmentSubmissions(id)
      ]);

      setAssignment(assignmentData);
      setSubmissions(submissionsData);
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

  const handleDeleteAssignment = async () => {
    if (!assignment) return;

    try {
      await assignmentService.deleteAssignment(assignment.id);
      notifications.show({
        title: 'Berhasil',
        message: 'Tugas berhasil dihapus',
        color: 'green',
      });
      navigate('/teacher/assignments');
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
    
    if (!assignment.is_published) return { label: 'Draft', color: 'gray' };
    if (deadline <= now) return { label: 'Expired', color: 'red' };
    return { label: 'Active', color: 'green' };
  };

  const getAssignmentTypeLabel = (type: string) => {
    return type === 'wajib' ? 'Tugas Wajib' : 'Tugas Tambahan';
  };

  const getAssignmentTypeColor = (type: string) => {
    return type === 'wajib' ? 'blue' : 'orange';
  };

  const getSubmissionStats = () => {
    const total = submissions.length;
    const submitted = submissions.filter(s => s.status === 'submitted').length;
    const graded = submissions.filter(s => s.grade !== null).length;
    const pending = total - submitted;

    return { total, submitted, graded, pending };
  };

  const stats = getSubmissionStats();

  if (loading) {
    return <LoadingSpinner message="Memuat data tugas..." />;
  }

  if (!assignment) {
    return (
      <Container size="xl" py="xl">
        <EmptyState
          icon={IconClipboardList}
          title="Tugas tidak ditemukan"
          description="Tugas yang Anda cari tidak ditemukan"
          actionLabel="Kembali ke Daftar Tugas"
          onAction={() => navigate('/teacher/assignments')}
        />
      </Container>
    );
  }

  const status = getAssignmentStatus(assignment);

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <ActionIcon
              variant="subtle"
              onClick={() => navigate('/teacher/assignments')}
            >
              <IconArrowLeft size={16} />
            </ActionIcon>
            <div>
              <Title order={1}>{assignment.title}</Title>
              <Group gap="sm" mt="xs">
                <Badge color={getAssignmentTypeColor(assignment.type)} variant="light">
                  {getAssignmentTypeLabel(assignment.type)}
                </Badge>
                <Badge color={status.color} variant="light">
                  {status.label}
                </Badge>
                {assignment.class && (
                  <Badge variant="outline">
                    {assignment.class.name} - {formatGrade(assignment.class.grade)}
                  </Badge>
                )}
              </Group>
            </div>
          </Group>
          
          <Group gap="sm">
            <Button
              leftSection={<IconEdit size={16} />}
              variant="light"
              onClick={() => setEditModalOpen(true)}
            >
              Edit Tugas
            </Button>
            <Button
              leftSection={<IconCopy size={16} />}
              variant="light"
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
            </Button>
            <Button
              leftSection={<IconTrash size={16} />}
              variant="light"
              color="red"
              onClick={() => setDeleteModalOpen(true)}
            >
              Hapus
            </Button>
          </Group>
        </Group>

        {/* Stats */}
        <SimpleGrid cols={{ base: 1, sm: 4 }}>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconUsers size={32} color="var(--mantine-color-blue-6)" />
              <div>
                <Text size="lg" fw={600}>{stats.total}</Text>
                <Text size="sm" c="dimmed">Total Siswa</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconCheck size={32} color="var(--mantine-color-green-6)" />
              <div>
                <Text size="lg" fw={600}>{stats.submitted}</Text>
                <Text size="sm" c="dimmed">Sudah Submit</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconClock size={32} color="var(--mantine-color-orange-6)" />
              <div>
                <Text size="lg" fw={600}>{stats.pending}</Text>
                <Text size="sm" c="dimmed">Belum Submit</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconTrophy size={32} color="var(--mantine-color-purple-6)" />
              <div>
                <Text size="lg" fw={600}>{stats.graded}</Text>
                <Text size="sm" c="dimmed">Sudah Dinilai</Text>
              </div>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Assignment Info */}
        <Card withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600}>Informasi Tugas</Text>
            </Group>
            
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <div>
                <Text size="sm" c="dimmed">Deadline</Text>
                <Text fw={500}>
                  {dayjs(assignment.deadline).format('dddd, DD MMMM YYYY, HH:mm')}
                </Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Total Poin</Text>
                <Text fw={500}>{assignment.total_points} poin</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Dibuat</Text>
                <Text fw={500}>
                  {dayjs(assignment.created_at).format('DD MMMM YYYY, HH:mm')}
                </Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Status</Text>
                <Badge color={status.color} variant="light">
                  {status.label}
                </Badge>
              </div>
            </SimpleGrid>

            {assignment.description && (
              <div>
                <Text size="sm" c="dimmed" mb="xs">Deskripsi</Text>
                <Text>{assignment.description}</Text>
              </div>
            )}
          </Stack>
        </Card>

        {/* Submission Progress */}
        <Card withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600}>Progress Submission</Text>
              <Text size="sm" c="dimmed">
                {stats.submitted} dari {stats.total} siswa
              </Text>
            </Group>
            
            <Progress 
              value={(stats.submitted / stats.total) * 100} 
              size="lg" 
              radius="md"
              color="green"
            />
            
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Tingkat submission: {((stats.submitted / stats.total) * 100).toFixed(1)}%
              </Text>
              <Text size="sm" c="dimmed">
                Tingkat penilaian: {((stats.graded / stats.total) * 100).toFixed(1)}%
              </Text>
            </Group>
          </Stack>
        </Card>

        {/* Submissions */}
        <Card withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600}>Daftar Submission ({submissions.length})</Text>
              <Button
                leftSection={<IconFileText size={16} />}
                variant="light"
                onClick={() => {
                  // TODO: Implement export functionality
                  notifications.show({
                    title: 'Info',
                    message: 'Fitur export akan segera tersedia',
                    color: 'blue',
                  });
                }}
              >
                Export
              </Button>
            </Group>

            {submissions.length > 0 ? (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Siswa</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Waktu Submit</Table.Th>
                    <Table.Th>Nilai</Table.Th>
                    <Table.Th>Feedback</Table.Th>
                    <Table.Th width={100}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {submissions.map((submission) => (
                    <Table.Tr key={submission.id}>
                      <Table.Td>
                        <Group gap="sm">
                          <div>
                            <Text fw={500}>{submission.student?.full_name || 'Unknown'}</Text>
                            <Text size="sm" c="dimmed">{submission.student?.email}</Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge 
                          color={submission.status === 'submitted' ? 'green' : 'orange'} 
                          variant="light"
                          leftSection={submission.status === 'submitted' ? <IconCheck size={12} /> : <IconClock size={12} />}
                        >
                          {submission.status === 'submitted' ? 'Submitted' : 'Pending'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {submission.submitted_at ? 
                            dayjs(submission.submitted_at).format('DD MMM YYYY, HH:mm') : 
                            '-'
                          }
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        {submission.grade !== null ? (
                          <Badge color="blue" variant="light">
                            {submission.grade}/{assignment.total_points}
                          </Badge>
                        ) : (
                          <Text size="sm" c="dimmed">Belum dinilai</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" lineClamp={1}>
                          {submission.feedback || '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => navigate(`/teacher/submissions/${submission.id}`)}
                        >
                          Detail
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <EmptyState
                icon={IconUsers}
                title="Belum ada submission"
                description="Belum ada siswa yang mengirimkan tugas ini"
              />
            )}
          </Stack>
        </Card>

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          opened={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteAssignment}
          title="Hapus Tugas"
          message={`Apakah Anda yakin ingin menghapus tugas "${assignment.title}"? Tindakan ini akan menghapus semua submission yang terkait dan tidak dapat dibatalkan.`}
          confirmLabel="Hapus"
          cancelLabel="Batal"
          confirmColor="red"
        />
      </Stack>
    </Container>
  );
}
