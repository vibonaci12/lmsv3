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
  Progress,
  Select,
  Checkbox,
  Modal,
  NumberInput,
  Textarea
} from '@mantine/core';
import { 
  IconArrowLeft,
  IconClipboardList,
  IconUsers,
  IconEdit,
  IconTrash,
  IconCopy,
  IconClock,
  IconCheck,
  IconTrophy,
  IconFileText,
  IconX
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { Assignment, Submission } from '../../types';
import { assignmentService } from '../../services/assignmentService';
import { submissionService } from '../../services/submissionService';
import { LoadingSpinner, EmptyState, ConfirmDialog, Pagination } from '../../components';
import { notifications } from '@mantine/notifications';
// import { formatGrade } from '../../utils/romanNumerals';
import dayjs from 'dayjs';

export function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const teacher = user!;
  
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [submissionFilter, setSubmissionFilter] = useState<'submitted' | 'not_submitted'>('submitted');
  
  // Bulk grading states
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [bulkGradingModalOpen, setBulkGradingModalOpen] = useState(false);
  const [bulkGrade, setBulkGrade] = useState<number>(0);
  const [bulkFeedback, setBulkFeedback] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  
  // Individual grading states
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [individualGrade, setIndividualGrade] = useState<number>(0);
  const [individualFeedback, setIndividualFeedback] = useState<string>('');
  
  // Cancel grading states
  const [cancelGradingModalOpen, setCancelGradingModalOpen] = useState(false);
  const [submissionToCancel, setSubmissionToCancel] = useState<Submission | null>(null);

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
      console.log('Loaded submissions:', submissionsData);
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

  // Bulk grading handlers
  const handleSelectSubmission = (submissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedSubmissions(prev => [...prev, submissionId]);
    } else {
      setSelectedSubmissions(prev => prev.filter(id => id !== submissionId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubmissions(filteredSubmissions.map(s => s.id));
    } else {
      setSelectedSubmissions([]);
    }
  };

  const handleBulkGrade = async () => {
    if (!teacher || selectedSubmissions.length === 0) return;

    try {
      setSubmitting(true);
      await assignmentService.bulkGradeSubmissions(
        selectedSubmissions, 
        bulkGrade, 
        bulkFeedback, 
        teacher.id
      );
      
      notifications.show({
        title: 'Berhasil',
        message: `${selectedSubmissions.length} submission berhasil dinilai`,
        color: 'green',
      });

      setBulkGradingModalOpen(false);
      setSelectedSubmissions([]);
      setBulkGrade(0);
      setBulkFeedback('');
      await loadData();
    } catch (error) {
      console.error('Error bulk grading:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal menilai submissions',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Individual grading handlers
  const handleOpenGradingModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIndividualGrade(submission.grade || 0);
    setIndividualFeedback(submission.feedback || '');
    setGradingModalOpen(true);
  };

  const handleIndividualGrade = async () => {
    if (!teacher || !selectedSubmission) return;

    try {
      setSubmitting(true);
      await submissionService.gradeSubmission(selectedSubmission.id, {
        grade: individualGrade,
        feedback: individualFeedback,
        graded_by: teacher.id
      });
      
      notifications.show({
        title: 'Berhasil',
        message: 'Submission berhasil dinilai',
        color: 'green',
      });

      setGradingModalOpen(false);
      setSelectedSubmission(null);
      setIndividualGrade(0);
      setIndividualFeedback('');
      await loadData();
    } catch (error) {
      console.error('Error grading submission:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal menilai submission',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel grading handlers
  const handleOpenCancelGradingModal = (submission: Submission) => {
    console.log('Opening cancel grading modal for submission:', submission);
    setSubmissionToCancel(submission);
    setCancelGradingModalOpen(true);
  };

  const handleCancelGrading = async () => {
    if (!teacher || !submissionToCancel) return;

    try {
      console.log('Cancelling grading for submission:', submissionToCancel.id, 'by teacher:', teacher.id);
      setSubmitting(true);
      await submissionService.cancelGrading(submissionToCancel.id, teacher.id);
      
      notifications.show({
        title: 'Berhasil',
        message: 'Penilaian berhasil dibatalkan',
        color: 'green',
      });

      setCancelGradingModalOpen(false);
      setSubmissionToCancel(null);
      await loadData();
    } catch (error) {
      console.error('Error cancelling grading:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal membatalkan penilaian',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!assignment) return;

    try {
      await assignmentService.deleteAssignment(assignment.id, teacher.id);
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

  const getSubmissionStats = () => {
    const total = submissions.length;
    const submitted = submissions.filter(s => s.status === 'submitted').length;
    const graded = submissions.filter(s => s.grade !== null).length;
    const pending = total - submitted;

    return { total, submitted, graded, pending };
  };

  const stats = getSubmissionStats();

  // Filter submissions
  const filteredSubmissions = submissions.filter(submission => {
    if (submissionFilter === 'submitted') {
      return submission.status === 'submitted' || submission.status === 'graded';
    } else if (submissionFilter === 'not_submitted') {
      return submission.status === 'pending';
    }
    // Default filter: only show submitted and graded submissions for grading
    return submission.status === 'submitted' || submission.status === 'graded';
  });

  // Pagination logic
  const totalSubmissions = filteredSubmissions.length;
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
                <Badge color={getAssignmentTypeColor(assignment.assignment_type)} variant="light">
                  {getAssignmentTypeLabel(assignment.assignment_type)}
                </Badge>
                <Badge color={status.color} variant="light">
                  {status.label}
                </Badge>
                {assignment.class_id && (
                  <Badge variant="outline">
                    Kelas {assignment.target_grade}
                  </Badge>
                )}
              </Group>
            </div>
          </Group>
          
          <Group gap="sm">
            <Button
              leftSection={<IconEdit size={16} />}
              variant="light"
              onClick={() => {/* Edit functionality not implemented */}}
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
                <Text style={{ whiteSpace: 'pre-wrap' }}>{assignment.description}</Text>
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
              <>
                {/* Filter and Bulk Actions */}
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Daftar Submissions ({filteredSubmissions.length})</Text>
                  <Group gap="sm">
                    <Select
                      placeholder="Filter submissions"
                      value={submissionFilter}
                      onChange={(value) => {
                        setSubmissionFilter(value as 'submitted' | 'not_submitted');
                        setCurrentPage(1);
                      }}
                    data={[
                      { value: 'submitted', label: 'Sudah Submit' },
                      { value: 'not_submitted', label: 'Belum Submit' }
                    ]}
                      size="sm"
                      style={{ width: 200 }}
                    />
                    {selectedSubmissions.length > 0 && (
                      <Button
                        size="sm"
                        variant="light"
                        color="blue"
                        onClick={() => setBulkGradingModalOpen(true)}
                      >
                        Nilai Massal ({selectedSubmissions.length})
                      </Button>
                    )}
                  </Group>
                </Group>

                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>
                        <Checkbox
                          checked={selectedSubmissions.length === filteredSubmissions.length && filteredSubmissions.length > 0}
                          indeterminate={selectedSubmissions.length > 0 && selectedSubmissions.length < filteredSubmissions.length}
                          onChange={(event) => handleSelectAll(event.currentTarget.checked)}
                        />
                      </Table.Th>
                      <Table.Th>Siswa</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Waktu Submit</Table.Th>
                      <Table.Th>Nilai</Table.Th>
                      <Table.Th>Feedback</Table.Th>
                      <Table.Th>Drive Link</Table.Th>
                      <Table.Th>Aksi</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedSubmissions.map((submission) => {
                      console.log('Rendering submission:', submission.id, 'status:', submission.status);
                      return (
                    <Table.Tr key={submission.id}>
                      <Table.Td>
                        <Checkbox
                          checked={selectedSubmissions.includes(submission.id)}
                          onChange={(event) => handleSelectSubmission(submission.id, event.currentTarget.checked)}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Group gap="sm">
                          <div>
                            <Text fw={500}>{submission.student?.full_name || `Student ${submission.student_id}`}</Text>
                            <Text size="sm" c="dimmed">{submission.student?.email || `ID: ${submission.student_id}`}</Text>
                            {submission.submitted_at && (
                              <Text size="xs" c="dimmed">
                                Submit: {dayjs(submission.submitted_at).format('DD/MM/YYYY HH:mm')}
                              </Text>
                            )}
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge 
                          color={
                            submission.status === 'graded' ? 'blue' :
                            submission.status === 'submitted' ? 
                              (dayjs(submission.submitted_at).isAfter(dayjs(assignment.deadline)) ? 'red' : 'green') :
                            'orange'
                          } 
                          variant="light"
                          leftSection={
                            submission.status === 'graded' ? <IconTrophy size={12} /> :
                            submission.status === 'submitted' ? 
                              (dayjs(submission.submitted_at).isAfter(dayjs(assignment.deadline)) ? <IconClock size={12} /> : <IconCheck size={12} />) :
                            <IconClock size={12} />
                          }
                        >
                          {submission.status === 'graded' ? 'Dinilai' :
                           submission.status === 'submitted' ? 
                             (dayjs(submission.submitted_at).isAfter(dayjs(assignment.deadline)) ? 'Terlambat' : 'Dikirim') :
                           'Pending'}
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
                        <Group gap="xs">
                          <Button
                            size="xs"
                            variant="light"
                            leftSection={<IconEdit size={14} />}
                            disabled={submission.status === 'pending'}
                            onClick={() => handleOpenGradingModal(submission)}
                          >
                            {submission.status === 'graded' ? 'Edit Nilai' : 'Nilai'}
                          </Button>
                          {submission.status === 'graded' && (
                            <Button
                              size="xs"
                              variant="light"
                              color="red"
                              leftSection={<IconX size={14} />}
                              onClick={() => {
                                console.log('Cancel button clicked for submission:', submission);
                                handleOpenCancelGradingModal(submission);
                              }}
                            >
                              Batalkan
                            </Button>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                    );
                    })}
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

        {/* Bulk Grading Modal */}
        <Modal
          opened={bulkGradingModalOpen}
          onClose={() => setBulkGradingModalOpen(false)}
          title="Nilai Massal"
          size="md"
        >
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Anda akan memberikan nilai yang sama untuk {selectedSubmissions.length} submission.
            </Text>
            
            <NumberInput
              label="Nilai"
              placeholder="Masukkan nilai"
              min={0}
              max={assignment?.total_points || 100}
              value={bulkGrade}
              onChange={(value) => setBulkGrade(Number(value) || 0)}
              required
            />
            
            <Textarea
              label="Feedback (Opsional)"
              placeholder="Masukkan feedback untuk semua submission"
              value={bulkFeedback}
              onChange={(event) => setBulkFeedback(event.currentTarget.value)}
              rows={3}
            />
            
            <Group justify="flex-end" gap="sm">
              <Button
                variant="light"
                onClick={() => setBulkGradingModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                onClick={handleBulkGrade}
                loading={submitting}
                disabled={bulkGrade < 0 || bulkGrade > (assignment?.total_points || 100)}
              >
                Berikan Nilai
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Individual Grading Modal */}
        <Modal
          opened={gradingModalOpen}
          onClose={() => setGradingModalOpen(false)}
          title={`Nilai Submission - ${selectedSubmission?.student?.full_name || 'Siswa'}`}
          size="md"
        >
          <Stack gap="md">
            {selectedSubmission && (
              <>
                <div>
                  <Text size="sm" c="dimmed">Siswa</Text>
                  <Text fw={500}>{selectedSubmission.student?.full_name || 'Unknown Student'}</Text>
                </div>
                
                <div>
                  <Text size="sm" c="dimmed">Waktu Submit</Text>
                  <Text fw={500}>
                    {selectedSubmission.submitted_at ? 
                      dayjs(selectedSubmission.submitted_at).format('DD MMMM YYYY, HH:mm') : 
                      '-'
                    }
                  </Text>
                </div>

                {selectedSubmission.drive_link && (
                  <div>
                    <Text size="sm" c="dimmed">Link Submission</Text>
                    <Button
                      size="sm"
                      variant="light"
                      component="a"
                      href={selectedSubmission.drive_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Lihat File
                    </Button>
                  </div>
                )}
              </>
            )}
            
            <NumberInput
              label="Nilai"
              placeholder="Masukkan nilai"
              min={0}
              max={assignment?.total_points || 100}
              value={individualGrade}
              onChange={(value) => setIndividualGrade(Number(value) || 0)}
              required
            />
            
            <Textarea
              label="Feedback"
              placeholder="Masukkan feedback untuk siswa"
              value={individualFeedback}
              onChange={(event) => setIndividualFeedback(event.currentTarget.value)}
              rows={4}
            />
            
            <Group justify="flex-end" gap="sm">
              <Button
                variant="light"
                onClick={() => setGradingModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                onClick={handleIndividualGrade}
                loading={submitting}
                disabled={individualGrade < 0 || individualGrade > (assignment?.total_points || 100)}
              >
                Simpan Nilai
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Cancel Grading Confirmation Modal */}
        <ConfirmDialog
          opened={cancelGradingModalOpen}
          onClose={() => setCancelGradingModalOpen(false)}
          onConfirm={handleCancelGrading}
          title="Batalkan Penilaian"
          message={`Apakah Anda yakin ingin membatalkan penilaian untuk ${submissionToCancel?.student?.full_name || 'siswa ini'}? Tindakan ini akan menghapus nilai dan feedback yang telah diberikan, dan status submission akan kembali ke "Dikirim".`}
          confirmLabel="Batalkan Penilaian"
          cancelLabel="Tutup"
          confirmColor="red"
        />
      </Stack>
    </Container>
  );
}
