import { useState, useEffect } from 'react';
import { 
  Container, 
  Title, 
  Text, 
  Stack, 
  Grid, 
  Card, 
  Group, 
  Badge, 
  Progress, 
  Button,
  SimpleGrid,
  Timeline,
  Alert
} from '@mantine/core';
import { 
  IconBook, 
  IconClipboardList, 
  IconTrophy,
  IconClock,
  IconBell,
  IconAlertCircle,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { Student } from '../../types';
import { submissionService } from '../../services/submissionService';
import { notificationService } from '../../services/notificationService';
import { LoadingSpinner, EmptyState } from '../../components';
import { useNavigate } from 'react-router-dom';

interface StudentStats {
  totalAssignments: number;
  submittedAssignments: number;
  gradedAssignments: number;
  averageGrade: number;
  totalPoints: number;
  maxPoints: number;
}

interface PendingAssignment {
  id: string;
  title: string;
  deadline: string;
  assignment_type: string;
  class?: { name: string };
  target_grade?: string;
}

export function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const student = user as Student;
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StudentStats>({
    totalAssignments: 0,
    submittedAssignments: 0,
    gradedAssignments: 0,
    averageGrade: 0,
    totalPoints: 0,
    maxPoints: 0,
  });
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
  const [recentGrades, setRecentGrades] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load student submissions and grades
      const [submissions, notifications] = await Promise.all([
        submissionService.getStudentSubmissions(student.id),
        notificationService.getUnreadNotifications(student.id, 'student')
      ]);

      // Calculate stats
      const totalAssignments = submissions.length;
      const submittedAssignments = submissions.filter(s => s.status !== 'pending').length;
      const gradedAssignments = submissions.filter(s => s.status === 'graded').length;
      
      const gradedSubmissions = submissions.filter(s => s.status === 'graded');
      const totalPoints = gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0);
      const maxPoints = gradedSubmissions.reduce((sum, s) => sum + (s.assignment as any).total_points, 0);
      const averageGrade = gradedAssignments > 0 ? totalPoints / gradedAssignments : 0;

      // Get pending assignments (not submitted yet)
      const pending = submissions
        .filter(s => s.status === 'pending')
        .map(s => ({
          id: s.assignment.id,
          title: s.assignment.title,
          deadline: s.assignment.deadline,
          assignment_type: s.assignment.assignment_type,
          class: s.assignment.class,
          target_grade: s.assignment.target_grade,
        }));

      // Get recent grades
      const recent = submissions
        .filter(s => s.status === 'graded')
        .sort((a, b) => new Date(b.graded_at || '').getTime() - new Date(a.graded_at || '').getTime())
        .slice(0, 5);

      // Mock performance data
      const performance = [
        { month: 'Jan', grade: 85 },
        { month: 'Feb', grade: 88 },
        { month: 'Mar', grade: 82 },
        { month: 'Apr', grade: 90 },
        { month: 'May', grade: 87 },
        { month: 'Jun', grade: 92 },
      ];

      setStats({
        totalAssignments,
        submittedAssignments,
        gradedAssignments,
        averageGrade,
        totalPoints,
        maxPoints,
      });
      
      setPendingAssignments(pending);
      setRecentGrades(recent);
      setUnreadNotifications(notifications.length);
      setPerformanceData(performance);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    subtitle,
    onClick 
  }: {
    title: string;
    value: number | string;
    icon: any;
    color: string;
    subtitle?: string;
    onClick?: () => void;
  }) => (
    <Card 
      shadow="sm" 
      padding="lg" 
      radius="md" 
      withBorder 
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed" fw={500}>
          {title}
        </Text>
        <Icon size={24} color={`var(--mantine-color-${color}-6)`} />
      </Group>
      <Text size="xl" fw={700} c={`${color}.6`}>
        {value}
      </Text>
      {subtitle && (
        <Text size="xs" c="dimmed" mt="xs">
          {subtitle}
        </Text>
      )}
    </Card>
  );

  const getDeadlineStatus = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'overdue', color: 'red', text: 'Terlambat' };
    } else if (diffDays === 0) {
      return { status: 'today', color: 'orange', text: 'Hari ini' };
    } else if (diffDays <= 3) {
      return { status: 'soon', color: 'yellow', text: `${diffDays} hari lagi` };
    } else {
      return { status: 'normal', color: 'green', text: `${diffDays} hari lagi` };
    }
  };

  if (loading) {
    return <LoadingSpinner message="Memuat dashboard..." />;
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={1}>Dashboard Siswa</Title>
            <Text c="dimmed">Selamat datang, {student.full_name}</Text>
          </div>
          <Group gap="sm">
            <Button
              leftSection={<IconBell size={16} />}
              variant="light"
              color="blue"
            >
              Notifikasi
              {unreadNotifications > 0 && (
                <Badge size="xs" color="red" ml="xs">
                  {unreadNotifications}
                </Badge>
              )}
            </Button>
          </Group>
        </Group>

        {/* Stats Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
          <StatCard
            title="Total Tugas"
            value={stats.totalAssignments}
            icon={IconClipboardList}
            color="blue"
            onClick={() => navigate('/student/assignments')}
          />
          <StatCard
            title="Tugas Dikumpulkan"
            value={stats.submittedAssignments}
            icon={IconCheck}
            color="green"
            subtitle={`${stats.totalAssignments > 0 ? Math.round((stats.submittedAssignments / stats.totalAssignments) * 100) : 0}% selesai`}
            onClick={() => navigate('/student/assignments')}
          />
          <StatCard
            title="Tugas Dinilai"
            value={stats.gradedAssignments}
            icon={IconTrophy}
            color="orange"
            subtitle={`Rata-rata: ${stats.averageGrade.toFixed(1)}`}
            onClick={() => navigate('/student/grades')}
          />
          <StatCard
            title="Total Poin"
            value={`${stats.totalPoints}/${stats.maxPoints}`}
            icon={IconTrophy}
            color="purple"
            subtitle={`${stats.maxPoints > 0 ? Math.round((stats.totalPoints / stats.maxPoints) * 100) : 0}%`}
            onClick={() => navigate('/student/grades')}
          />
        </SimpleGrid>

        {/* Main Content */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              {/* Performance Chart */}
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Text fw={600} mb="md">Performa Nilai</Text>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="grade" 
                      stroke="#228be6" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Pending Assignments */}
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Tugas yang Belum Dikumpulkan</Text>
                  <Button 
                    variant="subtle" 
                    size="xs"
                    onClick={() => navigate('/student/assignments')}
                  >
                    Lihat Semua
                  </Button>
                </Group>
                
                {pendingAssignments.length > 0 ? (
                  <Stack gap="sm">
                    {pendingAssignments.slice(0, 5).map((assignment) => {
                      const deadlineStatus = getDeadlineStatus(assignment.deadline);
                      
                      return (
                        <Alert
                          key={assignment.id}
                          icon={deadlineStatus.status === 'overdue' ? <IconX size={16} /> : <IconClock size={16} />}
                          color={deadlineStatus.color}
                          title={assignment.title}
                          onClick={() => navigate(`/student/assignments/${assignment.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <Group justify="space-between">
                            <div>
                              <Text size="sm">
                                {assignment.class ? 
                                  `${assignment.class.name} - ${assignment.assignment_type === 'wajib' ? 'Wajib' : 'Tambahan'}` :
                                  `Kelas ${assignment.target_grade} - ${assignment.assignment_type === 'wajib' ? 'Wajib' : 'Tambahan'}`
                                }
                              </Text>
                              <Text size="xs" c="dimmed">
                                Deadline: {new Date(assignment.deadline).toLocaleDateString('id-ID')}
                              </Text>
                            </div>
                            <Badge color={deadlineStatus.color} variant="light">
                              {deadlineStatus.text}
                            </Badge>
                          </Group>
                        </Alert>
                      );
                    })}
                  </Stack>
                ) : (
                  <EmptyState
                    icon={IconCheck}
                    title="Semua tugas sudah dikumpulkan!"
                    description="Tidak ada tugas yang menunggu untuk dikumpulkan"
                  />
                )}
              </Card>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md">
              {/* Recent Grades */}
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Nilai Terbaru</Text>
                  <Button 
                    variant="subtle" 
                    size="xs"
                    onClick={() => navigate('/student/grades')}
                  >
                    Lihat Semua
                  </Button>
                </Group>
                
                {recentGrades.length > 0 ? (
                  <Timeline active={-1} bulletSize={24} lineWidth={2}>
                    {recentGrades.map((submission) => {
                      const percentage = ((submission.grade || 0) / (submission.assignment as any).total_points) * 100;
                      const gradeColor = percentage >= 80 ? 'green' : percentage >= 60 ? 'yellow' : 'red';
                      
                      return (
                        <Timeline.Item
                          key={submission.id}
                          bullet={<IconTrophy size={16} />}
                          title={submission.assignment.title}
                        >
                          <Group justify="space-between">
                            <Text size="sm">
                              {submission.grade}/{submission.assignment.total_points} poin
                            </Text>
                            <Badge color={gradeColor} variant="light" size="sm">
                              {percentage.toFixed(1)}%
                            </Badge>
                          </Group>
                          <Text size="xs" c="dimmed">
                            {new Date(submission.graded_at || '').toLocaleDateString('id-ID')}
                          </Text>
                        </Timeline.Item>
                      );
                    })}
                  </Timeline>
                ) : (
                  <EmptyState
                    icon={IconTrophy}
                    title="Belum ada nilai"
                    description="Nilai akan muncul setelah tugas dinilai"
                  />
                )}
              </Card>

              {/* Quick Actions */}
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Text fw={600} mb="md">Aksi Cepat</Text>
                <Stack gap="sm">
                  <Button
                    variant="light"
                    leftSection={<IconClipboardList size={16} />}
                    onClick={() => navigate('/student/assignments')}
                    fullWidth
                  >
                    Lihat Tugas
                  </Button>
                  <Button
                    variant="light"
                    leftSection={<IconTrophy size={16} />}
                    onClick={() => navigate('/student/grades')}
                    fullWidth
                  >
                    Lihat Nilai
                  </Button>
                  <Button
                    variant="light"
                    leftSection={<IconBook size={16} />}
                    onClick={() => navigate('/student/classes')}
                    fullWidth
                  >
                    Kelas Saya
                  </Button>
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
