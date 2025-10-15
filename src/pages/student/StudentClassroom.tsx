import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Card,
  SimpleGrid,
  Paper,
  Badge,
  Button,
  Modal,
  Textarea,
  Tabs,
  Divider,
  Alert,
  ThemeIcon,
  Table,
  Avatar,
  FileInput,
} from '@mantine/core';
import { 
  IconBook,
  IconClipboardList,
  IconFileText,
  IconDownload,
  IconBell,
  IconClock,
  IconCheck,
  IconInfoCircle,
  IconExternalLink,
  IconPaperclip,
  IconVideo,
  IconFile,
  IconPresentation,
  IconUpload,
  IconEye,
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner, EmptyState, Pagination, usePagination } from '../../components';
import { notifications } from '@mantine/notifications';
import { formatGrade } from '../../utils/romanNumerals';
import { supabase } from '../../lib/supabase';
import dayjs from 'dayjs';

interface ClassInfo {
  id: string;
  name: string;
  subject: string;
  grade: string;
  description?: string;
  teacher: {
    id: string;
    full_name: string;
    email: string;
  };
  enrolled_at: string;
  total_students: number;
  total_assignments: number;
  completed_assignments: number;
  upcoming_assignments: number;
  recent_announcements: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  teacher: {
    full_name: string;
  };
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
}

interface Material {
  id: string;
  title: string;
  description?: string;
  type: 'document' | 'video' | 'presentation' | 'link';
  url?: string;
  file_name?: string;
  created_at: string;
  teacher: {
    full_name: string;
  };
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  deadline: string;
  total_points: number;
  assignment_type: 'wajib' | 'tambahan';
  class_id?: string;
  target_grade?: string;
  drive_link?: string;
  created_at: string;
  created_by: string;
  teacher: {
    id: string;
    full_name: string;
    email: string;
  };
  class: {
    id: string;
    name: string;
    subject: string;
    grade: string;
  };
  submission?: {
    id: string;
    status: 'pending' | 'submitted' | 'graded';
    submitted_at?: string;
    grade?: number;
    feedback?: string;
  };
  questions?: Array<{
    id: string;
    question_text: string;
    question_type: 'multiple_choice' | 'essay' | 'true_false';
    points: number;
  }>;
}

