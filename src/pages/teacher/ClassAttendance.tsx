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
} from '@mantine/core';
import { DateInput as MantineDateInput } from '@mantine/dates';
import { 
  IconArrowLeft,
  IconCalendar, 
  IconUsers,
  IconCheck,
  IconX,
  IconClock
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
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);

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
      
      // Get enrolled students
      const enrolledStudents = classInfo.class_students?.map((cs: any) => cs.student) || [];
      
      setClassData(classInfo);
      setStudents(enrolledStudents);
      
      // Load attendance history
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

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const handleSubmitAttendance = async () => {
    if (!id || !selectedDate || selectedStudents.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'Pilih tanggal dan minimal satu siswa',
        color: 'red',
      });
      return;
    }

    try {
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
      
      // Mark attendance for selected students
      for (const studentId of selectedStudents) {
        await attendanceService.markAttendance({
          student_id: studentId,
          class_id: id,
          date: dateStr,
          status: 'present',
          marked_by: teacher.id,
        });
      }

      notifications.show({
        title: 'Berhasil',
        message: `Absensi berhasil dicatat untuk ${selectedStudents.length} siswa`,
        color: 'green',
      });

      setSelectedStudents([]);
      loadAttendanceHistory();
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
        </Group>

        {/* Stats */}
        <SimpleGrid cols={{ base: 1, sm: 4 }}>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconUsers size={32} color="var(--mantine-color-blue-6)" />
              <div>
                <Text size="lg" fw={600}>{students.length}</Text>
                <Text size="sm" c="dimmed">Total Siswa</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconCheck size={32} color="var(--mantine-color-green-6)" />
              <div>
                <Text size="lg" fw={600}>{selectedStudents.length}</Text>
                <Text size="sm" c="dimmed">Dipilih</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconCalendar size={32} color="var(--mantine-color-orange-6)" />
              <div>
                <Text size="lg" fw={600}>{attendanceHistory.length}</Text>
                <Text size="sm" c="dimmed">Sudah Absen</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconClock size={32} color="var(--mantine-color-purple-6)" />
              <div>
                <Text size="lg" fw={600}>{students.length - attendanceHistory.length}</Text>
                <Text size="sm" c="dimmed">Belum Absen</Text>
              </div>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Date Selection */}
        <Card withBorder>
          <Stack gap="md">
            <Text fw={600}>Pilih Tanggal Absensi</Text>
            <Group gap="md">
              <MantineDateInput
                label="Tanggal"
                placeholder="Pilih tanggal"
                value={selectedDate}
                onChange={setSelectedDate}
                style={{ flex: 1 }}
              />
            </Group>
          </Stack>
        </Card>

        {/* Student Selection */}
        <Card withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600}>Daftar Siswa ({students.length})</Text>
              <Group gap="sm">
                <Button
                  variant="light"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedStudents.length === students.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </Button>
                <Button
                  onClick={handleSubmitAttendance}
                  disabled={selectedStudents.length === 0}
                >
                  Catat Absensi ({selectedStudents.length})
                </Button>
              </Group>
            </Group>

            {students.length > 0 ? (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th width={50}></Table.Th>
                    <Table.Th>Siswa</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Status Absensi</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {students.map((student) => {
                    const attendanceStatus = getAttendanceStatus(student.id);
                    const isSelected = selectedStudents.includes(student.id);
                    
                    return (
                      <Table.Tr key={student.id}>
                        <Table.Td>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleStudentToggle(student.id)}
                            disabled={attendanceStatus === 'present'}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Group gap="sm">
                            <Avatar size="sm" radius="xl" color="blue">
                              {student.full_name.charAt(0)}
                            </Avatar>
                            <div>
                              <Text fw={500}>{student.full_name}</Text>
                              <Text size="sm" c="dimmed">ID: {student.id.substring(0, 8)}...</Text>
                            </div>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{student.email}</Text>
                        </Table.Td>
                        <Table.Td>
                          {attendanceStatus === 'present' ? (
                            <Badge color="green" variant="light" size="sm" leftSection={<IconCheck size={12} />}>
                              Hadir
                            </Badge>
                          ) : (
                            <Badge color="red" variant="light" size="sm" leftSection={<IconX size={12} />}>
                              Tidak Hadir
                            </Badge>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            ) : (
              <EmptyState
                icon={IconUsers}
                title="Belum ada siswa"
                description="Belum ada siswa yang terdaftar di kelas ini"
                actionLabel="Kelola Siswa"
                onAction={() => navigate(`/teacher/classes/${id}/students`)}
              />
            )}
          </Stack>
        </Card>

        {/* Attendance Summary */}
        {attendanceHistory.length > 0 && (
          <Card withBorder>
            <Stack gap="md">
              <Text fw={600}>Ringkasan Absensi</Text>
              <Alert color="blue" icon={<IconCalendar size={16} />}>
                <Text size="sm">
                  Tanggal: {dayjs(selectedDate).format('DD/MM/YYYY')}
                  <br />
                  Total Hadir: {attendanceHistory.length} dari {students.length} siswa
                  <br />
                  Persentase Kehadiran: {Math.round((attendanceHistory.length / students.length) * 100)}%
                </Text>
              </Alert>
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  );
}