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
  const [studentPassword, setStudentPassword] = useState('');
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
      await loginStudent(studentEmail, studentPassword);
      navigate('/student/dashboard');
    } catch (err: any) {
      setStudentError(err.message || 'Gagal login sebagai siswa');
    } finally {
      setStudentLoading(false);
    }
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

                  <PasswordInput
                    label="Password"
                    placeholder="Password Anda"
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
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
