import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Title, 
  Text, 
  Stack, 
  Group, 
  Button, 
  Tabs,
  Card,
  Badge,
  Avatar,
  Table,
  ActionIcon,
  Menu,
  Modal,
  TextInput,
  Select,
  Textarea,
  SimpleGrid,
  Paper
} from '@mantine/core';
import { 
  IconArrowLeft,
  IconUsers, 
  IconBook, 
  IconClipboardList,
  IconCalendar,
  IconTrophy,
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconEye,
  IconDownload
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useAuth } from '../../contexts/AuthContext';
import { Class, Student } from '../../types';
import { classService } from '../../services/classService';
import { materialService } from '../../services/materialService';
import { assignmentService } from '../../services/assignmentService';
import { attendanceService } from '../../services/attendanceService';
import { gradeService } from '../../services/gradeService';
import { LoadingSpinner, EmptyState, ConfirmDialog, FileUpload } from '../../components';
import { notifications } from '@mantine/notifications';
import { formatGrade } from '../../utils/romanNumerals';

export function ClassDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const teacher = user!;
  
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [gradebook, setGradebook] = useState<any>(null);
  
  // Modal states
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [unenrollModalOpen, setUnenrollModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const enrollForm = useForm({
    initialValues: {
      student_id: '',
    },
    validate: {
      student_id: (value) => (!value ? 'Siswa harus dipilih' : null),
    },
  });

  const materialForm = useForm({
    initialValues: {
      title: '',
      description: '',
      file: null as File | null,
    },
    validate: {
      title: (value) => (!value ? 'Judul materi harus diisi' : null),
    },
  });

  useEffect(() => {
    if (id) {
      loadClassData();
    }
  }, [id]);

  const loadClassData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [classInfo, classMaterials, classAssignments] = await Promise.all([
        classService.getClassById(id),
        materialService.getMaterialsByClass(id),
        assignmentService.getAllAssignments()
      ]);

      // Get students from class info
      const classStudents = classInfo.class_students || [];

      // Filter assignments for this class
      const classAssignmentsFiltered = classAssignments.filter((assignment: any) => 
        assignment.class_id === id
      );

      // Load attendance statistics
      const attendance = await attendanceService.getClassAttendanceStatistics(id);

      // Load gradebook
      const grades = await gradeService.getGradebookByClass(id);

      setClassData(classInfo);
      setStudents(classStudents.map((cs: any) => cs.student));
      setMaterials(classMaterials);
      setAssignments(classAssignmentsFiltered);
      setAttendanceStats(attendance);
      setGradebook(grades);
    } catch (error) {
      console.error('Error loading class data:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal memuat data kelas',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollStudent = async (values: typeof enrollForm.values) => {
    if (!id) return;

    try {
      setSubmitting(true);
      await classService.enrollStudent(id, values.student_id, teacher.id);

      notifications.show({
        title: 'Berhasil',
        message: 'Siswa berhasil didaftarkan',
        color: 'green',
      });

      setEnrollModalOpen(false);
      enrollForm.reset();
      loadClassData();
    } catch (error) {
      console.error('Error enrolling student:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal mendaftarkan siswa',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnenrollStudent = async () => {
    if (!id || !selectedStudent) return;

    try {
      setSubmitting(true);
      await classService.unenrollStudent(id, selectedStudent.id);

      notifications.show({
        title: 'Berhasil',
        message: 'Siswa berhasil dikeluarkan',
        color: 'green',
      });

      setUnenrollModalOpen(false);
      setSelectedStudent(null);
      loadClassData();
    } catch (error) {
      console.error('Error unenrolling student:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal mengeluarkan siswa',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadMaterial = async (values: typeof materialForm.values) => {
    if (!id || !values.file) return;

    try {
      setUploading(true);
      
      // Upload file
      const fileUrl = await materialService.uploadFile(values.file);
      
      // Create material record
      await materialService.uploadMaterial({
        class_id: id,
        title: values.title,
        description: values.description,
        file_url: fileUrl,
        file_name: values.file.name,
        file_type: values.file.type,
        file_size: values.file.size,
      }, teacher.id);

      notifications.show({
        title: 'Berhasil',
        message: 'Materi berhasil diupload',
        color: 'green',
      });

      setMaterialModalOpen(false);
      materialForm.reset();
      loadClassData();
    } catch (error) {
      console.error('Error uploading material:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal mengupload materi',
        color: 'red',
      });
    } finally {
      setUploading(false);
    }
  };

  const openUnenrollModal = (student: Student) => {
    setSelectedStudent(student);
    setUnenrollModalOpen(true);
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
          description="Kelas yang Anda cari tidak ditemukan atau telah dihapus"
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
              <Group gap="sm">
                <Badge color="blue" variant="light">
                  {formatGrade(classData.grade)}
                </Badge>
                <Badge color={classData.is_active ? 'green' : 'red'} variant="light">
                  {classData.is_active ? 'Aktif' : 'Tidak Aktif'}
                </Badge>
              </Group>
            </div>
          </Group>
          
          {/* Management Buttons */}
          <Group gap="sm">
            <Button
              leftSection={<IconUsers size={16} />}
              variant="light"
              color="blue"
              onClick={() => navigate(`/teacher/classes/${id}/students`)}
            >
              Kelola Siswa
            </Button>
            <Button
              leftSection={<IconCalendar size={16} />}
              variant="light"
              color="green"
              onClick={() => navigate(`/teacher/classes/${id}/attendance`)}
            >
              Absen
            </Button>
          </Group>
        </Group>

        {/* Class Info */}
        <Card withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600}>Informasi Kelas</Text>
              <Button
                leftSection={<IconEdit size={16} />}
                variant="light"
                size="sm"
              >
                Edit Kelas
              </Button>
            </Group>
            
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <div>
                <Text size="sm" c="dimmed">Kode Kelas</Text>
                <Text fw={500}>{classData.class_code}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Jumlah Siswa</Text>
                <Text fw={500}>{students.length} siswa</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Dibuat</Text>
                <Text fw={500}>
                  {new Date(classData.created_at).toLocaleDateString('id-ID')}
                </Text>
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

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<IconEye size={16} />}>
              Overview
            </Tabs.Tab>
            <Tabs.Tab value="students" leftSection={<IconUsers size={16} />}>
              Siswa ({students.length})
            </Tabs.Tab>
            <Tabs.Tab value="materials" leftSection={<IconBook size={16} />}>
              Materi ({materials.length})
            </Tabs.Tab>
            <Tabs.Tab value="assignments" leftSection={<IconClipboardList size={16} />}>
              Tugas ({assignments.length})
            </Tabs.Tab>
            <Tabs.Tab value="attendance" leftSection={<IconCalendar size={16} />}>
              Absensi
            </Tabs.Tab>
            <Tabs.Tab value="grades" leftSection={<IconTrophy size={16} />}>
              Nilai
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              <Card withBorder>
                <Group gap="md">
                  <IconUsers size={32} color="var(--mantine-color-blue-6)" />
                  <div>
                    <Text size="lg" fw={600}>{students.length}</Text>
                    <Text size="sm" c="dimmed">Total Siswa</Text>
                  </div>
                </Group>
              </Card>
              <Card withBorder>
                <Group gap="md">
                  <IconBook size={32} color="var(--mantine-color-green-6)" />
                  <div>
                    <Text size="lg" fw={600}>{materials.length}</Text>
                    <Text size="sm" c="dimmed">Materi</Text>
                  </div>
                </Group>
              </Card>
              <Card withBorder>
                <Group gap="md">
                  <IconClipboardList size={32} color="var(--mantine-color-orange-6)" />
                  <div>
                    <Text size="lg" fw={600}>{assignments.length}</Text>
                    <Text size="sm" c="dimmed">Tugas</Text>
                  </div>
                </Group>
              </Card>
              <Card withBorder>
                <Group gap="md">
                  <IconTrophy size={32} color="var(--mantine-color-purple-6)" />
                  <div>
                    <Text size="lg" fw={600}>
                      {attendanceStats?.classAverage ? attendanceStats.classAverage.toFixed(1) : '0'}%
                    </Text>
                    <Text size="sm" c="dimmed">Rata-rata Absensi</Text>
                  </div>
                </Group>
              </Card>
            </SimpleGrid>
          </Tabs.Panel>

          <Tabs.Panel value="students" pt="md">
            <Card withBorder>
              <Group justify="space-between" mb="md">
                <Text fw={600}>Daftar Siswa</Text>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => setEnrollModalOpen(true)}
                >
                  Daftarkan Siswa
                </Button>
              </Group>

              {students.length > 0 ? (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Siswa</Table.Th>
                      <Table.Th>Email</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Aksi</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {students.map((student) => (
                      <Table.Tr key={student.id}>
                        <Table.Td>
                          <Group gap="sm">
                            <Avatar size="sm" radius="xl" color="blue">
                              {student.full_name.charAt(0)}
                            </Avatar>
                            <div>
                              <Text fw={500} size="sm">{student.full_name}</Text>
                              {student.phone && (
                                <Text size="xs" c="dimmed">{student.phone}</Text>
                              )}
                            </div>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{student.email}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge 
                            color={student.is_active ? 'green' : 'red'} 
                            variant="light"
                            size="sm"
                          >
                            {student.is_active ? 'Aktif' : 'Tidak Aktif'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Menu shadow="md" width={200}>
                            <Menu.Target>
                              <ActionIcon variant="subtle" color="gray">
                                <IconDots size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item
                                leftSection={<IconEye size={14} />}
                                onClick={() => navigate(`/teacher/students/${student.id}`)}
                              >
                                Lihat Detail
                              </Menu.Item>
                              <Menu.Divider />
                              <Menu.Item
                                color="red"
                                leftSection={<IconTrash size={14} />}
                                onClick={() => openUnenrollModal(student)}
                              >
                                Keluarkan dari Kelas
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : (
                <EmptyState
                  icon={IconUsers}
                  title="Belum ada siswa"
                  description="Daftarkan siswa ke kelas ini"
                  actionLabel="Daftarkan Siswa"
                  onAction={() => setEnrollModalOpen(true)}
                />
              )}
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="materials" pt="md">
            <Card withBorder>
              <Group justify="space-between" mb="md">
                <Text fw={600}>Materi Pembelajaran</Text>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => setMaterialModalOpen(true)}
                >
                  Upload Materi
                </Button>
              </Group>

              {materials.length > 0 ? (
                <Stack gap="sm">
                  {materials.map((material) => (
                    <Paper key={material.id} p="md" withBorder>
                      <Group justify="space-between">
                        <div>
                          <Text fw={500}>{material.title}</Text>
                          {material.description && (
                            <Text size="sm" c="dimmed">{material.description}</Text>
                          )}
                          <Text size="xs" c="dimmed">
                            {new Date(material.created_at).toLocaleDateString('id-ID')}
                          </Text>
                        </div>
                        <Group gap="sm">
                          <Button
                            variant="light"
                            size="sm"
                            leftSection={<IconDownload size={16} />}
                            onClick={() => window.open(material.file_url, '_blank')}
                          >
                            Download
                          </Button>
                        </Group>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <EmptyState
                  icon={IconBook}
                  title="Belum ada materi"
                  description="Upload materi pembelajaran untuk kelas ini"
                  actionLabel="Upload Materi"
                  onAction={() => setMaterialModalOpen(true)}
                />
              )}
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="assignments" pt="md">
            <Card withBorder>
              <Group justify="space-between" mb="md">
                <Text fw={600}>Tugas Kelas</Text>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => navigate('/teacher/assignments')}
                >
                  Buat Tugas
                </Button>
              </Group>

              {assignments.length > 0 ? (
                <Stack gap="sm">
                  {assignments.map((assignment) => (
                    <Paper key={assignment.id} p="md" withBorder>
                      <Group justify="space-between">
                        <div>
                          <Text fw={500}>{assignment.title}</Text>
                          {assignment.description && (
                            <Text size="sm" c="dimmed">{assignment.description}</Text>
                          )}
                          <Group gap="sm" mt="xs">
                            <Badge 
                              color={assignment.assignment_type === 'wajib' ? 'blue' : 'green'} 
                              variant="light"
                              size="sm"
                            >
                              {assignment.assignment_type === 'wajib' ? 'Wajib' : 'Tambahan'}
                            </Badge>
                            <Text size="xs" c="dimmed">
                              Deadline: {new Date(assignment.deadline).toLocaleDateString('id-ID')}
                            </Text>
                          </Group>
                        </div>
                        <Button
                          variant="light"
                          size="sm"
                          onClick={() => navigate(`/teacher/assignments/${assignment.id}`)}
                        >
                          Lihat Detail
                        </Button>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <EmptyState
                  icon={IconClipboardList}
                  title="Belum ada tugas"
                  description="Buat tugas untuk kelas ini"
                  actionLabel="Buat Tugas"
                  onAction={() => navigate('/teacher/assignments')}
                />
              )}
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="attendance" pt="md">
            <Card withBorder>
              <Text fw={600} mb="md">Statistik Absensi</Text>
              
              {attendanceStats ? (
                <SimpleGrid cols={{ base: 1, sm: 3 }}>
                  <div>
                    <Text size="sm" c="dimmed">Rata-rata Kehadiran</Text>
                    <Text size="lg" fw={600}>{attendanceStats.classAverage.toFixed(1)}%</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">Total Hari</Text>
                    <Text size="lg" fw={600}>{attendanceStats.totalDays}</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">Total Siswa</Text>
                    <Text size="lg" fw={600}>{attendanceStats.totalStudents}</Text>
                  </div>
                </SimpleGrid>
              ) : (
                <EmptyState
                  icon={IconCalendar}
                  title="Belum ada data absensi"
                  description="Data absensi akan muncul setelah absensi dimulai"
                />
              )}
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="grades" pt="md">
            <Card withBorder>
              <Text fw={600} mb="md">Gradebook</Text>
              
              {gradebook && gradebook.students.length > 0 ? (
                <div>
                  <Text size="sm" c="dimmed" mb="md">
                    {gradebook.students.length} siswa • {gradebook.assignments.length} tugas
                  </Text>
                  {/* Gradebook table would go here */}
                  <EmptyState
                    icon={IconTrophy}
                    title="Gradebook dalam pengembangan"
                    description="Fitur gradebook akan segera tersedia"
                  />
                </div>
              ) : (
                <EmptyState
                  icon={IconTrophy}
                  title="Belum ada data nilai"
                  description="Data nilai akan muncul setelah tugas dinilai"
                />
              )}
            </Card>
          </Tabs.Panel>
        </Tabs>

        {/* Enroll Student Modal */}
        <Modal
          opened={enrollModalOpen}
          onClose={() => setEnrollModalOpen(false)}
          title="Daftarkan Siswa"
          size="md"
        >
          <form onSubmit={enrollForm.onSubmit(handleEnrollStudent)}>
            <Stack gap="md">
              <Select
                label="Pilih Siswa"
                placeholder="Cari dan pilih siswa"
                searchable
                data={[]} // This would be populated with available students
                required
                {...enrollForm.getInputProps('student_id')}
              />
              
              <Group justify="flex-end" gap="sm">
                <Button
                  variant="subtle"
                  onClick={() => setEnrollModalOpen(false)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button type="submit" loading={submitting}>
                  Daftarkan
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* Upload Material Modal */}
        <Modal
          opened={materialModalOpen}
          onClose={() => setMaterialModalOpen(false)}
          title="Upload Materi"
          size="md"
        >
          <form onSubmit={materialForm.onSubmit(handleUploadMaterial)}>
            <Stack gap="md">
              <TextInput
                label="Judul Materi"
                placeholder="Contoh: Bab 1 - Pengenalan"
                required
                {...materialForm.getInputProps('title')}
              />
              
              <Textarea
                label="Deskripsi"
                placeholder="Deskripsi materi (opsional)"
                rows={3}
                {...materialForm.getInputProps('description')}
              />
              
              <FileUpload
                onDrop={async (files) => {
                  if (files.length > 0) {
                    materialForm.setFieldValue('file', files[0]);
                  }
                }}
                onUpload={async (files) => {
                  if (files.length > 0) {
                    materialForm.setFieldValue('file', files[0]);
                  }
                }}
                loading={uploading}
                maxFiles={1}
              />
              
              <Group justify="flex-end" gap="sm">
                <Button
                  variant="subtle"
                  onClick={() => setMaterialModalOpen(false)}
                  disabled={uploading}
                >
                  Batal
                </Button>
                <Button type="submit" loading={uploading}>
                  Upload
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* Unenroll Confirmation Modal */}
        <ConfirmDialog
          opened={unenrollModalOpen}
          onClose={() => setUnenrollModalOpen(false)}
          onConfirm={handleUnenrollStudent}
          title="Keluarkan Siswa"
          message={`Apakah Anda yakin ingin mengeluarkan ${selectedStudent?.full_name} dari kelas ini?`}
          confirmLabel="Keluarkan"
          loading={submitting}
        />
      </Stack>
    </Container>
  );
}
