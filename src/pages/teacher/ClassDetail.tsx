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
  Paper
} from '@mantine/core';
import { 
  IconArrowLeft,
  IconBook, 
  IconCalendar,
  IconUsers
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { classService } from '../../services/classService';
import { LoadingSpinner, EmptyState } from '../../components';
import { formatGrade } from '../../utils/romanNumerals';

export function ClassDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const teacher = user!;
  
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<any>(null);

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
      setClassData(classInfo);
    } catch (error) {
      console.error('Error loading class:', error);
    } finally {
      setLoading(false);
    }
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
              onClick={() => navigate('/teacher/classes')}
            >
              <IconArrowLeft size={16} />
            </ActionIcon>
            <div>
              <Title order={1}>{classData.name}</Title>
              <Text c="dimmed">
                {formatGrade(classData.grade)} • {classData.class_code}
              </Text>
            </div>
          </Group>
        </Group>

        {/* Class Info */}
        <Card withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600}>Informasi Kelas</Text>
            </Group>
            
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <div>
                <Text size="sm" c="dimmed">Nama Kelas</Text>
                <Text fw={500}>{classData.name}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Tingkat</Text>
                <Text fw={500}>{formatGrade(classData.grade)}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Kode Kelas</Text>
                <Text fw={500}>{classData.class_code}</Text>
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

        {/* Quick Stats */}
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconUsers size={32} color="var(--mantine-color-blue-6)" />
              <div>
                <Text size="lg" fw={600}>{classData.student_count || 0}</Text>
                <Text size="sm" c="dimmed">Total Siswa</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconBook size={32} color="var(--mantine-color-green-6)" />
              <div>
                <Text size="lg" fw={600}>0</Text>
                <Text size="sm" c="dimmed">Total Tugas</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconCalendar size={32} color="var(--mantine-color-orange-6)" />
              <div>
                <Text size="lg" fw={600}>0</Text>
                <Text size="sm" c="dimmed">Sesi Absensi</Text>
              </div>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Management Buttons */}
        <Card withBorder>
          <Stack gap="md">
            <Text fw={600}>Kelola Kelas</Text>
            <Group gap="sm">
              <Button
                leftSection={<IconUsers size={16} />}
                variant="light"
                color="purple"
                size="lg"
                onClick={() => navigate(`/teacher/classes/${id}/students`)}
              >
                Siswa
              </Button>
              <Button
                leftSection={<IconCalendar size={16} />}
                variant="light"
                color="green"
                size="lg"
                onClick={() => navigate(`/teacher/classes/${id}/attendance`)}
              >
                Absen
              </Button>
              <Button
                leftSection={<IconBook size={16} />}
                variant="light"
                color="blue"
                size="lg"
                onClick={() => navigate(`/teacher/classes/${id}/assignments`)}
              >
                Tugas
              </Button>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}