export function StudentClassroom() {
  const { user } = useAuth();
  const student = user!;
  
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // Pagination for assignments
  const {
    currentPage,
    itemsPerPage,
    totalItems,
    paginatedData: paginatedAssignments,
    handlePageChange,
    handleItemsPerPageChange,
    resetPagination
  } = usePagination(assignments, 5, 1);
  
  // Assignment submission states
  const [submissionModal, setSubmissionModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading classroom data for student:', student.id);
      
      // Load classes, announcements, materials, and assignments in parallel
      const [classData, announcementsData, materialsData, assignmentsData] = await Promise.all([
        loadClasses(),
        loadAnnouncements(),
        loadMaterials(),
        loadAssignments()
      ]);

      setClasses(classData);
      setAnnouncements(announcementsData);
      setMaterials(materialsData);
      setAssignments(assignmentsData);
      resetPagination();
    } catch (error) {
      console.error('Error loading classroom data:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal memuat data kelas',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      // Get student's enrolled classes
      const { data: classStudents, error: classStudentsError } = await supabase
        .from('class_students')
        .select(`
          enrolled_at,
          class_id,
          class:classes(
            id,
            name,
            grade,
            description,
            created_by
          )
        `)
        .eq('student_id', student.id);

      if (classStudentsError) throw classStudentsError;

      const classInfos: ClassInfo[] = [];
      
      for (const cs of classStudents || []) {
        const classData = Array.isArray(cs.class) ? cs.class[0] : cs.class;
        if (!classData || !classData.id || !classData.created_by) continue;

        // Get teacher info
        let teacherData;
        const { data: teacherDataResult, error: teacherError } = await supabase
          .from('teachers')
          .select('id, full_name, email')
          .eq('id', classData.created_by)
          .single();

        if (teacherError) {
          console.error('Error fetching teacher:', teacherError);
          // Use default teacher data if fetch fails
          teacherData = { id: classData.created_by, full_name: 'Unknown Teacher', email: '' };
        } else {
          teacherData = teacherDataResult;
        }

        // Get assignment statistics
        const { data: assignments, error: assignmentsError } = await supabase
          .from('assignments')
          .select('id, deadline')
          .or(`class_id.eq.${classData.id},target_grade.eq.${classData.grade}`);

        if (assignmentsError) {
          console.error('Error fetching assignments:', assignmentsError);
          continue;
        }

        // Get student's submissions
        const { data: submissions, error: submissionsError } = await supabase
          .from('submissions')
          .select('assignment_id, status')
          .eq('student_id', student.id)
          .in('assignment_id', assignments?.map(a => a.id) || []);

        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError);
          continue;
        }

        const now = new Date();
        const totalAssignments = assignments?.length || 0;
        const completedAssignments = submissions?.filter(s => s.status === 'graded').length || 0;
        const upcomingAssignments = assignments?.filter(a => new Date(a.deadline) > now).length || 0;

        // Get recent announcements count
        const { data: announcements, error: announcementsError } = await supabase
          .from('announcements')
          .select('id')
          .eq('class_id', classData.id)
          .gte('created_at', dayjs().subtract(7, 'days').toISOString());

        if (announcementsError) {
          console.error('Error fetching announcements:', announcementsError);
        }

        classInfos.push({
          id: classData.id,
          name: classData.name,
          subject: 'Matematika', // Default subject since it's not in the table
          grade: classData.grade,
          description: classData.description,
          teacher: teacherData,
          enrolled_at: cs.enrolled_at,
          total_students: 0,
          total_assignments: totalAssignments,
          completed_assignments: completedAssignments,
          upcoming_assignments: upcomingAssignments,
          recent_announcements: announcements?.length || 0
        });
      }

      return classInfos;
    } catch (error) {
      console.error('Error loading classes:', error);
      return [];
    }
  };

  const loadAnnouncements = async () => {
    try {
      // Get student's class IDs
      const { data: classStudents, error: classStudentsError } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', student.id);

      if (classStudentsError) throw classStudentsError;

      const classIds = classStudents?.map(cs => cs.class_id) || [];
      if (classIds.length === 0) return [];

      // Load announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select(`
          id,
          title,
          content,
          created_at,
          teacher_id
        `)
        .in('class_id', classIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (announcementsError) throw announcementsError;

      // Get teacher info for announcements
      const announcementsWithTeacher = await Promise.all(
        (announcementsData || []).map(async (announcement) => {
          const { data: teacherData } = await supabase
            .from('teachers')
            .select('full_name')
            .eq('id', announcement.teacher_id)
            .single();

          return {
            ...announcement,
            teacher: teacherData || { full_name: 'Unknown Teacher' },
            attachments: []
          };
        })
      );

      return announcementsWithTeacher;
    } catch (error) {
      console.error('Error loading announcements:', error);
      return [];
    }
  };

  const loadMaterials = async () => {
    try {
      // Get student's class IDs
      const { data: classStudents, error: classStudentsError } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', student.id);

      if (classStudentsError) throw classStudentsError;

      const classIds = classStudents?.map(cs => cs.class_id) || [];
      if (classIds.length === 0) return [];

      // Load materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select(`
          id,
          title,
          description,
          file_url,
          file_name,
          file_type,
          created_at,
          created_by
        `)
        .in('class_id', classIds)
        .order('created_at', { ascending: false });

      if (materialsError) throw materialsError;

      // Get teacher info for materials
      const materialsWithTeacher = await Promise.all(
        (materialsData || []).map(async (material) => {
          const { data: teacherData } = await supabase
            .from('teachers')
            .select('full_name')
            .eq('id', material.created_by)
            .single();

          // Determine type from file_type
          const getTypeFromFileType = (fileType: string): 'document' | 'video' | 'presentation' | 'link' => {
            if (fileType?.includes('video')) return 'video';
            if (fileType?.includes('pdf') || fileType?.includes('document')) return 'document';
            if (fileType?.includes('presentation') || fileType?.includes('ppt') || fileType?.includes('pptx')) return 'presentation';
            if (fileType?.includes('link') || fileType?.includes('url')) return 'link';
            return 'document';
          };

          return {
            ...material,
            type: getTypeFromFileType(material.file_type),
            url: material.file_url,
            teacher: teacherData || { full_name: 'Unknown Teacher' }
          };
        })
      );

      return materialsWithTeacher;
    } catch (error) {
      console.error('Error loading materials:', error);
      return [];
    }
  };

  const loadAssignments = async () => {
    try {
      // Get student's class IDs and grade
      const { data: classStudents, error: classStudentsError } = await supabase
        .from('class_students')
        .select('class_id, class:classes(grade)')
        .eq('student_id', student.id);

      if (classStudentsError) throw classStudentsError;

      const classIds = classStudents?.map(cs => cs.class_id) || [];
      const studentGrade = '10'; // Default grade, will be updated based on class

      if (classIds.length === 0) return [];

      // Load assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          deadline,
          total_points,
          assignment_type,
          class_id,
          target_grade,
          drive_link,
          created_at,
          created_by
        `)
        .or(classIds.length > 0 ? `class_id.in.(${classIds.join(',')}),target_grade.eq.${studentGrade}` : `target_grade.eq.${studentGrade}`)
        .order('deadline', { ascending: true });

      if (assignmentsError) throw assignmentsError;

      // Load submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          id,
          assignment_id,
          status,
          submitted_at,
          grade,
          feedback
        `)
        .eq('student_id', student.id);

      if (submissionsError) {
        console.error('Error loading submissions:', submissionsError);
      }

      // Get teacher and class info for each assignment
      const assignmentsWithDetails = await Promise.all(
        (assignmentsData || []).map(async (assignment) => {
          // Get teacher info
          const { data: teacherData } = await supabase
            .from('teachers')
            .select('id, full_name, email')
            .eq('id', assignment.created_by)
            .single();

          // Get class info
          const { data: classData } = await supabase
            .from('classes')
            .select('id, name, grade')
            .eq('id', assignment.class_id)
            .single();

          // Find submission for this assignment
          const submission = submissionsData?.find(s => s.assignment_id === assignment.id);

          return {
            ...assignment,
            teacher: teacherData || { id: '', full_name: 'Unknown Teacher', email: '' },
            class: classData ? { ...classData, subject: 'Matematika' } : { id: '', name: 'Unknown Class', subject: 'Matematika', grade: '' },
            submission: submission || undefined
          };
        })
      );

      return assignmentsWithDetails;
    } catch (error) {
      console.error('Error loading assignments:', error);
      return [];
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment) return;

    try {
      setSubmitting(true);

      let fileUrl = '';
      if (submissionFile) {
        // Upload file to Supabase Storage
        const fileExt = submissionFile.name.split('.').pop();
        const fileName = `${selectedAssignment.id}_${student.id}_${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(fileName, submissionFile);

        if (uploadError) throw uploadError;
        fileUrl = uploadData.path;
      }

      // Create submission record
      const { error: submissionError } = await supabase
        .from('submissions')
        .insert({
          assignment_id: selectedAssignment.id,
          student_id: student.id,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          file_url: fileUrl,
          submission_text: submissionText || null
        });

      if (submissionError) throw submissionError;

      notifications.show({
        title: 'Berhasil',
        message: 'Tugas berhasil dikumpulkan',
        color: 'green',
      });

      setSubmissionModal(false);
      setSelectedAssignment(null);
      setSubmissionFile(null);
      setSubmissionText('');
      
      // Reload assignments
      const newAssignments = await loadAssignments();
      setAssignments(newAssignments);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal mengumpulkan tugas',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getAssignmentStatus = (assignment: Assignment) => {
    if (assignment.submission) {
      if (assignment.submission.status === 'graded') {
        return { status: 'graded', color: 'green', text: 'Dinilai' };
      } else if (assignment.submission.status === 'submitted') {
        return { status: 'submitted', color: 'blue', text: 'Dikumpulkan' };
      }
    }
    
    const now = new Date();
    const deadline = new Date(assignment.deadline);
    
    if (deadline < now) {
      return { status: 'overdue', color: 'red', text: 'Terlambat' };
    } else if (deadline.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return { status: 'due_soon', color: 'orange', text: 'Segera' };
    } else {
      return { status: 'pending', color: 'gray', text: 'Belum' };
    }
  };

  if (loading) {
    return <LoadingSpinner message="Memuat data kelas..." />;
  }

  if (classes.length === 0) {
    return (
      <Container size="xl" py="xl">
        <EmptyState
          icon={IconBook}
          title="Belum Ada Kelas"
          description="Anda belum terdaftar di kelas manapun. Hubungi guru untuk mendaftar ke kelas."
        />
      </Container>
    );
  }

  // Since student only has one class, show it directly
  const classInfo = classes[0];

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Title order={1}>Kelas & Tugas</Title>
          <Text c="dimmed">Informasi kelas, pengumuman, materi, dan tugas pembelajaran</Text>
        </div>

        {/* Class Information Card */}
        <Card withBorder radius="md" p="xl">
          <Stack gap="lg">
            {/* Class Header */}
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fw={700} size="xl">{classInfo.name}</Text>
                <Text size="lg" c="dimmed">{classInfo.subject}</Text>
                <Text size="md" c="dimmed">Kelas {formatGrade(classInfo.grade)}</Text>
              </div>
              <Badge color="blue" variant="light" size="lg">
                {classInfo.total_assignments} Tugas
              </Badge>
            </Group>

            {/* Teacher Info */}
            <Group gap="md">
              <Avatar size="lg" radius="xl" color="green">
                {classInfo.teacher.full_name.charAt(0)}
              </Avatar>
              <div>
                <Text fw={600} size="lg">{classInfo.teacher.full_name}</Text>
                <Text size="sm" c="dimmed">{classInfo.teacher.email}</Text>
                <Text size="xs" c="dimmed">
                  Bergabung: {dayjs(classInfo.enrolled_at).format('DD MMMM YYYY')}
                </Text>
              </div>
            </Group>

            {/* Class Description */}
            {classInfo.description && (
              <Paper p="md" withBorder radius="md" bg="gray.0">
                <Text fw={600} mb="sm">Deskripsi Kelas</Text>
                <Text size="sm">{classInfo.description}</Text>
              </Paper>
            )}

            {/* Statistics */}
            <SimpleGrid cols={{ base: 1, sm: 4 }}>
              <Paper p="md" withBorder radius="md" style={{ textAlign: 'center' }}>
                <ThemeIcon size="xl" variant="light" color="blue" mb="sm">
                  <IconClipboardList size={24} />
                </ThemeIcon>
                <Text size="xl" fw={700}>{classInfo.total_assignments}</Text>
                <Text size="sm" c="dimmed">Total Tugas</Text>
              </Paper>

              <Paper p="md" withBorder radius="md" style={{ textAlign: 'center' }}>
                <ThemeIcon size="xl" variant="light" color="green" mb="sm">
                  <IconCheck size={24} />
                </ThemeIcon>
                <Text size="xl" fw={700}>{classInfo.completed_assignments}</Text>
                <Text size="sm" c="dimmed">Selesai</Text>
              </Paper>

              <Paper p="md" withBorder radius="md" style={{ textAlign: 'center' }}>
                <ThemeIcon size="xl" variant="light" color="orange" mb="sm">
                  <IconClock size={24} />
                </ThemeIcon>
                <Text size="xl" fw={700}>{classInfo.upcoming_assignments}</Text>
                <Text size="sm" c="dimmed">Mendatang</Text>
              </Paper>

              <Paper p="md" withBorder radius="md" style={{ textAlign: 'center' }}>
                <ThemeIcon size="xl" variant="light" color="purple" mb="sm">
                  <IconBell size={24} />
                </ThemeIcon>
                <Text size="xl" fw={700}>{classInfo.recent_announcements}</Text>
                <Text size="sm" c="dimmed">Pengumuman</Text>
              </Paper>
            </SimpleGrid>

            {/* Recent Announcements Alert */}
            {classInfo.recent_announcements > 0 && (
              <Alert icon={<IconBell size={16} />} color="blue" variant="light">
                <Text size="sm">
                  {classInfo.recent_announcements} pengumuman baru dalam 7 hari terakhir
                </Text>
              </Alert>
            )}
          </Stack>
        </Card>

        {/* Tabs for Content */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'overview')}>
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<IconInfoCircle size={16} />}>
              Ringkasan
            </Tabs.Tab>
            <Tabs.Tab value="assignments" leftSection={<IconClipboardList size={16} />}>
              Tugas ({assignments.length})
            </Tabs.Tab>
            <Tabs.Tab value="announcements" leftSection={<IconBell size={16} />}>
              Pengumuman ({announcements.length})
            </Tabs.Tab>
            <Tabs.Tab value="materials" leftSection={<IconFileText size={16} />}>
              Materi ({materials.length})
            </Tabs.Tab>
          </Tabs.List>

          {/* Overview Tab */}
          <Tabs.Panel value="overview" pt="md">
            <Stack gap="md">
              <SimpleGrid cols={{ base: 1, md: 2 }}>
                {/* Recent Assignments */}
                <Card withBorder radius="md" p="md">
                  <Text fw={600} size="lg" mb="md">Tugas Terbaru</Text>
                  <Stack gap="sm">
                    {assignments.slice(0, 3).map((assignment) => {
                      const status = getAssignmentStatus(assignment);
                      return (
                        <Paper key={assignment.id} p="sm" withBorder radius="md">
                          <Group justify="space-between">
                            <div>
                              <Text fw={500} size="sm">{assignment.title}</Text>
                              <Text size="xs" c="dimmed">
                                {dayjs(assignment.deadline).format('DD MMM YYYY')}
                              </Text>
                            </div>
                            <Badge color={status.color} variant="light" size="sm">
                              {status.text}
                            </Badge>
                          </Group>
                        </Paper>
                      );
                    })}
                    {assignments.length === 0 && (
                      <Text size="sm" c="dimmed">Belum ada tugas</Text>
                    )}
                  </Stack>
                </Card>

                {/* Recent Announcements */}
                <Card withBorder radius="md" p="md">
                  <Text fw={600} size="lg" mb="md">Pengumuman Terbaru</Text>
                  <Stack gap="sm">
                    {announcements.slice(0, 3).map((announcement) => (
                      <Paper key={announcement.id} p="sm" withBorder radius="md">
                        <Text fw={500} size="sm" mb="xs">{announcement.title}</Text>
                        <Text size="xs" c="dimmed" lineClamp={2}>
                          {announcement.content}
                        </Text>
                        <Text size="xs" c="dimmed" mt="xs">
                          {dayjs(announcement.created_at).format('DD MMM YYYY')}
                        </Text>
                      </Paper>
                    ))}
                    {announcements.length === 0 && (
                      <Text size="sm" c="dimmed">Belum ada pengumuman</Text>
                    )}
                  </Stack>
                </Card>
              </SimpleGrid>
            </Stack>
          </Tabs.Panel>

          {/* Assignments Tab */}
          <Tabs.Panel value="assignments" pt="md">
            <Stack gap="md">
              {assignments.length === 0 ? (
                <EmptyState
                  icon={IconClipboardList}
                  title="Tidak Ada Tugas"
                  description="Belum ada tugas yang diberikan untuk Anda."
                />
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <Table striped highlightOnHover style={{ minWidth: 800 }}>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Judul Tugas</Table.Th>
                          <Table.Th>Deadline</Table.Th>
                          <Table.Th>Nilai</Table.Th>
                          <Table.Th>Status</Table.Th>
                          <Table.Th>Aksi</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                      {paginatedAssignments.map((assignment) => {
                        const status = getAssignmentStatus(assignment);
                        const isOverdue = new Date(assignment.deadline) < new Date() && !assignment.submission;
                        
                        return (
                          <Table.Tr key={assignment.id}>
                            <Table.Td>
                              <div>
                                <Text fw={500}>{assignment.title}</Text>
                                <Text size="xs" c="dimmed">
                                  {assignment.class.name} • {assignment.assignment_type}
                                </Text>
                              </div>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" c={isOverdue ? 'red' : 'dimmed'}>
                                {dayjs(assignment.deadline).format('DD MMM YYYY')}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              {assignment.submission?.grade ? (
                                <Text fw={500} c="green">
                                  {assignment.submission.grade}/{assignment.total_points}
                                </Text>
                              ) : (
                                <Text size="sm" c="dimmed">-</Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Badge color={status.color} variant="light">
                                {status.text}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <Button
                                  size="xs"
                                  variant="light"
                                  leftSection={<IconEye size={14} />}
                                  onClick={() => {
                                    setSelectedAssignment(assignment);
                                    setSubmissionModal(true);
                                  }}
                                >
                                  Lihat
                                </Button>
                                {!assignment.submission && (
                                  <Button
                                    size="xs"
                                    variant="filled"
                                    leftSection={<IconUpload size={14} />}
                                    onClick={() => {
                                      setSelectedAssignment(assignment);
                                      setSubmissionModal(true);
                                    }}
                                  >
                                    Kumpulkan
                                  </Button>
                                )}
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                      </Table.Tbody>
                    </Table>
                  </div>
                  
                  {/* Pagination for assignments */}
                  <Pagination
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    showItemsPerPage={true}
                    showTotal={true}
                    showPageInput={false}
                    itemsPerPageOptions={[5, 10, 25]}
                  />
                </>
              )}
            </Stack>
          </Tabs.Panel>

          {/* Announcements Tab */}
          <Tabs.Panel value="announcements" pt="md">
            <Stack gap="md">
              {announcements.length === 0 ? (
                <EmptyState
                  icon={IconBell}
                  title="Tidak Ada Pengumuman"
                  description="Belum ada pengumuman untuk kelas ini."
                />
              ) : (
                announcements.map((announcement) => (
                  <Paper key={announcement.id} p="md" withBorder radius="md">
                    <Group justify="space-between" mb="sm">
                      <Text fw={600} size="lg">{announcement.title}</Text>
                      <Text size="sm" c="dimmed">
                        {dayjs(announcement.created_at).format('DD MMM YYYY HH:mm')}
                      </Text>
                    </Group>
                    <Text size="sm" c="dimmed" mb="sm">
                      Oleh: {announcement.teacher.full_name}
                    </Text>
                    <Text size="sm" mb="md">
                      {announcement.content}
                    </Text>
                    {announcement.attachments && announcement.attachments.length > 0 && (
                      <Stack gap="xs">
                        <Text size="sm" fw={500}>Lampiran:</Text>
                        {announcement.attachments.map((attachment) => (
                          <Group key={attachment.id} gap="xs">
                            <IconPaperclip size={16} />
                            <Button
                              variant="subtle"
                              size="xs"
                              component="a"
                              href={attachment.url}
                              target="_blank"
                              leftSection={<IconExternalLink size={14} />}
                            >
                              {attachment.name}
                            </Button>
                          </Group>
                        ))}
                      </Stack>
                    )}
                  </Paper>
                ))
              )}
            </Stack>
          </Tabs.Panel>

          {/* Materials Tab */}
          <Tabs.Panel value="materials" pt="md">
            <Stack gap="md">
              {materials.length === 0 ? (
                <EmptyState
                  icon={IconFileText}
                  title="Tidak Ada Materi"
                  description="Belum ada materi untuk kelas ini."
                />
              ) : (
                materials.map((material) => (
                  <Paper key={material.id} p="md" withBorder radius="md">
                    <Group gap="md">
                      <ThemeIcon
                        size="lg"
                        variant="light"
                        color={
                          material.type === 'video' ? 'red' :
                          material.type === 'document' ? 'blue' :
                          material.type === 'presentation' ? 'purple' :
                          material.type === 'link' ? 'green' :
                          'gray'
                        }
                      >
                        {material.type === 'video' ? <IconVideo size={20} /> :
                         material.type === 'document' ? <IconFile size={20} /> :
                         material.type === 'presentation' ? <IconPresentation size={20} /> :
                         material.type === 'link' ? <IconExternalLink size={20} /> :
                         <IconFile size={20} />}
                      </ThemeIcon>
                      <div style={{ flex: 1 }}>
                        <Text fw={600} size="lg">{material.title}</Text>
                        {material.description && (
                          <Text size="sm" c="dimmed" mb="xs">
                            {material.description}
                          </Text>
                        )}
                        <Group gap="sm">
                          <Badge variant="light" color="gray">
                            {material.type}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            {dayjs(material.created_at).format('DD MMM YYYY')}
                          </Text>
                          <Text size="xs" c="dimmed">
                            Oleh: {material.teacher.full_name}
                          </Text>
                        </Group>
                      </div>
                      <Button
                        size="sm"
                        variant="light"
                        leftSection={<IconDownload size={16} />}
                        component="a"
                        href={material.url}
                        target="_blank"
                      >
                        Download
                      </Button>
                    </Group>
                  </Paper>
                ))
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>

        {/* Assignment Submission Modal */}
        <Modal
          opened={submissionModal}
          onClose={() => {
            setSubmissionModal(false);
            setSelectedAssignment(null);
            setSubmissionFile(null);
            setSubmissionText('');
          }}
          title={selectedAssignment?.title}
          size="lg"
        >
          {selectedAssignment && (
            <Stack gap="md">
              <div>
                <Text fw={600} mb="xs">Deskripsi Tugas:</Text>
                <Text size="sm" c="dimmed">
                  {selectedAssignment.description || 'Tidak ada deskripsi'}
                </Text>
              </div>

              <div>
                <Text fw={600} mb="xs">Deadline:</Text>
                <Text size="sm" c="dimmed">
                  {dayjs(selectedAssignment.deadline).format('DD MMMM YYYY HH:mm')}
                </Text>
              </div>

              {selectedAssignment.drive_link && (
                <div>
                  <Text fw={600} mb="xs">Link Drive:</Text>
                  <Button
                    variant="light"
                    leftSection={<IconExternalLink size={16} />}
                    component="a"
                    href={selectedAssignment.drive_link}
                    target="_blank"
                  >
                    Buka Link Drive
                  </Button>
                </div>
              )}

              <Divider />

              <Textarea
                label="Jawaban Teks (Opsional)"
                placeholder="Tulis jawaban Anda di sini..."
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                minRows={4}
              />

              <FileInput
                label="Upload File (Opsional)"
                placeholder="Pilih file untuk dikumpulkan"
                value={submissionFile}
                onChange={setSubmissionFile}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              />

              <Group justify="flex-end" gap="sm">
                <Button
                  variant="light"
                  onClick={() => {
                    setSubmissionModal(false);
                    setSelectedAssignment(null);
                    setSubmissionFile(null);
                    setSubmissionText('');
                  }}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSubmitAssignment}
                  loading={submitting}
                  disabled={!submissionFile && !submissionText.trim()}
                >
                  Kumpulkan Tugas
                </Button>
              </Group>
            </Stack>
          )}
        </Modal>
      </Stack>
    </Container>
  );
}
