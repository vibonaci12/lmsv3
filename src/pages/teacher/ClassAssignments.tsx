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
  Alert,
  Table,
  Avatar,
  Modal,
  NumberInput,
  Textarea,
  Select,
} from '@mantine/core';
import { 
  IconArrowLeft,
  IconBook, 
  IconPlus,
  IconCalendar,
  IconUsers,
  IconClock,
  IconCheck,
  IconEdit,
  IconEye
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { Assignment, Submission } from '../../types';
import { classService } from '../../services/classService';
import { assignmentService } from '../../services/assignmentService';
import { submissionService } from '../../services/submissionService';
import { LoadingSpinner, EmptyState, Pagination } from '../../components';
import { notifications } from '@mantine/notifications';
import { formatGrade } from '../../utils/romanNumerals';
import dayjs from 'dayjs';

export function ClassAssignments() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const teacher = user!;
  
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'submitted' | 'not_submitted'>('all');

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const classInfo = await classService.getClassById(id);
      
      // Get assignments for this class
      const allAssignments = await assignmentService.getAllAssignments();
      const classAssignments = allAssignments.filter(assignment => 
        assignment.class_id === id
      );
      
      setClassData(classInfo);
      setAssignments(classAssignments);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (assignmentId: string) => {
    try {
      const assignmentSubmissions = await submissionService.getAssignmentSubmissions(assignmentId);
      setSubmissions(assignmentSubmissions);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const getAssignmentStatus = (assignment: Assignment) => {
    const now = dayjs();
    const deadline = dayjs(assignment.deadline);
    
    if (now.isAfter(deadline)) {
      return { status: 'overdue', color: 'red', label: 'Terlambat' };
    } else if (deadline.diff(now, 'day') <= 1) {
      return { status: 'urgent', color: 'orange', label: 'Mendesak' };
    } else {
      return { status: 'active', color: 'green', label: 'Aktif' };
    }
  };

  const handleViewSubmissions = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    await loadSubmissions(assignment.id);
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission || !selectedAssignment) return;

    try {
      await submissionService.gradeSubmission(selectedSubmission.id, {
        grade: grade,
        feedback: feedback,
        graded_by: teacher.id,
      });

      notifications.show({
        title: 'Berhasil',
        message: 'Nilai berhasil disimpan',
        color: 'green',
      });

      setGradingModalOpen(false);
      setSelectedSubmission(null);
      setGrade(0);
      setFeedback('');
      
      // Reload submissions
      if (selectedAssignment) {
        await loadSubmissions(selectedAssignment.id);
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal menyimpan nilai',
        color: 'red',
      });
    }
  };

  const openGradingModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade || 0);
    setFeedback(submission.feedback || '');
    setGradingModalOpen(true);
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter(submission => {
    if (submissionFilter === 'submitted') {
      return submission.status === 'submitted' || submission.status === 'graded';
    } else if (submissionFilter === 'not_submitted') {
      return submission.status === 'pending';
    }
    return true; // 'all'
  });

  // Pagination logic
  const totalSubmissions = filteredSubmissions.length;
  const totalPages = Math.ceil(totalSubmissions / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  if (loading) {
    return <LoadingSpinner message="Memuat data tugas..." />;
  }

  if (!classData) {
    return (
      <Container size="xl" py="xl">
        <EmptyState
          icon={IconBook}
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
              <Title order={1}>Penilaian Tugas</Title>
              <Text c="dimmed">
                {classData.name} - {formatGrade(classData.grade)}
              </Text>
            </div>
          </Group>
        </Group>

        {/* Stats */}
        <SimpleGrid cols={{ base: 1, sm: 4 }}>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconBook size={32} color="var(--mantine-color-blue-6)" />
              <div>
                <Text size="lg" fw={600}>{assignments.length}</Text>
                <Text size="sm" c="dimmed">Total Tugas</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconCheck size={32} color="var(--mantine-color-green-6)" />
              <div>
                <Text size="lg" fw={600}>
                  {assignments.filter(a => dayjs().isAfter(dayjs(a.deadline))).length}
                </Text>
                <Text size="sm" c="dimmed">Selesai</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconClock size={32} color="var(--mantine-color-orange-6)" />
              <div>
                <Text size="lg" fw={600}>
                  {assignments.filter(a => {
                    const deadline = dayjs(a.deadline);
                    const now = dayjs();
                    return now.isBefore(deadline) && deadline.diff(now, 'day') <= 1;
                  }).length}
                </Text>
                <Text size="sm" c="dimmed">Mendesak</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconUsers size={32} color="var(--mantine-color-purple-6)" />
              <div>
                <Text size="lg" fw={600}>{classData.student_count || 0}</Text>
                <Text size="sm" c="dimmed">Total Siswa</Text>
              </div>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Assignments List */}
        <Card withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600}>Daftar Tugas ({assignments.length})</Text>
            </Group>

            {assignments.length > 0 ? (
              <Stack gap="sm">
                {assignments.map((assignment) => {
                  const status = getAssignmentStatus(assignment);
                  return (
                    <Paper key={assignment.id} p="md" withBorder>
                      <Group justify="space-between">
                        <div style={{ flex: 1 }}>
                          <Group gap="sm" mb="xs">
                            <Text fw={600}>{assignment.title}</Text>
                            <Badge color={status.color} variant="light" size="sm">
                              {status.label}
                            </Badge>
                          </Group>
                          <Text size="sm" c="dimmed" mb="xs">
                            {assignment.description}
                          </Text>
                          <Group gap="md">
                            <Group gap="xs">
                              <IconCalendar size={14} />
                              <Text size="sm">
                                Deadline: {dayjs(assignment.deadline).format('DD/MM/YYYY HH:mm')}
                              </Text>
                            </Group>
                            <Group gap="xs">
                              <IconUsers size={14} />
                              <Text size="sm">
                                {assignment.assignment_type === 'wajib' ? 'Wajib' : 'Tambahan'}
                              </Text>
                            </Group>
                            <Group gap="xs">
                              <IconCheck size={14} />
                              <Text size="sm">
                                {assignment.total_points} poin
                              </Text>
                            </Group>
                          </Group>
                        </div>
                        <Button
                          leftSection={<IconEye size={16} />}
                          variant="light"
                          onClick={() => handleViewSubmissions(assignment)}
                        >
                          Lihat & Nilai
                        </Button>
                      </Group>
                    </Paper>
                  );
                })}
              </Stack>
            ) : (
              <EmptyState
                icon={IconBook}
                title="Belum ada tugas"
                description="Belum ada tugas yang dibuat untuk kelas ini. Tugas dibuat melalui menu Tugas di sidebar."
              />
            )}
          </Stack>
        </Card>

        {/* Submissions Modal */}
        <Modal
          opened={!!selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          title={`Submissions - ${selectedAssignment?.title}`}
          size="xl"
        >
          <Stack gap="md">
            {submissions.length > 0 ? (
              <>
                {/* Filter */}
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Daftar Submissions ({filteredSubmissions.length})</Text>
                  <Select
                    placeholder="Filter submissions"
                    value={submissionFilter}
                    onChange={(value) => {
                      setSubmissionFilter(value as 'all' | 'submitted' | 'not_submitted');
                      setCurrentPage(1);
                    }}
                    data={[
                      { value: 'all', label: 'Semua' },
                      { value: 'submitted', label: 'Sudah Submit' },
                      { value: 'not_submitted', label: 'Belum Submit' }
                    ]}
                    size="sm"
                    style={{ width: 200 }}
                  />
                </Group>

                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Siswa</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Nilai</Table.Th>
                      <Table.Th>Dikirim</Table.Th>
                      <Table.Th>Drive Link</Table.Th>
                      <Table.Th width={100}></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedSubmissions.map((submission) => (
                    <Table.Tr key={submission.id}>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar size="sm" radius="xl" color="blue">
                            {submission.student?.full_name?.charAt(0) || 'S'}
                          </Avatar>
                          <div>
                            <Text fw={500}>{submission.student?.full_name || 'Unknown'}</Text>
                            <Text size="sm" c="dimmed">{submission.student?.email}</Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge 
                          color={
                            submission.status === 'graded' ? 'blue' :
                            submission.status === 'submitted' ? 
                              (selectedAssignment && dayjs(submission.submitted_at).isAfter(dayjs(selectedAssignment.deadline)) ? 'red' : 'green') :
                            'orange'
                          } 
                          variant="light" 
                          size="sm"
                        >
                          {submission.status === 'graded' ? 'Dinilai' :
                           submission.status === 'submitted' ? 
                             (selectedAssignment && dayjs(submission.submitted_at).isAfter(dayjs(selectedAssignment.deadline)) ? 'Terlambat' : 'Dikirim') :
                           'Pending'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {submission.grade !== null ? (
                          <Text fw={500}>{submission.grade}/{selectedAssignment?.total_points}</Text>
                        ) : (
                          <Text c="dimmed">Belum dinilai</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {submission.submitted_at ? 
                            dayjs(submission.submitted_at).format('DD/MM/YYYY HH:mm') : 
                            '-'
                          }
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        {submission.drive_link ? (
                          <Button
                            size="xs"
                            variant="light"
                            component="a"
                            href={submission.drive_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat File
                          </Button>
                        ) : (
                          <Text size="sm" c="dimmed">-</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Button
                          size="sm"
                          variant="light"
                          leftSection={<IconEdit size={14} />}
                          onClick={() => openGradingModal(submission)}
                          disabled={submission.status === 'pending'}
                        >
                          Nilai
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                
                {/* Pagination */}
                <Pagination
                  totalItems={totalSubmissions}
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  showItemsPerPage={true}
                  showTotal={true}
                  size="sm"
                />
              </>
            ) : (
              <EmptyState
                icon={IconUsers}
                title="Belum ada submission"
                description="Belum ada siswa yang mengerjakan tugas ini"
              />
            )}
          </Stack>
        </Modal>

        {/* Grading Modal */}
        <Modal
          opened={gradingModalOpen}
          onClose={() => setGradingModalOpen(false)}
          title="Nilai Submission"
          size="md"
        >
          <Stack gap="md">
            {selectedSubmission && (
              <>
                <Alert color="blue">
                  <Text size="sm">
                    <strong>Siswa:</strong> {selectedSubmission.student?.full_name}
                    <br />
                    <strong>Email:</strong> {selectedSubmission.student?.email}
                    <br />
                    <strong>Total Poin:</strong> {selectedAssignment?.total_points}
                  </Text>
                </Alert>

                <NumberInput
                  label="Nilai"
                  placeholder="Masukkan nilai"
                  min={0}
                  max={selectedAssignment?.total_points || 100}
                  value={grade}
                  onChange={(value) => setGrade(Number(value))}
                />

                <Textarea
                  label="Feedback"
                  placeholder="Masukkan feedback untuk siswa"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />

                <Group justify="flex-end" gap="sm">
                  <Button
                    variant="subtle"
                    onClick={() => setGradingModalOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button onClick={handleGradeSubmission}>
                    Simpan Nilai
                  </Button>
                </Group>
              </>
            )}
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
}