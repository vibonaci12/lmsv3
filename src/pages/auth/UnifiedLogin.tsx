import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
  Tabs,
  Alert,
  Group,
} from '@mantine/core';
import { useAuth } from '../../contexts/AuthContext';
import { GraduationCap, BookOpen, AlertCircle } from 'lucide-react';

export function UnifiedLogin() {
  const navigate = useNavigate();
  const { loginTeacher, loginStudent } = useAuth();
  
  // Teacher login state
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [teacherError, setTeacherError] = useState('');
  
  // Student login state
  const [studentEmail, setStudentEmail] = useState('');
  const [studentBirthDate, setStudentBirthDate] = useState('');
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState('');

  async function handleTeacherLogin(e: React.FormEvent) {
    e.preventDefault();
    setTeacherError('');
    setTeacherLoading(true);

    try {
      await loginTeacher(teacherEmail, teacherPassword);
      navigate('/teacher/dashboard');
    } catch (err: any) {
      setTeacherError(err.message || 'Gagal login sebagai guru');
    } finally {
      setTeacherLoading(false);
    }
  }

  async function handleStudentLogin(e: React.FormEvent) {
    e.preventDefault();
    setStudentError('');
    setStudentLoading(true);

    try {
      // Convert DD/MM/YYYY to DDMMYYYY for password
      const password = studentBirthDate.replace(/\//g, '');
      await loginStudent(studentEmail, password);
      navigate('/student/dashboard');
    } catch (err: any) {
      setStudentError(err.message || 'Gagal login sebagai siswa');
    } finally {
      setStudentLoading(false);
    }
  }

  function formatBirthDate(value: string) {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // Format as DDMMYYYY
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  }

  function handleBirthDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatBirthDate(e.target.value);
    setStudentBirthDate(formatted);
  }

  return (
    <Container size={500} my={80}>
      <Stack gap="lg">
        <Stack gap="xs" align="center">
          <Group gap="md">
            <GraduationCap size={48} color="#228be6" />
            <BookOpen size={48} color="#228be6" />
          </Group>
          <Title order={2}>Learning Management System</Title>
          <Text c="dimmed" size="sm" ta="center">
            Masuk ke platform pembelajaran
          </Text>
        </Stack>

        <Paper withBorder shadow="md" p={30} radius="md">
          <Tabs defaultValue="teacher" variant="outline">
            <Tabs.List>
              <Tabs.Tab value="teacher" leftSection={<GraduationCap size={16} />}>
                Guru
              </Tabs.Tab>
              <Tabs.Tab value="student" leftSection={<BookOpen size={16} />}>
                Siswa
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="teacher" pt="md">
              <form onSubmit={handleTeacherLogin}>
                <Stack gap="md">
                  {teacherError && (
                    <Alert icon={<AlertCircle size={16} />} color="red">
                      {teacherError}
                    </Alert>
                  )}

                  <TextInput
                    label="Email Guru"
                    placeholder="guru@sekolah.com"
                    required
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                  />

                  <PasswordInput
                    label="Password"
                    placeholder="Password Anda"
                    required
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                  />

                  <Button type="submit" fullWidth loading={teacherLoading}>
                    Login sebagai Guru
                  </Button>
                </Stack>
              </form>
            </Tabs.Panel>

            <Tabs.Panel value="student" pt="md">
              <form onSubmit={handleStudentLogin}>
                <Stack gap="md">
                  {studentError && (
                    <Alert icon={<AlertCircle size={16} />} color="red">
                      {studentError}
                    </Alert>
                  )}

                  <TextInput
                    label="Email Siswa"
                    placeholder="siswa@sekolah.com"
                    required
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                  />

                  <TextInput
                    label="Tanggal Lahir"
                    placeholder="DD/MM/YYYY"
                    required
                    value={studentBirthDate}
                    onChange={handleBirthDateChange}
                    maxLength={10}
                    description="Format: DD/MM/YYYY (contoh: 15/03/2005)"
                  />

                  <Button type="submit" fullWidth loading={studentLoading}>
                    Login sebagai Siswa
                  </Button>
                </Stack>
              </form>
            </Tabs.Panel>
          </Tabs>

        </Paper>
      </Stack>
    </Container>
  );
}
