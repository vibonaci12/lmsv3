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
  Button,
  SimpleGrid,
  Timeline,
  Alert,
  Modal,
  ScrollArea,
  ActionIcon,
  RangeSlider,
  Box
} from '@mantine/core';
import { 
  IconBook, 
  IconClipboardList, 
  IconTrophy,
  IconClock,
  IconBell,
  IconCheck,
  IconX,
  IconNotification,
  IconExternalLink
} from '@tabler/icons-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStudentAuth } from '../../contexts/StudentAuthContext';
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
  const { student, loading: authLoading } = useStudentAuth();
  const navigate = useNavigate();
  
  if (authLoading || !student) {
    return <LoadingSpinner message="Memuat dashboard..." />;
  }

  // Function to calculate performance data from graded submissions
  const calculatePerformanceData = (gradedSubmissions: any[]) => {
    if (gradedSubmissions.length === 0) {
      // Return empty data if no graded submissions
      return [
        { month: 'Jan', grade: 0, fullMonth: 'Januari' },
        { month: 'Feb', grade: 0, fullMonth: 'Februari' },
        { month: 'Mar', grade: 0, fullMonth: 'Maret' },
        { month: 'Apr', grade: 0, fullMonth: 'April' },
        { month: 'May', grade: 0, fullMonth: 'Mei' },
        { month: 'Jun', grade: 0, fullMonth: 'Juni' },
        { month: 'Jul', grade: 0, fullMonth: 'Juli' },
        { month: 'Aug', grade: 0, fullMonth: 'Agustus' },
        { month: 'Sep', grade: 0, fullMonth: 'September' },
        { month: 'Oct', grade: 0, fullMonth: 'Oktober' },
        { month: 'Nov', grade: 0, fullMonth: 'November' },
        { month: 'Dec', grade: 0, fullMonth: 'Desember' },
      ];
    }

    // Group submissions by month
    const monthlyData: { [key: string]: { total: number; count: number } } = {};
    
    gradedSubmissions.forEach(submission => {
      if (submission.graded_at) {
        const date = new Date(submission.graded_at);
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        
        if (!monthlyData[month]) {
          monthlyData[month] = { total: 0, count: 0 };
        }
        
        monthlyData[month].total += submission.grade || 0;
        monthlyData[month].count += 1;
      }
    });

    // Calculate average grade for each month
    const months = [
      { month: 'Jan', fullMonth: 'Januari' },
      { month: 'Feb', fullMonth: 'Februari' },
      { month: 'Mar', fullMonth: 'Maret' },
      { month: 'Apr', fullMonth: 'April' },
      { month: 'May', fullMonth: 'Mei' },
      { month: 'Jun', fullMonth: 'Juni' },
      { month: 'Jul', fullMonth: 'Juli' },
      { month: 'Aug', fullMonth: 'Agustus' },
      { month: 'Sep', fullMonth: 'September' },
      { month: 'Oct', fullMonth: 'Oktober' },
      { month: 'Nov', fullMonth: 'November' },
      { month: 'Dec', fullMonth: 'Desember' },
    ];
    
    return months.map(({ month, fullMonth }) => ({
      month,
      fullMonth,
      grade: monthlyData[month] ? Math.round(monthlyData[month].total / monthlyData[month].count) : 0
    }));
  };
  
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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [allPerformanceData, setAllPerformanceData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 5]); // Default: show last 6 months
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Update performance data when time range changes
  useEffect(() => {
    if (allPerformanceData.length > 0) {
      setPerformanceData(allPerformanceData.slice(timeRange[0], timeRange[1] + 1));
    }
  }, [timeRange, allPerformanceData]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load student submissions and grades
      const [submissions, notificationsData] = await Promise.all([
        submissionService.getStudentSubmissions(student.id).catch(() => []),
        notificationService.getUnreadNotifications(student.id, 'student').catch(() => [])
      ]);

      console.log('Dashboard - Submissions:', submissions);
      console.log('Dashboard - Notifications:', notificationsData);

      // Calculate stats
      const totalAssignments = submissions.length;
      const submittedAssignments = submissions.filter(s => s.status !== 'pending').length;
      const gradedAssignments = submissions.filter(s => s.status === 'graded').length;
      
      const gradedSubmissions = submissions.filter(s => s.status === 'graded');
      const totalPoints = gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0);
      const maxPoints = gradedSubmissions.reduce((sum, s) => sum + (s.assignment?.total_points || 0), 0);
      const averageGrade = gradedAssignments > 0 ? totalPoints / gradedAssignments : 0;

      // Get pending assignments (not submitted yet)
      const pending = submissions
        .filter(s => s.status === 'pending')
        .map(s => ({
          id: s.assignment?.id || s.assignment_id,
          title: s.assignment?.title || 'Unknown Assignment',
          deadline: s.assignment?.deadline || '',
          assignment_type: s.assignment?.assignment_type || 'wajib',
          class: s.assignment?.class || null,
          target_grade: s.assignment?.target_grade || '10',
        }));

      // Get recent grades
      const recent = submissions
        .filter(s => s.status === 'graded')
        .sort((a, b) => new Date(b.graded_at || '').getTime() - new Date(a.graded_at || '').getTime())
        .slice(0, 5);

      // Calculate real performance data from graded submissions
      const performance = calculatePerformanceData(gradedSubmissions);

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
      setNotifications(notificationsData);
      setUnreadNotifications(notificationsData?.length || 0);
      setAllPerformanceData(performance);
      setPerformanceData(performance.slice(timeRange[0], timeRange[1] + 1));
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadNotifications(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(student.id, 'student');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadNotifications(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
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
              onClick={() => setNotificationsModalOpen(true)}
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
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          <StatCard
            title="Total Tugas"
            value={stats.totalAssignments}
            icon={IconClipboardList}
            color="blue"
            onClick={() => navigate('/student/classroom')}
          />
          <StatCard
            title="Tugas Dikumpulkan"
            value={stats.submittedAssignments}
            icon={IconCheck}
            color="green"
            subtitle={`${stats.totalAssignments > 0 ? Math.round((stats.submittedAssignments / stats.totalAssignments) * 100) : 0}% selesai`}
            onClick={() => navigate('/student/classroom')}
          />
          <StatCard
            title="Tugas Dinilai"
            value={stats.gradedAssignments}
            icon={IconTrophy}
            color="orange"
            subtitle={`Rata-rata: ${stats.averageGrade.toFixed(1)}`}
            onClick={() => navigate('/student/leaderboard')}
          />
          <StatCard
            title="Total Poin"
            value={`${stats.totalPoints}/${stats.maxPoints}`}
            icon={IconTrophy}
            color="purple"
            subtitle={`${stats.maxPoints > 0 ? Math.round((stats.totalPoints / stats.maxPoints) * 100) : 0}%`}
            onClick={() => navigate('/student/leaderboard')}
          />
        </SimpleGrid>

        {/* Main Content */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              {/* Performance Chart */}
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Performa Nilai</Text>
                  <Text size="sm" c="dimmed">
                    {allPerformanceData.length > 0 && (
                      <>
                        {allPerformanceData[timeRange[0]]?.fullMonth} - {allPerformanceData[timeRange[1]]?.fullMonth}
                      </>
                    )}
                  </Text>
                </Group>
                
                {/* Time Range Slider */}
                {allPerformanceData.length > 0 && (
                  <Box mb="md">
                    <Text size="sm" mb="xs">Rentang Waktu:</Text>
                    <RangeSlider
                      value={timeRange}
                      onChange={setTimeRange}
                      min={0}
                      max={allPerformanceData.length - 1}
                      step={1}
                      marks={allPerformanceData.map((item, index) => ({
                        value: index,
                        label: item.month
                      }))}
                      minRange={1}
                      maxRange={6}
                      color="blue"
                    />
                  </Box>
                )}
                
                <div style={{ overflowX: 'auto', minWidth: '100%' }}>
                  <ResponsiveContainer width="100%" height={300} minWidth={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value: any) => [
                          `${value}%`, 
                          'Nilai Rata-rata'
                        ]}
                        labelFormatter={(label: string) => `Bulan: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="grade" 
                        stroke="#228be6" 
                        strokeWidth={2}
                        dot={{ fill: '#228be6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#228be6', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Pending Assignments */}
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Tugas yang Belum Dikumpulkan</Text>
                  <Button 
                    variant="subtle" 
                    size="xs"
                    onClick={() => navigate('/student/classroom')}
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
                          title={assignment.title.replace(/ - [a-f0-9-]+$/, '')}
                          onClick={() => navigate('/student/classroom')}
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
                    onClick={() => navigate('/student/leaderboard')}
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
                          title={submission.assignment.title.replace(/ - [a-f0-9-]+$/, '')}
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
                    onClick={() => navigate('/student/classroom')}
                    fullWidth
                  >
                    Lihat Tugas
                  </Button>
                  <Button
                    variant="light"
                    leftSection={<IconTrophy size={16} />}
                    onClick={() => navigate('/student/leaderboard')}
                    fullWidth
                  >
                    Lihat Nilai
                  </Button>
                  <Button
                    variant="light"
                    leftSection={<IconBook size={16} />}
                    onClick={() => navigate('/student/classroom')}
                    fullWidth
                  >
                    Kelas Saya
                  </Button>
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>

        {/* Notifications Modal */}
        <Modal
          opened={notificationsModalOpen}
          onClose={() => setNotificationsModalOpen(false)}
          title="Notifikasi"
          size="lg"
        >
          <Stack gap="md">
            {notifications.length > 0 ? (
              <>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    {notifications.length} notifikasi
                  </Text>
                  {unreadNotifications > 0 && (
                    <Button
                      size="xs"
                      variant="light"
                      onClick={handleMarkAllAsRead}
                    >
                      Tandai Semua Dibaca
                    </Button>
                  )}
                </Group>
                
                <ScrollArea style={{ height: 400 }}>
                  <Stack gap="sm">
                    {notifications.map((notification) => (
                      <Card
                        key={notification.id}
                        padding="md"
                        withBorder
                        style={{
                          backgroundColor: notification.is_read ? 'white' : '#f8f9fa',
                          borderLeft: notification.is_read ? '3px solid #e9ecef' : '3px solid #228be6'
                        }}
                      >
                        <Group justify="space-between" align="flex-start">
                          <Stack gap="xs" style={{ flex: 1 }}>
                            <Text fw={notification.is_read ? 400 : 600} size="sm">
                              {notification.title}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {notification.message}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {new Date(notification.created_at).toLocaleString('id-ID')}
                            </Text>
                          </Stack>
                          
                          <Group gap="xs">
                            {!notification.is_read && (
                              <ActionIcon
                                size="sm"
                                variant="light"
                                color="blue"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <IconCheck size={12} />
                              </ActionIcon>
                            )}
                            {notification.link && (
                              <ActionIcon
                                size="sm"
                                variant="light"
                                color="gray"
                                onClick={() => {
                                  navigate(notification.link);
                                  setNotificationsModalOpen(false);
                                }}
                              >
                                <IconExternalLink size={12} />
                              </ActionIcon>
                            )}
                          </Group>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </ScrollArea>
              </>
            ) : (
              <EmptyState
                icon={IconNotification}
                title="Tidak Ada Notifikasi"
                description="Belum ada notifikasi untuk Anda"
              />
            )}
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
}
