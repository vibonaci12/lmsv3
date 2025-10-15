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
  Timeline,
  Button,
  Paper,
  SimpleGrid,
  Center,
  Loader
} from '@mantine/core';
import { 
  IconUsers, 
  IconBook, 
  IconClipboardList, 
  IconFileText,
  IconTrendingUp,
  IconCalendar,
  IconBell,
  IconPlus
} from '@tabler/icons-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { Teacher } from '../../types';
import { classService } from '../../services/classService';
import { studentService } from '../../services/studentService';
import { assignmentService } from '../../services/assignmentService';
import { gradeService } from '../../services/gradeService';
import { activityLogService } from '../../services/activityLogService';
import { notificationService } from '../../services/notificationService';
import { LoadingSpinner, EmptyState } from '../../components';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  totalAssignments: number;
  pendingReviews: number;
  recentSubmissions: number;
  averageGrade: number;
}

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  description: string;
  created_at: string;
  teacher: {
    full_name: string;
  };
}

export function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const teacher = user as Teacher;
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalClasses: 0,
    totalStudents: 0,
    totalAssignments: 0,
    pendingReviews: 0,
    recentSubmissions: 0,
    averageGrade: 0,
  });
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [gradeAnalytics, setGradeAnalytics] = useState<any>(null);
  const [submissionTrends, setSubmissionTrends] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load basic stats
      const [classes, students, assignments, activities, notifications] = await Promise.all([
        classService.getAllClasses().catch(() => []),
        studentService.getAllStudents().catch(() => []),
        assignmentService.getAllAssignments().catch(() => []),
        activityLogService.getRecentActivities(10).catch(() => []),
        notificationService.getUnreadNotifications(teacher.id, 'teacher').catch(() => [])
      ]);


      // Calculate stats
      const totalClasses = classes.length;
      const totalStudents = students.length;
      const totalAssignments = assignments.length;
      
      // Calculate pending reviews (submissions that need grading)
      const pendingReviews = assignments.reduce((total, assignment) => {
        return total + (assignment.submissions?.count || 0);
      }, 0);

      // Calculate recent submissions (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentSubmissions = assignments.filter(assignment => 
        new Date(assignment.created_at) >= sevenDaysAgo
      ).length;

      // Load grade analytics
      const analytics = await gradeService.getGradeAnalytics().catch(() => ({ byGrade: [] }));
      
      // Load submission trends (mock data for now)
      const trends = [
        { date: '2024-01-01', submissions: 12 },
        { date: '2024-01-02', submissions: 8 },
        { date: '2024-01-03', submissions: 15 },
        { date: '2024-01-04', submissions: 20 },
        { date: '2024-01-05', submissions: 18 },
        { date: '2024-01-06', submissions: 25 },
        { date: '2024-01-07', submissions: 22 },
      ];

      setStats({
        totalClasses,
        totalStudents,
        totalAssignments,
        pendingReviews,
        recentSubmissions,
        averageGrade: analytics.byGrade.length > 0 ? 
          analytics.byGrade.reduce((sum: number, g: any) => sum + g.average, 0) / analytics.byGrade.length : 0
      });
      
      setRecentActivities(activities);
      setUnreadNotifications(notifications.length);
      setGradeAnalytics(analytics);
      setSubmissionTrends(trends);
      
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
    trend, 
    onClick 
  }: {
    title: string;
    value: number | string;
    icon: any;
    color: string;
    trend?: string;
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
      {trend && (
        <Text size="xs" c="dimmed" mt="xs">
          {trend}
        </Text>
      )}
    </Card>
  );

  if (loading) {
    return <LoadingSpinner message="Memuat dashboard..." />;
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={1}>Dashboard Guru</Title>
            <Text c="dimmed">Selamat datang, {teacher.full_name}</Text>
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
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => navigate('/teacher/classes')}
            >
              Kelas Baru
            </Button>
          </Group>
        </Group>

        {/* Stats Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
          <StatCard
            title="Total Kelas"
            value={stats.totalClasses}
            icon={IconBook}
            color="blue"
            onClick={() => navigate('/teacher/classes')}
          />
          <StatCard
            title="Total Siswa"
            value={stats.totalStudents}
            icon={IconUsers}
            color="green"
            onClick={() => navigate('/teacher/students')}
          />
          <StatCard
            title="Total Tugas"
            value={stats.totalAssignments}
            icon={IconClipboardList}
            color="orange"
            onClick={() => navigate('/teacher/assignments')}
          />
          <StatCard
            title="Menunggu Review"
            value={stats.pendingReviews}
            icon={IconFileText}
            color="red"
            onClick={() => navigate('/teacher/grading')}
          />
        </SimpleGrid>

        {/* Charts and Activity */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              {/* Submission Trends */}
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Text fw={600} mb="md">Tren Pengumpulan Tugas</Text>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={submissionTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="submissions" 
                      stroke="#228be6" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Grade Distribution */}
              {gradeAnalytics && (
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Text fw={600} mb="md">Distribusi Nilai per Kelas</Text>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={gradeAnalytics.byGrade}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="grade" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="average" fill="#51cf66" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md">
              {/* Recent Activities */}
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Aktivitas Terbaru</Text>
                  <Button variant="subtle" size="xs">
                    Lihat Semua
                  </Button>
                </Group>
                
                {recentActivities.length > 0 ? (
                  <Timeline active={-1} bulletSize={24} lineWidth={2}>
                    {recentActivities.slice(0, 5).map((activity) => (
                      <Timeline.Item
                        key={activity.id}
                        bullet={activityLogService.getActivityIcon(activity.action, activity.entity_type)}
                        title={activityLogService.formatActivityDescription(
                          activity.action, 
                          activity.entity_type, 
                          activity.description
                        )}
                      >
                        <Text size="xs" c="dimmed">
                          {activity.teacher.full_name} • {new Date(activity.created_at).toLocaleString('id-ID')}
                        </Text>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                ) : (
                  <EmptyState
                    icon={IconCalendar}
                    title="Belum ada aktivitas"
                    description="Aktivitas terbaru akan muncul di sini"
                  />
                )}
              </Card>

              {/* Quick Actions */}
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Text fw={600} mb="md">Aksi Cepat</Text>
                <Stack gap="sm">
                  <Button
                    variant="light"
                    leftSection={<IconPlus size={16} />}
                    onClick={() => navigate('/teacher/assignments')}
                    fullWidth
                  >
                    Buat Tugas
                  </Button>
                  <Button
                    variant="light"
                    leftSection={<IconUsers size={16} />}
                    onClick={() => navigate('/teacher/students')}
                    fullWidth
                  >
                    Kelola Siswa
                  </Button>
                  <Button
                    variant="light"
                    leftSection={<IconFileText size={16} />}
                    onClick={() => navigate('/teacher/grading')}
                    fullWidth
                  >
                    Penilaian
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
