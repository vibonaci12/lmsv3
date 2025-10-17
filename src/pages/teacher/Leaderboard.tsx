import { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Card,
  SimpleGrid,
  Paper,
  Badge,
  Avatar,
  TextInput,
  Select,
  Alert,
  Progress,
  Table,
  ActionIcon,
  Menu,
  Tabs,
  ScrollArea
} from '@mantine/core';
import { 
  IconTrophy,
  IconMedal,
  IconAward,
  IconSearch,
  IconFilter,
  IconRefresh,
  IconDownload,
  IconDots,
  IconEye,
  IconUsers,
  IconClipboardList,
  IconTrendingUp
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner, EmptyState, Pagination, usePagination } from '../../components';
import { notifications } from '@mantine/notifications';
import { formatGrade } from '../../utils/romanNumerals';
import { supabase } from '../../lib/supabase';
import dayjs from 'dayjs';

interface StudentScore {
  id: string;
  full_name: string;
  email: string;
  grade: string;
  total_assignments: number;
  completed_assignments: number;
  total_points: number;
  earned_points: number;
  average_score: number;
  rank: number;
  class_name?: string;
}

interface GradeStats {
  grade: string;
  total_students: number;
  average_score: number;
  top_performer: string;
  completion_rate: number;
}

export function Leaderboard() {
  const { user } = useAuth();
  const teacher = user!;
  
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentScore[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('overall');
  
  useEffect(() => {
    loadData();
  }, []);

  // Memoized filtered students
  const filteredStudents = useMemo(() => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.class_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedGrade) {
      filtered = filtered.filter(student => student.grade === selectedGrade);
    }

    return filtered;
  }, [students, searchTerm, selectedGrade]);

  // Memoized grade stats
  const gradeStats = useMemo(() => {
    const gradeMap = new Map<string, StudentScore[]>();

    filteredStudents.forEach(student => {
      if (!gradeMap.has(student.grade)) {
        gradeMap.set(student.grade, []);
      }
      gradeMap.get(student.grade)!.push(student);
    });

    const stats: GradeStats[] = [];
    gradeMap.forEach((students, grade) => {
      const totalStudents = students.length;
      const averageScore = Math.round(students.reduce((sum, s) => sum + s.average_score, 0) / totalStudents);
      const topPerformer = students[0]?.full_name || '';
      const completionRate = Math.round(students.reduce((sum, s) => sum + (s.completed_assignments / s.total_assignments), 0) / totalStudents * 100);

      stats.push({
        grade,
        total_students: totalStudents,
        average_score: averageScore,
        top_performer: topPerformer,
        completion_rate: completionRate
      });
    });

    stats.sort((a, b) => parseInt(a.grade) - parseInt(b.grade));
    return stats;
  }, [filteredStudents]);

  // Pagination
  const {
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    paginatedData: paginatedStudents,
    handlePageChange,
    handleItemsPerPageChange,
    resetPagination
  } = usePagination(filteredStudents, 10, 1);

  useEffect(() => {
    resetPagination();
  }, [filteredStudents.length]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all students with their class info in one query
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          email,
          class_students!inner(
            class:classes(
              id,
              name,
              grade
            )
          )
        `)
        .eq('is_active', true);

      if (studentsError) throw studentsError;

      // Get all assignments in one query
      const { data: allAssignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('id, total_points, class_id, target_grade');

      if (assignmentsError) throw assignmentsError;

      // Get all graded submissions in one query
      const { data: allSubmissions, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          id,
          grade,
          student_id,
          assignment:assignments(
            total_points,
            assignment_type,
            class_id,
            target_grade
          )
        `)
        .eq('status', 'graded');

      if (submissionsError) throw submissionsError;

      // Create maps for efficient lookups
      const assignmentsMap = new Map();
      const submissionsMap = new Map();

      // Group assignments by class_id and target_grade
      allAssignments?.forEach(assignment => {
        const key = assignment.class_id || `grade_${assignment.target_grade}`;
        if (!assignmentsMap.has(key)) {
          assignmentsMap.set(key, []);
        }
        assignmentsMap.get(key).push(assignment);
      });

      // Group submissions by student_id
      allSubmissions?.forEach(submission => {
        if (!submissionsMap.has(submission.student_id)) {
          submissionsMap.set(submission.student_id, []);
        }
        submissionsMap.get(submission.student_id).push(submission);
      });

      // Process student scores efficiently
      const studentScores: StudentScore[] = [];

      for (const student of studentsData || []) {
        const studentClassIds = student.class_students.map((cs: any) => cs.class.id);
        const studentGrade = (student.class_students[0] as any)?.class?.grade || '10';

        // Get relevant assignments for this student
        const relevantAssignments = [];
        studentClassIds.forEach(classId => {
          const classAssignments = assignmentsMap.get(classId) || [];
          relevantAssignments.push(...classAssignments);
        });
        const gradeAssignments = assignmentsMap.get(`grade_${studentGrade}`) || [];
        relevantAssignments.push(...gradeAssignments);

        // Remove duplicates
        const uniqueAssignments = relevantAssignments.filter((assignment, index, self) =>
          index === self.findIndex(a => a.id === assignment.id)
        );

        // Get student's submissions
        const studentSubmissions = submissionsMap.get(student.id) || [];

        const totalPoints = uniqueAssignments.reduce((sum, assignment) => sum + assignment.total_points, 0);
        const earnedPoints = studentSubmissions.reduce((sum: number, submission: any) => sum + (submission.grade || 0), 0);
        const totalAssignments = uniqueAssignments.length;
        const completedAssignments = studentSubmissions.length;
        const averageScore = totalAssignments > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

        studentScores.push({
          id: student.id,
          full_name: student.full_name,
          email: student.email,
          grade: studentGrade,
          total_assignments: totalAssignments,
          completed_assignments: completedAssignments,
          total_points: totalPoints,
          earned_points: earnedPoints,
          average_score: averageScore,
          rank: 0, // Will be calculated after sorting
          class_name: (student.class_students[0] as any)?.class?.name
        });
      }

      // Sort by average score and assign ranks
      studentScores.sort((a, b) => b.average_score - a.average_score);
      studentScores.forEach((student, index) => {
        student.rank = index + 1;
      });

      setStudents(studentScores);
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal memuat data leaderboard',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <IconTrophy size={20} color="#FFD700" />;
    if (rank === 2) return <IconMedal size={20} color="#C0C0C0" />;
    if (rank === 3) return <IconAward size={20} color="#CD7F32" />;
    return <Text fw={700} size="lg">#{rank}</Text>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'yellow';
    if (rank === 2) return 'gray';
    if (rank === 3) return 'orange';
    if (rank <= 10) return 'blue';
    return 'gray';
  };

  const handleExportLeaderboard = () => {
    const exportData = filteredStudents.map(student => ({
      'Peringkat': student.rank,
      'Nama': student.full_name,
      'Email': student.email,
      'Kelas': student.class_name || '',
      'Tingkat': formatGrade(student.grade),
      'Tugas Selesai': `${student.completed_assignments}/${student.total_assignments}`,
      'Nilai Rata-rata': `${student.average_score}%`,
      'Total Poin': `${student.earned_points}/${student.total_points}`
    }));

    // Create CSV content
    const headers = Object.keys(exportData[0] || {}).join(',');
    const rows = exportData.map(row => Object.values(row).join(','));
    const csvContent = [headers, ...rows].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Leaderboard_${selectedGrade ? formatGrade(selectedGrade) : 'Semua'}_${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    notifications.show({
      title: 'Berhasil',
      message: 'Leaderboard berhasil diekspor',
      color: 'green',
    });
  };

  if (loading) {
    return <LoadingSpinner message="Memuat data leaderboard..." />;
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={1}>Leaderboard</Title>
            <Text c="dimmed">Peringkat nilai siswa berdasarkan performa tugas</Text>
          </div>
          <Group gap="sm">
            <ActionIcon
              variant="light"
              onClick={loadData}
            >
              <IconRefresh size={16} />
            </ActionIcon>
            <ActionIcon
              variant="light"
              onClick={handleExportLeaderboard}
            >
              <IconDownload size={16} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Grade Stats */}
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          {gradeStats.map((stat) => (
            <Card key={stat.grade} withBorder radius="md" p="md">
              <Group gap="md">
                <Avatar size="lg" radius="xl" color="blue">
                  {stat.grade}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <Text fw={600} size="lg">
                    Kelas {formatGrade(stat.grade)}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {stat.total_students} siswa
                  </Text>
                  <Text size="sm" c="dimmed">
                    Rata-rata: {stat.average_score}%
                  </Text>
                  <Text size="xs" c="dimmed">
                    Juara: {stat.top_performer}
                  </Text>
                </div>
              </Group>
            </Card>
          ))}
        </SimpleGrid>

        {/* Filters */}
        <Card withBorder radius="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600}>Filter & Pencarian</Text>
              <Badge color="blue" variant="light">
                {filteredStudents.length} siswa
              </Badge>
            </Group>
            
            <Group gap="md">
              <TextInput
                placeholder="Cari siswa atau kelas..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1 }}
              />
              
              <Select
                placeholder="Pilih tingkat"
                data={[
                  { value: '', label: 'Semua Tingkat' },
                  { value: '10', label: 'Kelas X' },
                  { value: '11', label: 'Kelas XI' },
                  { value: '12', label: 'Kelas XII' },
                ]}
                value={selectedGrade}
                onChange={(value) => setSelectedGrade(value || '')}
                style={{ minWidth: 150 }}
              />
            </Group>
          </Stack>
        </Card>

        {/* Leaderboard Table */}
        <Card withBorder radius="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600}>Peringkat Siswa</Text>
              <Text size="sm" c="dimmed">
                Diurutkan berdasarkan nilai rata-rata
              </Text>
            </Group>

            <div style={{ overflowX: 'auto' }}>
              <Table style={{ minWidth: 800 }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={80}>Peringkat</Table.Th>
                    <Table.Th>Siswa</Table.Th>
                    <Table.Th>Kelas</Table.Th>
                    <Table.Th>Tugas</Table.Th>
                    <Table.Th>Nilai</Table.Th>
                    <Table.Th>Progress</Table.Th>
                    <Table.Th w={100}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedStudents.map((student) => (
                      <Table.Tr key={student.id}>
                        <Table.Td>
                          <Group gap="xs" justify="center">
                            {getRankIcon(student.rank)}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="sm">
                            <Avatar size="md" radius="xl" color="blue">
                              {student.full_name.charAt(0)}
                            </Avatar>
                            <div>
                              <Text fw={500}>{student.full_name}</Text>
                              <Text size="sm" c="dimmed">{student.email}</Text>
                            </div>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <div>
                            <Text size="sm" fw={500}>
                              {student.class_name || '-'}
                            </Text>
                            <Text size="xs" c="dimmed">
                              Kelas {formatGrade(student.grade)}
                            </Text>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {student.completed_assignments}/{student.total_assignments}
                          </Text>
                          <Text size="xs" c="dimmed">
                            tugas selesai
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Text fw={600} size="lg" c={getRankColor(student.rank)}>
                              {student.average_score}%
                            </Text>
                            <Text size="sm" c="dimmed">
                              ({student.earned_points}/{student.total_points})
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Progress
                            value={(student.completed_assignments / student.total_assignments) * 100}
                            size="sm"
                            color="blue"
                            style={{ minWidth: 100 }}
                          />
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
                                onClick={() => {/* Navigate to student detail */}}
                              >
                                Lihat Detail
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
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
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
