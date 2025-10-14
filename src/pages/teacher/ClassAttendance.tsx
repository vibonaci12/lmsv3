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
  Checkbox,
  DateInput,
  Alert,
  Table,
  Avatar,
  TextInput,
  Tabs,
  Progress,
  Divider,
  Modal,
  Flex,
  Box,
  ThemeIcon,
  ScrollArea,
  Tooltip,
  Switch,
  Radio
} from '@mantine/core';
import { DateInput as MantineDateInput } from '@mantine/dates';
import { 
  IconArrowLeft,
  IconCalendar, 
  IconUsers,
  IconCheck,
  IconX,
  IconClock,
  IconStethoscope,
  IconFileText,
  IconHistory,
  IconTrendingUp,
  IconBolt,
  IconPlus,
  IconMinus,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconDownload,
  IconFilter,
  IconSearch,
  IconEye,
  IconEyeOff
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { Student } from '../../types';
import { classService } from '../../services/classService';
import { attendanceService } from '../../services/attendanceService';
import { LoadingSpinner, EmptyState } from '../../components';
import { notifications } from '@mantine/notifications';
import { formatGrade } from '../../utils/romanNumerals';
import dayjs from 'dayjs';

export function ClassAttendance() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const teacher = user!;
  
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, 'present' | 'absent' | 'sick' | 'permission'>>({});
  const [attendanceNotes, setAttendanceNotes] = useState<Record<string, string>>({});
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAbsent, setShowOnlyAbsent] = useState(false);

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
        attendanceService.getClassAttendanceStats(id),
        attendanceService.getClassAttendanceStats(id)
      ]);

      // Get enrolled students (only active ones for attendance)
      const enrolledStudents = classInfo.class_students
        ?.map((cs: any) => cs.student)
        .filter((student: any) => student && student.is_active) || [];
      
      setClassData(classInfo);
      setStudents(enrolledStudents);
      setAttendanceSummary(attendanceStats);
      
      // Load attendance history and summary
      await loadAttendanceHistory();
    } catch (error) {
      console.error('Error loading data:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal memuat data kelas',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceHistory = async () => {
    if (!id || !selectedDate) return;

    try {
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
      const history = await attendanceService.getAttendanceByClassAndDate(id, dateStr);
      setAttendanceHistory(history);
    } catch (error) {
      console.error('Error loading attendance history:', error);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      loadAttendanceHistory();
    }
  }, [selectedDate, id]);


  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'sick' | 'permission') => {
    const validStatuses = ['present', 'absent', 'sick', 'permission'];
    if (!validStatuses.includes(status)) {
      console.warn('Invalid attendance status:', status);
      return;
    }

    setAttendanceStatuses(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setAttendanceNotes(prev => ({
      ...prev,
      [studentId]: note
    }));
  };



  const handleSubmitAttendance = async () => {
    if (!id || !selectedDate) {
      notifications.show({
        title: 'Error',
        message: 'Pilih tanggal terlebih dahulu',
        color: 'red',
      });
      return;
    }

    // Get all students with status
    const studentsWithStatus = Object.keys(attendanceStatuses);
    
    if (studentsWithStatus.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'Pilih status absensi untuk minimal satu siswa',
        color: 'red',
      });
      return;
    }

    try {
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
      
      // Mark attendance for students with status
      for (const studentId of studentsWithStatus) {
        const status = attendanceStatuses[studentId];
        const notes = attendanceNotes[studentId] || '';
        
        await attendanceService.markAttendance({
          student_id: studentId,
          class_id: id,
          date: dateStr,
          status: status,
          notes: notes,
          marked_by: teacher.id,
        });
      }

      notifications.show({
        title: 'Berhasil',
        message: `Absensi berhasil dicatat untuk ${studentsWithStatus.length} siswa`,
        color: 'green',
      });

      setAttendanceStatuses({});
      setAttendanceNotes({});
      await loadAttendanceHistory();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal mencatat absensi',
        color: 'red',
      });
    }
  };

  const getAttendanceStatus = (studentId: string) => {
    const attendance = attendanceHistory.find(a => a.student_id === studentId);
    return attendance ? attendance.status : null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'green';
      case 'absent': return 'red';
      case 'sick': return 'yellow';
      case 'permission': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <IconCheck size={14} />;
      case 'absent': return <IconX size={14} />;
      case 'sick': return <IconStethoscope size={14} />;
      case 'permission': return <IconFileText size={14} />;
      default: return <IconClock size={14} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'Hadir';
      case 'absent': return 'Tidak Hadir';
      case 'sick': return 'Sakit';
      case 'permission': return 'Izin';
      default: return 'Belum Absen';
    }
  };

  // Filter students based on search and show only absent
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (showOnlyAbsent) {
      const attendanceStatus = getAttendanceStatus(student.id);
      return matchesSearch && attendanceStatus === null;
    }
    
    return matchesSearch;
  });

  // Calculate statistics
  const todayStats = {
    total: students.length,
    present: attendanceHistory.filter(a => a.status === 'present').length,
    absent: attendanceHistory.filter(a => a.status === 'absent').length,
    sick: attendanceHistory.filter(a => a.status === 'sick').length,
    permission: attendanceHistory.filter(a => a.status === 'permission').length,
    notMarked: students.length - attendanceHistory.length
  };

  if (loading) {
    return <LoadingSpinner message="Memuat data absensi..." />;
  }

  if (!classData) {
    return (
      <Container size="xl" py="xl">
        <EmptyState
          icon={IconCalendar}
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
              <Title order={1}>Absensi Kelas</Title>
              <Text c="dimmed">
                {classData.name} - {formatGrade(classData.grade)}
              </Text>
            </div>
          </Group>
          <Group gap="sm">
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={loadData}
            >
              Refresh
            </Button>
            <Button
              variant="light"
              leftSection={<IconDownload size={16} />}
              color="blue"
            >
              Export
            </Button>
          </Group>
        </Group>

        {/* Quick Stats */}
        <SimpleGrid cols={{ base: 2, sm: 6 }}>
          <Paper p="md" withBorder radius="md">
            <Group gap="sm">
              <ThemeIcon size="lg" variant="light" color="blue">
                <IconUsers size={20} />
              </ThemeIcon>
              <div>
                <Text size="lg" fw={700}>{todayStats.total}</Text>
                <Text size="xs" c="dimmed">Total Siswa</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder radius="md">
            <Group gap="sm">
              <ThemeIcon size="lg" variant="light" color="green">
                <IconCheck size={20} />
              </ThemeIcon>
              <div>
                <Text size="lg" fw={700}>{todayStats.present}</Text>
                <Text size="xs" c="dimmed">Hadir</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder radius="md">
            <Group gap="sm">
              <ThemeIcon size="lg" variant="light" color="red">
                <IconX size={20} />
              </ThemeIcon>
              <div>
                <Text size="lg" fw={700}>{todayStats.absent}</Text>
                <Text size="xs" c="dimmed">Tidak Hadir</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder radius="md">
            <Group gap="sm">
              <ThemeIcon size="lg" variant="light" color="yellow">
                <IconStethoscope size={20} />
              </ThemeIcon>
              <div>
                <Text size="lg" fw={700}>{todayStats.sick}</Text>
                <Text size="xs" c="dimmed">Sakit</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder radius="md">
            <Group gap="sm">
              <ThemeIcon size="lg" variant="light" color="blue">
                <IconFileText size={20} />
              </ThemeIcon>
              <div>
                <Text size="lg" fw={700}>{todayStats.permission}</Text>
                <Text size="xs" c="dimmed">Izin</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder radius="md">
            <Group gap="sm">
              <ThemeIcon size="lg" variant="light" color="gray">
                <IconClock size={20} />
              </ThemeIcon>
              <div>
                <Text size="lg" fw={700}>{todayStats.notMarked}</Text>
                <Text size="xs" c="dimmed">Belum Absen</Text>
              </div>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Progress Bar */}
        <Card withBorder radius="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600}>Progress Absensi Hari Ini</Text>
              <Text size="sm" c="dimmed">
                {attendanceHistory.length} dari {students.length} siswa
              </Text>
            </Group>
            <Progress 
              value={(attendanceHistory.length / students.length) * 100} 
              size="lg" 
              radius="md"
              color="green"
            />
            <Text size="sm" c="dimmed" ta="center">
              {Math.round((attendanceHistory.length / students.length) * 100)}% selesai
            </Text>
          </Stack>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'today')}>
          <Tabs.List>
            <Tabs.Tab value="today" leftSection={<IconCalendar size={16} />}>
              Absensi Hari Ini
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
              Riwayat
            </Tabs.Tab>
            <Tabs.Tab value="analytics" leftSection={<IconTrendingUp size={16} />}>
              Analisis
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="today" pt="md">
            <Stack gap="md">
              {/* Date Selection */}
              <Card withBorder radius="md">
                <Group justify="space-between">
                  <div>
                    <Text fw={600}>Tanggal Absensi</Text>
                    <Text size="sm" c="dimmed">Pilih tanggal untuk mencatat absensi</Text>
                  </div>
                  <MantineDateInput
                    value={selectedDate}
                    onChange={setSelectedDate}
                    placeholder="Pilih tanggal"
                    size="md"
                    style={{ minWidth: 200 }}
                  />
                </Group>
              </Card>

              {/* Controls */}
              <Card withBorder radius="md">
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text fw={600}>Kontrol Absensi</Text>
                    <Switch
                      label="Tampilkan yang belum absen"
                      checked={showOnlyAbsent}
                      onChange={(e) => setShowOnlyAbsent(e.currentTarget.checked)}
                      size="sm"
                    />
                  </Group>

                  <TextInput
                    placeholder="Cari siswa..."
                    leftSection={<IconSearch size={16} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: 400 }}
                  />

                  {Object.keys(attendanceStatuses).length > 0 && (
                    <Alert color="blue" icon={<IconBolt size={16} />}>
                      <Group justify="space-between">
                        <Text size="sm">
                          {Object.keys(attendanceStatuses).length} siswa sudah dipilih statusnya
                        </Text>
                        <Button 
                          size="xs" 
                          onClick={handleSubmitAttendance}
                          leftSection={<IconBolt size={14} />}
                        >
                          Catat Absensi
                        </Button>
                      </Group>
                    </Alert>
                  )}
                </Stack>
              </Card>

              {/* Student List */}
              <Card withBorder radius="md">
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text fw={600}>Daftar Siswa ({filteredStudents.length})</Text>
                  </Group>

                  <ScrollArea h={400}>
                    <Stack gap="xs">
                      {filteredStudents.map((student) => {
                        const attendanceStatus = getAttendanceStatus(student.id);
                        const currentStatus = attendanceStatuses[student.id] || '';
                        const currentNote = attendanceNotes[student.id] || '';
                        
                        return (
                          <Paper 
                            key={student.id} 
                            p="md" 
                            withBorder 
                            radius="md"
                          >
                            <Group justify="space-between">
                              <Group gap="md">
                                <Avatar size="md" radius="xl" color="blue">
                                  {student.full_name.charAt(0)}
                                </Avatar>
                                
                                <div>
                                  <Text fw={500}>{student.full_name}</Text>
                                  <Text size="sm" c="dimmed">{student.email}</Text>
                                </div>
                              </Group>

                              <Group gap="md">
                                <Radio.Group
                                  value={currentStatus}
                                  onChange={(value) => handleStatusChange(student.id, value as any)}
                                >
                                  <Group gap="md">
                                    <Radio
                                      value="present"
                                      label="Hadir"
                                      color="green"
                                      size="sm"
                                    />
                                    <Radio
                                      value="absent"
                                      label="Tidak Hadir"
                                      color="red"
                                      size="sm"
                                    />
                                    <Radio
                                      value="sick"
                                      label="Sakit"
                                      color="yellow"
                                      size="sm"
                                    />
                                    <Radio
                                      value="permission"
                                      label="Izin"
                                      color="blue"
                                      size="sm"
                                    />
                                  </Group>
                                </Radio.Group>

                                {attendanceStatus && (
                                  <Badge 
                                    color={getStatusColor(attendanceStatus)}
                                    variant="light" 
                                    size="lg"
                                    leftSection={getStatusIcon(attendanceStatus)}
                                  >
                                    {getStatusLabel(attendanceStatus)}
                                  </Badge>
                                )}
                              </Group>
                            </Group>

                            <Divider my="sm" />
                            <TextInput
                              placeholder="Keterangan (opsional)"
                              value={currentNote}
                              onChange={(e) => handleNoteChange(student.id, e.target.value)}
                              size="sm"
                            />
                          </Paper>
                        );
                      })}
                    </Stack>
                  </ScrollArea>
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="md">
            <Card withBorder radius="md">
              <Stack gap="md">
                <Text fw={600}>Riwayat Absensi</Text>
                <Text size="sm" c="dimmed">
                  Riwayat lengkap absensi kelas ini akan ditampilkan di sini
                </Text>
                {/* History content will be implemented here */}
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="analytics" pt="md">
            <Card withBorder radius="md">
              <Stack gap="md">
                <Text fw={600}>Analisis Absensi</Text>
                <Text size="sm" c="dimmed">
                  Grafik dan analisis absensi akan ditampilkan di sini
                </Text>
                {/* Analytics content will be implemented here */}
              </Stack>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}