import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Card,
  TextInput,
  PasswordInput,
  Alert,
  Paper,
  Avatar,
} from '@mantine/core';
import { 
  IconUser,
  IconMail,
  IconCalendar,
  IconKey,
  IconCheck,
  IconAlertCircle
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useStudentAuth } from '../../contexts/StudentAuthContext';
import { studentAuthService } from '../../services/studentAuthService';
import { LoadingSpinner } from '../../components';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';

export function StudentProfile() {
  const { student } = useStudentAuth();
  
  if (!student) {
    return <LoadingSpinner message="Memuat profil..." />;
  }
  
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const form = useForm({
    initialValues: {
      full_name: student.full_name,
      email: student.email,
      birth_date: dayjs(student.birth_date).format('DD/MM/YYYY'),
      address: student.address || '',
    },
    validate: {
      full_name: (value) => (!value ? 'Nama lengkap harus diisi' : null),
      email: (value) => (!value ? 'Email harus diisi' : null),
      birth_date: (value) => (!value ? 'Tanggal lahir harus diisi' : null),
    },
  });

  const passwordForm = useForm({
    initialValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
    validate: {
      current_password: (value) => (!value ? 'Password lama harus diisi' : null),
      new_password: (value) => {
        if (!value) return 'Password baru harus diisi';
        if (value.length < 6) return 'Password minimal 6 karakter';
        if (value.length > 50) return 'Password maksimal 50 karakter';
        return null;
      },
      confirm_password: (value, values) => 
        value !== values.new_password ? 'Konfirmasi password tidak sama' : null,
    },
  });

  const handleUpdateProfile = async (values: typeof form.values) => {
    setLoading(true);
    try {
      // Convert DD/MM/YYYY to YYYY-MM-DD for database
      const [day, month, year] = values.birth_date.split('/');
      const dbDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      await studentAuthService.updateStudent(student.id, {
        full_name: values.full_name,
        email: values.email,
        birth_date: dbDate,
        address: values.address,
      });

      notifications.show({
        title: 'Berhasil',
        message: 'Profil berhasil diperbarui',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal memperbarui profil',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values: typeof passwordForm.values) => {
    setPasswordLoading(true);
    try {
      // Verify current password first
      try {
        await studentAuthService.loginStudent(student.email, values.current_password);
      } catch (error) {
        throw new Error('Password lama tidak benar');
      }

      // Update password with new flexible password
      await studentAuthService.updatePassword(student.id, values.new_password);

      notifications.show({
        title: 'Berhasil',
        message: 'Password berhasil diubah',
        color: 'green',
      });

      passwordForm.reset();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal mengubah password',
        color: 'red',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Title order={1}>Profil Siswa</Title>
          <Text c="dimmed">Kelola informasi profil dan keamanan akun Anda</Text>
        </div>

        {/* Profile Information */}
        <Card withBorder>
          <Stack gap="md">
            <Group gap="md">
              <Avatar size="lg" radius="xl" color="blue">
                {student.full_name?.charAt(0) || 'S'}
              </Avatar>
              <div>
                <Text fw={600} size="lg">{student.full_name || 'Unknown Student'}</Text>
                <Text c="dimmed">{student.email}</Text>
                <Text size="sm" c="dimmed">
                  Bergabung: {dayjs(student.created_at).format('DD/MM/YYYY')}
                </Text>
              </div>
            </Group>
          </Stack>
        </Card>

        {/* Edit Profile Form */}
        <Card withBorder>
          <Stack gap="md">
            <Text fw={600}>Informasi Profil</Text>
            
            <form onSubmit={form.onSubmit(handleUpdateProfile)}>
              <Stack gap="md">
                <TextInput
                  label="Nama Lengkap"
                  placeholder="Masukkan nama lengkap"
                  required
                  leftSection={<IconUser size={16} />}
                  {...form.getInputProps('full_name')}
                />

                <TextInput
                  label="Email"
                  placeholder="Masukkan email"
                  required
                  leftSection={<IconMail size={16} />}
                  {...form.getInputProps('email')}
                />

                <TextInput
                  label="Tanggal Lahir"
                  placeholder="DD/MM/YYYY (contoh: 15/03/2005)"
                  required
                  leftSection={<IconCalendar size={16} />}
                  {...form.getInputProps('birth_date')}
                />

                <TextInput
                  label="Alamat"
                  placeholder="Masukkan alamat (opsional)"
                  leftSection={<IconUser size={16} />}
                  {...form.getInputProps('address')}
                />

                <Group justify="flex-end">
                  <Button type="submit" loading={loading}>
                    Simpan Perubahan
                  </Button>
                </Group>
              </Stack>
            </form>
          </Stack>
        </Card>

        {/* Change Password Form */}
        <Card withBorder>
          <Stack gap="md">
            <Text fw={600}>Ubah Password</Text>
            
            <Alert color="blue" icon={<IconKey size={16} />}>
              <Text size="sm">
                <strong>Aturan Password Baru:</strong>
                <br />
                • Minimal 6 karakter, maksimal 50 karakter
                <br />
                • Boleh menggunakan huruf, angka, dan simbol
                <br />
                • Pastikan password mudah diingat namun sulit ditebak
              </Text>
            </Alert>
            
            <form onSubmit={passwordForm.onSubmit(handleChangePassword)}>
              <Stack gap="md">
                <PasswordInput
                  label="Password Lama"
                  placeholder="Masukkan password lama"
                  required
                  leftSection={<IconKey size={16} />}
                  {...passwordForm.getInputProps('current_password')}
                />

                <PasswordInput
                  label="Password Baru"
                  placeholder="Masukkan password baru (min. 6 karakter)"
                  required
                  leftSection={<IconKey size={16} />}
                  {...passwordForm.getInputProps('new_password')}
                />

                <PasswordInput
                  label="Konfirmasi Password Baru"
                  placeholder="Ulangi password baru"
                  required
                  leftSection={<IconKey size={16} />}
                  {...passwordForm.getInputProps('confirm_password')}
                />

                <Group justify="flex-end">
                  <Button type="submit" loading={passwordLoading} color="orange">
                    Ubah Password
                  </Button>
                </Group>
              </Stack>
            </form>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
