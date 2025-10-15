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
  SimpleGrid,
  Paper,
  Avatar,
  Menu,
  Alert
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { 
  IconArrowLeft,
  IconUsers, 
  IconPlus,
  IconSearch,
  IconDots,
  IconEdit,
  IconTrash,
  IconMail,
  IconCalendar,
  IconUser,
  IconKey,
  IconUpload,
  IconDownload
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useAuth } from '../../contexts/AuthContext';
import { Student } from '../../types';
import { classService } from '../../services/classService';
import { studentService } from '../../services/studentService';
import { studentAuthService } from '../../services/studentAuthService';
import { LoadingSpinner, EmptyState, ConfirmDialog } from '../../components';
import { notifications } from '@mantine/notifications';
import { formatGrade } from '../../utils/romanNumerals';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

export function ClassStudents() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const teacher = user!;
  
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const form = useForm({
    initialValues: {
      full_name: '',
      birth_date: '',
      address: '',
    },
    validate: {
      full_name: (value) => (!value ? 'Nama lengkap harus diisi' : null),
      birth_date: (value) => (!value ? 'Tanggal lahir harus diisi' : null),
    },
  });

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
      
      // Get enrolled students (show all, including inactive for management)
      const enrolledStudents = classInfo.class_students
        ?.map((cs: any) => cs.student)
        .filter((student: any) => student) || [];
      
      setClassData(classInfo);
      setStudents(enrolledStudents);
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

  const generateShortEmail = (fullName: string, birthDate: string) => {
    // Generate short email from name and birth date
    const name = fullName.toLowerCase()
      .replace(/\s+/g, '') // Remove spaces
      .replace(/[^a-z]/g, '') // Remove non-alphabetic characters
      .substring(0, 6); // Limit to 6 characters for shorter email
    
    // Parse DD/MM/YYYY format
    const [day, month, year] = birthDate.split('/');
    const birthYear = year.substring(2); // Get last 2 digits
    return `${name}${birthYear}${month}@s.school`; // Very short domain
  };

  const generatePassword = (birthDate: string) => {
    // Generate password from birth date (DDMMYYYY)
    // Convert DD/MM/YYYY to DDMMYYYY
    return birthDate.replace(/\//g, '');
  };

  const handleExportExcel = () => {
    const exportData = students.map(student => ({
      'Nama Lengkap': student.full_name,
      'Email': student.email,
      'Password': generatePassword(dayjs(student.birth_date).format('DD/MM/YYYY')),
      'Tanggal Lahir': dayjs(student.birth_date).format('DD/MM/YYYY'),
      'Alamat': student.address || '',
      'Status': student.is_active ? 'Aktif' : 'Tidak Aktif'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
    
    const fileName = `Data_Siswa_${classData?.name || 'Kelas'}_${dayjs().format('YYYY-MM-DD')}.xlsx`;
    XLSX.writeFile(wb, fileName);

    notifications.show({
      title: 'Berhasil',
      message: 'Data siswa berhasil diekspor ke Excel',
      color: 'green',
    });
  };

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let successCount = 0;
        let errorCount = 0;

        for (const row of jsonData as any[]) {
          try {
            if (!row['Nama Lengkap'] || !row['Tanggal Lahir']) {
              errorCount++;
              continue;
            }

            const email = generateShortEmail(row['Nama Lengkap'], row['Tanggal Lahir']);
            const password = generatePassword(row['Tanggal Lahir']);
            
            // Convert DD/MM/YYYY to YYYY-MM-DD for database
            const [day, month, year] = row['Tanggal Lahir'].split('/');
            const dbDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            
            const studentData = {
              full_name: row['Nama Lengkap'],
              email: email,
              birth_date: dbDate,
              address: row['Alamat'] || '',
            };

            const newStudent = await studentService.createStudent(studentData, password, teacher.id);
            await classService.enrollStudent(id!, newStudent.id);
            successCount++;
          } catch (error) {
            console.error('Error importing student:', error);
            errorCount++;
          }
        }

        notifications.show({
          title: 'Import Selesai',
          message: `Berhasil mengimpor ${successCount} siswa. ${errorCount} siswa gagal diimpor.`,
          color: successCount > 0 ? 'green' : 'red',
        });

        if (successCount > 0) {
          await loadData();
        }
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Gagal membaca file Excel',
          color: 'red',
        });
      }
    };

    reader.readAsArrayBuffer(file);
    setImportModalOpen(false);
  };

  const handleAddStudent = async (values: typeof form.values) => {
    try {
      const email = generateShortEmail(values.full_name, values.birth_date);
      const password = generatePassword(values.birth_date);
      
      // Create student account
      // Convert DD/MM/YYYY to YYYY-MM-DD for database
      const [day, month, year] = values.birth_date.split('/');
      const dbDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      const studentData = {
        full_name: values.full_name,
        email: email,
        birth_date: dbDate,
        address: values.address,
      };

      const newStudent = await studentService.createStudent(studentData, password, teacher.id);
      
      // Enroll student in class
      await classService.enrollStudent(id!, newStudent.id);
      
      notifications.show({
        title: 'Berhasil',
        message: `Siswa berhasil ditambahkan. Email: ${email}, Password: ${password}`,
        color: 'green',
      });
      
      setAddModalOpen(false);
      form.reset();
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal menambahkan siswa',
        color: 'red',
      });
    }
  };

  const handleEditStudent = async (values: typeof form.values) => {
    if (!selectedStudent) return;

    try {
      const email = generateShortEmail(values.full_name, values.birth_date);
      
      // Convert DD/MM/YYYY to YYYY-MM-DD for database
      const [day, month, year] = values.birth_date.split('/');
      const dbDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      const updateData = {
        full_name: values.full_name,
        email: email,
        birth_date: dbDate,
        address: values.address,
      };

      await studentService.updateStudent(selectedStudent.id, updateData);
      
      notifications.show({
        title: 'Berhasil',
        message: 'Data siswa berhasil diperbarui',
        color: 'green',
      });
      
      setEditModalOpen(false);
      setSelectedStudent(null);
      form.reset();
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal memperbarui data siswa',
        color: 'red',
      });
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    try {
      // Remove from class first
      await classService.unenrollStudent(id!, selectedStudent.id);
      
      // Then delete the student (this will cascade delete all related data)
      await studentService.deleteStudent(selectedStudent.id, teacher.id);
      
      notifications.show({
        title: 'Berhasil',
        message: 'Siswa berhasil dihapus',
        color: 'green',
      });
      
      setDeleteModalOpen(false);
      setSelectedStudent(null);
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal menghapus siswa',
        color: 'red',
      });
    }
  };

  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
    // Convert YYYY-MM-DD to DD/MM/YYYY for display
    const [year, month, day] = student.birth_date.split('-');
    const displayDate = `${day}/${month}/${year}`;
    
    form.setValues({
      full_name: student.full_name,
      birth_date: displayDate,
      address: student.address || '',
    });
    setEditModalOpen(true);
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner message="Memuat data siswa..." />;
  }

  if (!classData) {
    return (
      <Container size="xl" py="xl">
        <EmptyState
          icon={IconUsers}
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
              <Title order={1}>Kelola Siswa</Title>
              <Text c="dimmed">
                {classData.name} - {formatGrade(classData.grade)}
              </Text>
            </div>
          </Group>
          
          <Group gap="sm">
            <Button
              variant="light"
              leftSection={<IconUpload size={16} />}
              onClick={() => setImportModalOpen(true)}
            >
              Import Excel
            </Button>
            <Button
              variant="light"
              leftSection={<IconDownload size={16} />}
              onClick={handleExportExcel}
            >
              Export Excel
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setAddModalOpen(true)}
            >
              Tambah Siswa
            </Button>
          </Group>
        </Group>

        {/* Stats */}
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
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
              <IconCalendar size={32} color="var(--mantine-color-green-6)" />
              <div>
                <Text size="lg" fw={600}>{classData.class_code}</Text>
                <Text size="sm" c="dimmed">Kode Kelas</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconUser size={32} color="var(--mantine-color-orange-6)" />
              <div>
                <Text size="lg" fw={600}>{formatGrade(classData.grade)}</Text>
                <Text size="sm" c="dimmed">Tingkat Kelas</Text>
              </div>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Search */}
        <Card withBorder>
          <Group gap="md">
            <TextInput
              placeholder="Cari siswa..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1 }}
            />
          </Group>
        </Card>

        {/* Students Table */}
        <Card withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600}>Daftar Siswa ({filteredStudents.length})</Text>
            </Group>

            {filteredStudents.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <Table style={{ minWidth: 800 }}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Siswa</Table.Th>
                      <Table.Th>Email</Table.Th>
                      <Table.Th>Tanggal Lahir</Table.Th>
                      <Table.Th>Alamat</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th width={100}></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredStudents.map((student) => (
                      <Table.Tr key={student.id}>
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
                          <Group gap="xs">
                            <IconMail size={14} />
                            <Text size="sm">{student.email}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {dayjs(student.birth_date).format('DD/MM/YYYY')}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {student.address || '-'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color="green" variant="light" size="sm">
                            Aktif
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
                                leftSection={<IconEdit size={14} />}
                                onClick={() => openEditModal(student)}
                              >
                                Edit
                              </Menu.Item>
                              <Menu.Divider />
                              <Menu.Item
                                color="red"
                                leftSection={<IconTrash size={14} />}
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setDeleteModalOpen(true);
                                }}
                              >
                                Hapus
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            ) : (
              <EmptyState
                icon={IconUsers}
                title="Tidak ada siswa"
                description={searchTerm ? 
                  "Tidak ada siswa yang sesuai dengan pencarian" : 
                  "Belum ada siswa yang terdaftar di kelas ini"
                }
                actionLabel="Tambah Siswa"
                onAction={() => setAddModalOpen(true)}
              />
            )}
          </Stack>
        </Card>

        {/* Add Student Modal */}
        <Modal
          opened={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title="Tambah Siswa Baru"
          size="lg"
        >
          <form onSubmit={form.onSubmit(handleAddStudent)}>
            <Stack gap="md">
              <Alert color="blue" icon={<IconKey size={16} />}>
                <Text size="sm">
                  Email dan password akan digenerate otomatis dari nama dan tanggal lahir siswa.
                  <br />
                  <strong>Format Email:</strong> [nama6karakter][tahun][bulan]@s.school
                  <br />
                  <strong>Password:</strong> DDMMYYYY (tanggal lahir)
                </Text>
              </Alert>

              <TextInput
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap siswa"
                required
                {...form.getInputProps('full_name')}
              />

              <DateInput
                label="Tanggal Lahir"
                placeholder="Pilih tanggal lahir"
                required
                valueFormat="DD/MM/YYYY"
                {...form.getInputProps('birth_date')}
              />

              <TextInput
                label="Alamat"
                placeholder="Masukkan alamat (opsional)"
                {...form.getInputProps('address')}
              />

              <Group justify="flex-end" gap="sm">
                <Button
                  variant="subtle"
                  onClick={() => setAddModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit">
                  Tambah Siswa
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* Edit Student Modal */}
        <Modal
          opened={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit Data Siswa"
          size="lg"
        >
          <form onSubmit={form.onSubmit(handleEditStudent)}>
            <Stack gap="md">
              <Alert color="blue" icon={<IconMail size={16} />}>
                <Text size="sm">
                  Email akan diperbarui otomatis berdasarkan nama dan tanggal lahir yang baru.
                </Text>
              </Alert>

              <TextInput
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap siswa"
                required
                {...form.getInputProps('full_name')}
              />

              <DateInput
                label="Tanggal Lahir"
                placeholder="Pilih tanggal lahir"
                required
                valueFormat="DD/MM/YYYY"
                {...form.getInputProps('birth_date')}
              />


              <TextInput
                label="Alamat"
                placeholder="Masukkan alamat (opsional)"
                {...form.getInputProps('address')}
              />

              <Group justify="flex-end" gap="sm">
                <Button
                  variant="subtle"
                  onClick={() => setEditModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit">
                  Simpan Perubahan
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* Import Excel Modal */}
        <Modal
          opened={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          title="Import Data Siswa dari Excel"
          size="md"
        >
          <Stack gap="md">
            <Alert color="blue" icon={<IconKey size={16} />}>
              <Text size="sm">
                <strong>Format Excel yang diperlukan:</strong>
                <br />
                • Kolom A: Nama Lengkap
                <br />
                • Kolom B: Tanggal Lahir (format: DD/MM/YYYY)
                <br />
                • Kolom C: Alamat (opsional)
                <br />
                <br />
                Email dan password akan digenerate otomatis.
              </Text>
            </Alert>

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              style={{ display: 'none' }}
              id="excel-import"
            />
            
            <Button
              leftSection={<IconUpload size={16} />}
              onClick={() => document.getElementById('excel-import')?.click()}
              fullWidth
            >
              Pilih File Excel
            </Button>

            <Group justify="flex-end" gap="sm">
              <Button
                variant="subtle"
                onClick={() => setImportModalOpen(false)}
              >
                Batal
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          opened={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteStudent}
          title="Hapus Siswa"
          message={`Apakah Anda yakin ingin menghapus ${selectedStudent?.full_name}? Tindakan ini akan menghapus semua data siswa termasuk submission dan nilai.`}
          confirmLabel="Hapus"
          cancelLabel="Batal"
          confirmColor="red"
        />
      </Stack>
    </Container>
  );
}
