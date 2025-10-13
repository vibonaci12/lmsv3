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
  Table,
  Badge,
  ActionIcon,
  Modal,
  TextInput,
  Select,
  SimpleGrid,
  Paper,
  Avatar,
  Alert,
  Checkbox
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { 
  IconArrowLeft,
  IconCalendar, 
  IconPlus,
  IconSearch,
  IconCheck,
  IconX,
  IconClock,
  IconUsers,
  IconDownload
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useAuth } from '../../contexts/AuthContext';
import { Student } from '../../types';
import { classService } from '../../services/classService';
import { attendanceService } from '../../services/attendanceService';
import { LoadingSpinner, EmptyState, ConfirmDialog } from '../../components';
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
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const attendanceForm = useForm({
    initialValues: {
      date: new Date(),
      students: [] as string[],
    },
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [classInfo, attendanceData] = await Promise.all([
        classService.getClassById(id),
        attendanceService.getAttendanceByClassAndDate(id, selectedDate)
      ]);

      // Get enrolled students
      const enrolledStudents = classInfo.class_students?.map((cs: any) => cs.student) || [];
      
      setClassData(classInfo);
      setStudents(enrolledStudents);
      setAttendanceRecords(attendanceData);
    } catch (error) {
      console.error('Error loading data:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal memuat data kehadiran',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (values: typeof attendanceForm.values) => {
    try {
      const attendanceData = students.map(student => ({
        student_id: student.id,
        class_id: id!,
        date: dayjs(values.date).format('YYYY-MM-DD'),
        status: values.students.includes(student.id) ? 'present' : 'absent',
        marked_by: teacher.id,
      }));

      await attendanceService.markAttendance(attendanceData);
      notifications.show({
        title: 'Berhasil',
        message: 'Kehadiran berhasil dicatat',
        color: 'green',
      });
      setMarkModalOpen(false);
      attendanceForm.reset();
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal mencatat kehadiran',
        color: 'red',
      });
    }
  };

  const handleViewAttendance = (record: any) => {
    setSelectedRecord(record);
    setViewModalOpen(true);
  };

  const getAttendanceStats = () => {
    const totalStudents = students.length;
    const presentToday = attendanceRecords.filter(r => r.status === 'present').length;
    const absentToday = totalStudents - presentToday;
    const attendanceRate = totalStudents > 0 ? (presentToday / totalStudents) * 100 : 0;

    return { totalStudents, presentToday, absentToday, attendanceRate };
  };

  const stats = getAttendanceStats();

  if (loading) {
    return <LoadingSpinner message="Memuat data kehadiran..." />;
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
              leftSection={<IconDownload size={16} />}
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
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setMarkModalOpen(true)}
              disabled={students.length === 0}
            >
              Catat Kehadiran
            </Button>
          </Group>
        </Group>

        {/* Stats */}
        <SimpleGrid cols={{ base: 1, sm: 4 }}>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconUsers size={32} color="var(--mantine-color-blue-6)" />
              <div>
                <Text size="lg" fw={600}>{stats.totalStudents}</Text>
                <Text size="sm" c="dimmed">Total Siswa</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconCheck size={32} color="var(--mantine-color-green-6)" />
              <div>
                <Text size="lg" fw={600}>{stats.presentToday}</Text>
                <Text size="sm" c="dimmed">Hadir Hari Ini</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconX size={32} color="var(--mantine-color-red-6)" />
              <div>
                <Text size="lg" fw={600}>{stats.absentToday}</Text>
                <Text size="sm" c="dimmed">Tidak Hadir</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconClock size={32} color="var(--mantine-color-orange-6)" />
              <div>
                <Text size="lg" fw={600}>{stats.attendanceRate.toFixed(1)}%</Text>
                <Text size="sm" c="dimmed">Tingkat Kehadiran</Text>
              </div>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Date Selector */}
        <Card withBorder>
          <Group gap="md">
            <Text fw={500}>Tanggal:</Text>
            <DateInput
              value={selectedDate}
              onChange={(date) => {
                if (date) {
                  setSelectedDate(date);
                  loadData();
                }
              }}
              placeholder="Pilih tanggal"
              leftSection={<IconCalendar size={16} />}
            />
            <Text size="sm" c="dimmed">
              {dayjs(selectedDate).format('dddd, DD MMMM YYYY')}
            </Text>
          </Group>
        </Card>

        {/* Attendance Records */}
        <Card withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600}>Catatan Kehadiran</Text>
              <Badge color={stats.attendanceRate >= 80 ? 'green' : stats.attendanceRate >= 60 ? 'yellow' : 'red'}>
                {stats.attendanceRate.toFixed(1)}% Kehadiran
              </Badge>
            </Group>

            {attendanceRecords.length > 0 ? (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Siswa</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Waktu</Table.Th>
                    <Table.Th>Dicetak Oleh</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {attendanceRecords.map((record) => (
                    <Table.Tr key={record.id}>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar size="sm" radius="xl" color="blue">
                            {record.student?.full_name?.charAt(0) || 'S'}
                          </Avatar>
                          <div>
                            <Text fw={500}>{record.student?.full_name || 'Unknown'}</Text>
                            <Text size="sm" c="dimmed">{record.student?.email}</Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge 
                          color={record.status === 'present' ? 'green' : 'red'} 
                          variant="light"
                          leftSection={record.status === 'present' ? <IconCheck size={12} /> : <IconX size={12} />}
                        >
                          {record.status === 'present' ? 'Hadir' : 'Tidak Hadir'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {dayjs(record.created_at).format('HH:mm')}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{record.teacher?.full_name || 'Unknown'}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <EmptyState
                icon={IconCalendar}
                title="Belum ada catatan kehadiran"
                description={`Belum ada catatan kehadiran untuk tanggal ${dayjs(selectedDate).format('DD MMMM YYYY')}`}
                actionLabel="Catat Kehadiran"
                onAction={() => setMarkModalOpen(true)}
              />
            )}
          </Stack>
        </Card>

        {/* Mark Attendance Modal */}
        <Modal
          opened={markModalOpen}
          onClose={() => setMarkModalOpen(false)}
          title="Catat Kehadiran"
          size="lg"
        >
          <form onSubmit={attendanceForm.onSubmit(handleMarkAttendance)}>
            <Stack gap="md">
              <DateInput
                label="Tanggal"
                value={attendanceForm.values.date}
                onChange={(date) => attendanceForm.setFieldValue('date', date || new Date())}
                required
              />

              <div>
                <Text size="sm" fw={500} mb="sm">Status Kehadiran Siswa:</Text>
                <Stack gap="xs">
                  {students.map((student) => (
                    <Group key={student.id} justify="space-between">
                      <Group gap="sm">
                        <Avatar size="sm" radius="xl" color="blue">
                          {student.full_name.charAt(0)}
                        </Avatar>
                        <div>
                          <Text size="sm" fw={500}>{student.full_name}</Text>
                          <Text size="xs" c="dimmed">{student.email}</Text>
                        </div>
                      </Group>
                      <Checkbox
                        checked={attendanceForm.values.students.includes(student.id)}
                        onChange={(event) => {
                          const studentId = student.id;
                          const currentStudents = attendanceForm.values.students;
                          if (event.currentTarget.checked) {
                            attendanceForm.setFieldValue('students', [...currentStudents, studentId]);
                          } else {
                            attendanceForm.setFieldValue('students', currentStudents.filter(id => id !== studentId));
                          }
                        }}
                        label="Hadir"
                      />
                    </Group>
                  ))}
                </Stack>
              </div>

              <Alert color="blue" icon={<IconClock size={16} />}>
                <Text size="sm">
                  Siswa yang tidak dicentang akan dicatat sebagai tidak hadir.
                </Text>
              </Alert>

              <Group justify="flex-end" gap="sm">
                <Button
                  variant="subtle"
                  onClick={() => setMarkModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit">
                  Simpan Kehadiran
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </Stack>
    </Container>
  );
}
