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
  Avatar,
  Alert,
  Checkbox
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { 
  IconArrowLeft,
  IconUsers, 
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconUpload,
  IconDownload,
  IconInfoCircle
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useAuth } from '../../contexts/AuthContext';
import { Student } from '../../types';
import { classService } from '../../services/classService';
import { studentService } from '../../services/studentService';
import { LoadingSpinner, EmptyState, ConfirmDialog, ExcelImport, Pagination, usePagination } from '../../components';
import { notifications } from '@mantine/notifications';
import { formatGrade } from '../../utils/romanNumerals';
import { supabase } from '../../lib/supabase';
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
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  
  // Pagination
  const {
    currentPage,
    itemsPerPage,
    totalItems,
    paginatedData,
    handlePageChange,
    handleItemsPerPageChange,
    resetPagination
  } = usePagination(searchResults.length > 0 ? searchResults : students, 10, 1);

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

  useEffect(() => {
    // Filter students based on search term
    if (searchTerm.trim() === '') {
      setSearchResults([]);
    } else {
      const filtered = students.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(filtered);
    }
    resetPagination();
  }, [searchTerm, students]);

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
    const birthDay = day.padStart(2, '0'); // Add leading zero if needed
    return `${name}${birthYear}${month}${birthDay}@s.school`; // Include day for uniqueness
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

  const handleDownloadTemplate = () => {
    // Template data dengan contoh
    const templateData = [
      {
        'Nama Lengkap': 'Ahmad Rizki',
        'Tanggal Lahir': '15/03/2005',
        'Alamat': 'Jl. Merdeka No. 123, Jakarta'
      },
      {
        'Nama Lengkap': 'Siti Nurhaliza',
        'Tanggal Lahir': '22/07/2005',
        'Alamat': 'Jl. Sudirman No. 456, Bandung'
      },
      {
        'Nama Lengkap': 'Budi Santoso',
        'Tanggal Lahir': '08/12/2005',
        'Alamat': 'Jl. Thamrin No. 789, Surabaya'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Import Siswa');

    XLSX.writeFile(wb, 'template-import-siswa.xlsx');

    notifications.show({
      title: 'Berhasil',
      message: 'Template import berhasil diunduh',
      color: 'green',
    });
  };

  const handleImportExcel = async (importData: any[]) => {
    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    for (let i = 0; i < importData.length; i++) {
      const row = importData[i];
      
      try {
        // Validate required fields
        if (!row['Nama Lengkap'] || !row['Tanggal Lahir']) {
          errors.push({
            row: i + 1,
            field: 'Nama Lengkap',
            message: 'Missing required fields (Nama Lengkap or Tanggal Lahir)'
          });
          errorCount++;
          continue;
        }

        // Validate date format
        if (!row['Tanggal Lahir'].includes('/')) {
          errors.push({
            row: i + 1,
            field: 'Tanggal Lahir',
            message: 'Invalid date format. Expected DD/MM/YYYY'
          });
          errorCount++;
          continue;
        }

        // Generate unique email
        let email = generateShortEmail(row['Nama Lengkap'], row['Tanggal Lahir']);
        let emailCounter = 1;
        let emailGenerated = false;
        
        // Check if email exists and generate unique one
        while (emailCounter <= 100) {
          const { data: existingStudent, error: checkError } = await supabase
            .from('students')
            .select('id')
            .eq('email', email)
            .maybeSingle();

          if (checkError) {
            console.error(`Error checking existing student:`, checkError);
            break;
          }

          if (!existingStudent) {
            emailGenerated = true;
            break; // Email is unique
          }

          // Generate new email with counter
          const baseEmail = generateShortEmail(row['Nama Lengkap'], row['Tanggal Lahir']);
          email = baseEmail.replace('@s.school', `${emailCounter}@s.school`);
          emailCounter++;
        }
        
        if (!emailGenerated) {
          errors.push({
            row: i + 1,
            field: 'email',
            message: 'Could not generate unique email after 100 attempts'
          });
          errorCount++;
          continue;
        }

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
        
        // Enroll student in class
        await classService.enrollStudent(id!, newStudent.id, teacher.id);
        
        successCount++;
        console.log(`Successfully created student:`, newStudent.full_name);

      } catch (error: any) {
        console.error(`Error processing row ${i + 1}:`, error);
        errors.push({
          row: i + 1,
          field: 'general',
          message: error.message
        });
        errorCount++;
      }
    }

    console.log(`Import completed: ${successCount} success, ${errorCount} errors`);
    console.log('Errors:', errors);

    if (successCount > 0) {
      // Reload data
      await loadData();
    }

    return { success: successCount, errors };
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
      await classService.enrollStudent(id!, newStudent.id, teacher.id);
      
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
      const [day, month, year] = values.birth_date.split('/');
      const dbDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      const studentData = {
        full_name: values.full_name,
        birth_date: dbDate,
        address: values.address,
      };

      await studentService.updateStudent(selectedStudent.id, studentData);
      
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
      await studentService.deleteStudent(selectedStudent.id);
      
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

  const handleBulkDelete = async () => {
    try {
      for (const studentId of selectedStudents) {
        await studentService.deleteStudent(studentId);
      }
      
      notifications.show({
        title: 'Berhasil',
        message: `${selectedStudents.length} siswa berhasil dihapus`,
        color: 'green',
      });
      
      setBulkDeleteModalOpen(false);
      setSelectedStudents([]);
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal menghapus siswa',
        color: 'red',
      });
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(paginatedData.map(student => student.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
    form.setValues({
      full_name: student.full_name,
      birth_date: dayjs(student.birth_date).format('DD/MM/YYYY'),
      address: student.address || '',
    });
    setEditModalOpen(true);
  };

  const openDeleteModal = (student: Student) => {
    setSelectedStudent(student);
    setDeleteModalOpen(true);
  };

  if (loading) {
    return <LoadingSpinner message="Memuat data siswa..." />;
  }

  if (!classData) {
    return (
      <Container size="xl" py="xl">
        <EmptyState
          icon={IconUsers}
          title="Kelas Tidak Ditemukan"
          description="Kelas yang Anda cari tidak ditemukan atau tidak memiliki akses."
        />
      </Container>
    );
  }

  const currentStudents = paginatedData;

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Button
              variant="light"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate('/teacher/classes')}
              mb="md"
            >
              Kembali ke Daftar Kelas
            </Button>
            <Title order={1}>{classData.name}</Title>
            <Text c="dimmed">Kelas {formatGrade(classData.grade)} • {students.length} Siswa</Text>
          </div>
        </Group>

        {/* Actions */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" align="center">
            <Group gap="md">
              <TextInput
                placeholder="Cari siswa..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ minWidth: 300 }}
              />
              {selectedStudents.length > 0 && (
                <Group gap="sm">
                  <Text size="sm" c="dimmed">
                    {selectedStudents.length} dipilih
                  </Text>
                  <Button
                    variant="light"
                    color="red"
                    size="sm"
                    onClick={() => setBulkDeleteModalOpen(true)}
                  >
                    Hapus Terpilih
                  </Button>
                </Group>
              )}
            </Group>
            
            <Group gap="sm">
              <Button
                variant="light"
                leftSection={<IconDownload size={16} />}
                onClick={handleDownloadTemplate}
              >
                Template
              </Button>
              <Button
                variant="light"
                leftSection={<IconDownload size={16} />}
                onClick={handleExportExcel}
              >
                Export Excel
              </Button>
              <Button
                variant="light"
                leftSection={<IconUpload size={16} />}
                onClick={() => setImportModalOpen(true)}
              >
                Import Excel
              </Button>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setAddModalOpen(true)}
              >
                Tambah Siswa
              </Button>
            </Group>
          </Group>
        </Card>

        {/* Students Table */}
        {currentStudents.length === 0 ? (
          <EmptyState
            icon={IconUsers}
            title="Tidak Ada Siswa"
            description={searchTerm ? "Tidak ada siswa yang sesuai dengan pencarian." : "Belum ada siswa yang terdaftar di kelas ini."}
          />
        ) : (
          <Card withBorder radius="md">
            <div style={{ overflowX: 'auto' }}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>
                      <Checkbox
                        checked={selectedStudents.length === currentStudents.length && currentStudents.length > 0}
                        indeterminate={selectedStudents.length > 0 && selectedStudents.length < currentStudents.length}
                        onChange={(event) => handleSelectAll(event.currentTarget.checked)}
                      />
                    </Table.Th>
                    <Table.Th>Siswa</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Tanggal Lahir</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Bergabung</Table.Th>
                    <Table.Th>Aksi</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {currentStudents.map((student) => (
                    <Table.Tr key={student.id}>
                      <Table.Td>
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onChange={(event) => handleSelectStudent(student.id, event.currentTarget.checked)}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar size="sm" radius="xl" color="blue">
                            {student.full_name.charAt(0)}
                          </Avatar>
                          <div>
                            <Text fw={500} size="sm">{student.full_name}</Text>
                            <Text size="xs" c="dimmed">{student.address || 'Tidak ada alamat'}</Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{student.email}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{dayjs(student.birth_date).format('DD MMM YYYY')}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={student.is_active ? 'green' : 'red'} variant="light">
                          {student.is_active ? 'Aktif' : 'Tidak Aktif'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {dayjs(student.created_at).format('DD MMM YYYY')}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => openEditModal(student)}
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => openDeleteModal(student)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
            
            {/* Pagination */}
            <Pagination
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              showItemsPerPage={true}
              showTotal={true}
              showPageInput={false}
              itemsPerPageOptions={[5, 10, 25, 50]}
            />
          </Card>
        )}

        {/* Add Student Modal */}
        <Modal
          opened={addModalOpen}
          onClose={() => {
            setAddModalOpen(false);
            form.reset();
          }}
          title="Tambah Siswa Baru"
          size="md"
        >
          <form onSubmit={form.onSubmit(handleAddStudent)}>
            <Stack gap="md">
              <TextInput
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap"
                {...form.getInputProps('full_name')}
                required
              />
              
              <DateInput
                label="Tanggal Lahir"
                placeholder="Pilih tanggal lahir"
                valueFormat="DD/MM/YYYY"
                {...form.getInputProps('birth_date')}
                required
              />
              
              <TextInput
                label="Alamat"
                placeholder="Masukkan alamat (opsional)"
                {...form.getInputProps('address')}
              />

              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                <Text size="sm">
                  Email dan password akan dibuat otomatis berdasarkan nama dan tanggal lahir.
                </Text>
              </Alert>

              <Group justify="flex-end" gap="sm">
                <Button
                  variant="light"
                  onClick={() => {
                    setAddModalOpen(false);
                    form.reset();
                  }}
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
          onClose={() => {
            setEditModalOpen(false);
            setSelectedStudent(null);
            form.reset();
          }}
          title="Edit Data Siswa"
          size="md"
        >
          <form onSubmit={form.onSubmit(handleEditStudent)}>
            <Stack gap="md">
              <TextInput
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap"
                {...form.getInputProps('full_name')}
                required
              />
              
              <DateInput
                label="Tanggal Lahir"
                placeholder="Pilih tanggal lahir"
                valueFormat="DD/MM/YYYY"
                {...form.getInputProps('birth_date')}
                required
              />
              
              <TextInput
                label="Alamat"
                placeholder="Masukkan alamat (opsional)"
                {...form.getInputProps('address')}
              />

              <Group justify="flex-end" gap="sm">
                <Button
                  variant="light"
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedStudent(null);
                    form.reset();
                  }}
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

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          opened={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedStudent(null);
          }}
          onConfirm={handleDeleteStudent}
          title="Hapus Siswa"
          message={`Apakah Anda yakin ingin menghapus siswa "${selectedStudent?.full_name}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Hapus"
          cancelLabel="Batal"
          confirmColor="red"
        />

        {/* Bulk Delete Confirmation Modal */}
        <ConfirmDialog
          opened={bulkDeleteModalOpen}
          onClose={() => {
            setBulkDeleteModalOpen(false);
            setSelectedStudents([]);
          }}
          onConfirm={handleBulkDelete}
          title="Hapus Siswa Terpilih"
          message={`Apakah Anda yakin ingin menghapus ${selectedStudents.length} siswa yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Hapus Semua"
          cancelLabel="Batal"
          confirmColor="red"
        />

        {/* Excel Import Modal */}
        <ExcelImport
          opened={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImport={handleImportExcel}
          title="Import Siswa dari Excel"
          requiredColumns={['Nama Lengkap', 'Tanggal Lahir']}
          columnMappings={{
            'Nama Lengkap': 'nama_lengkap',
            'Tanggal Lahir': 'tanggal_lahir',
            'Alamat': 'alamat'
          }}
          previewColumns={['Nama Lengkap', 'Tanggal Lahir', 'Alamat']}
          maxRows={100}
        />
      </Stack>
    </Container>
  );
}
