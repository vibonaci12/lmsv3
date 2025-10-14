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
  Paper
} from '@mantine/core';
import { 
  IconArrowLeft,
  IconBook, 
  IconCalendar,
  IconUsers,
  IconClipboardList,
  IconCheck,
  IconClock
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { classService } from '../../services/classService';
import { assignmentService } from '../../services/assignmentService';
import { attendanceService } from '../../services/attendanceService';
import { LoadingSpinner, EmptyState } from '../../components';
import { formatGrade } from '../../utils/romanNumerals';
import { useButtonHandler } from '../../utils/debounce';

export function ClassDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const teacher = user!;
  
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<any>(null);
  const [stats, setStats] = useState({
    students: 0,
    assignments: 0,
    attendance: 0,
    submissions: 0
  });
  const { loading: buttonLoading, handleClick } = useButtonHandler();

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      // Load class data and statistics in parallel
      const [classInfo, assignmentStats, attendanceStats] = await Promise.all([
        classService.getClassById(id),
        assignmentService.getClassAssignmentStats(id),
        attendanceService.getClassAttendanceStats(id)
      ]);

      setClassData(classInfo);
      
      // Calculate combined statistics
      const studentCount = classInfo.class_students?.length || 0;
      setStats({
        students: studentCount,
        assignments: assignmentStats.totalAssignments,
        attendance: attendanceStats.totalSessions,
        submissions: assignmentStats.totalSubmissions
      });
    } catch (error) {
      console.error('Error loading class:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced navigation to prevent multiple rapid clicks
  const handleNavigation = (path: string, buttonType: string) => {
    handleClick(() => navigate(path), buttonType, 100);
  };

  if (loading) {
    return <LoadingSpinner message="Memuat data kelas..." />;
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
              onClick={() => navigate('/teacher/classes')}
            >
              <IconArrowLeft size={16} />
            </ActionIcon>
            <div>
              <Title order={1}>{classData.name}</Title>
              <Text c="dimmed">
                {formatGrade(classData.grade)} • {classData.class_code}
              </Text>
            </div>
          </Group>
        </Group>

        {/* Class Info */}
        <Card withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600}>Informasi Kelas</Text>
            </Group>
            
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <div>
                <Text size="sm" c="dimmed">Nama Kelas</Text>
                <Text fw={500}>{classData.name}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Tingkat</Text>
                <Text fw={500}>{formatGrade(classData.grade)}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Kode Kelas</Text>
                <Text fw={500}>{classData.class_code}</Text>
              </div>
            </SimpleGrid>

            {classData.description && (
              <div>
                <Text size="sm" c="dimmed">Deskripsi</Text>
                <Text>{classData.description}</Text>
              </div>
            )}
          </Stack>
        </Card>

        {/* Quick Stats with Management Buttons */}
        <SimpleGrid cols={{ base: 1, sm: 4 }}>
          <Paper p="md" withBorder style={{ cursor: 'pointer' }} onClick={() => handleNavigation(`/teacher/classes/${id}/students`, 'students')}>
            <Stack gap="md">
              <Group gap="md">
                <IconUsers size={32} color="var(--mantine-color-blue-6)" />
                <div>
                  <Text size="lg" fw={600}>{stats.students}</Text>
                  <Text size="sm" c="dimmed">Total Siswa</Text>
                </div>
              </Group>
              <Button
                leftSection={<IconUsers size={16} />}
                variant="light"
                color="purple"
                size="sm"
                loading={buttonLoading === 'students'}
                disabled={buttonLoading !== null}
                fullWidth
              >
                Kelola Siswa
              </Button>
            </Stack>
          </Paper>
          
          <Paper p="md" withBorder style={{ cursor: 'pointer' }} onClick={() => handleNavigation(`/teacher/classes/${id}/assignments`, 'assignments')}>
            <Stack gap="md">
              <Group gap="md">
                <IconBook size={32} color="var(--mantine-color-green-6)" />
                <div>
                  <Text size="lg" fw={600}>{stats.assignments}</Text>
                  <Text size="sm" c="dimmed">Total Tugas</Text>
                </div>
              </Group>
              <Button
                leftSection={<IconBook size={16} />}
                variant="light"
                color="blue"
                size="sm"
                loading={buttonLoading === 'assignments'}
                disabled={buttonLoading !== null}
                fullWidth
              >
                Kelola Tugas
              </Button>
            </Stack>
          </Paper>
          
          <Paper p="md" withBorder style={{ cursor: 'pointer' }} onClick={() => handleNavigation(`/teacher/classes/${id}/attendance`, 'attendance')}>
            <Stack gap="md">
              <Group gap="md">
                <IconCalendar size={32} color="var(--mantine-color-orange-6)" />
                <div>
                  <Text size="lg" fw={600}>{stats.attendance}</Text>
                  <Text size="sm" c="dimmed">Sesi Absensi</Text>
                </div>
              </Group>
              <Button
                leftSection={<IconCalendar size={16} />}
                variant="light"
                color="green"
                size="sm"
                loading={buttonLoading === 'attendance'}
                disabled={buttonLoading !== null}
                fullWidth
              >
                Kelola Absensi
              </Button>
            </Stack>
          </Paper>
          
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Group gap="md">
                <IconClipboardList size={32} color="var(--mantine-color-purple-6)" />
                <div>
                  <Text size="lg" fw={600}>{stats.submissions}</Text>
                  <Text size="sm" c="dimmed">Total Submit</Text>
                </div>
              </Group>
              <Text size="xs" c="dimmed" ta="center">
                Statistik Submission
              </Text>
            </Stack>
          </Paper>
        </SimpleGrid>
      </Stack>
    </Container>
  );
}