import { useState, useEffect } from 'react';
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
  ScrollArea,
  ActionIcon,
  Pagination
} from '@mantine/core';
import { 
  IconTrophy,
  IconMedal,
  IconAward,
  IconSearch,
  IconRefresh,
  IconClipboardList,
  IconTrendingUp,
  IconTarget,
  IconStar
} from '@tabler/icons-react';
import { useStudentAuth } from '../../contexts/StudentAuthContext';
import { LoadingSpinner } from '../../components';
import { notifications } from '@mantine/notifications';
import { formatGrade } from '../../utils/romanNumerals';
import { supabase } from '../../lib/supabase';

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
  is_current_student: boolean;
}

interface PersonalStats {
  current_rank: number;
  total_students: number;
  percentile: number;
  next_rank_student?: string;
  next_rank_score?: number;
  improvement_needed?: number;
}

export function StudentLeaderboard() {
  const { student, loading: authLoading } = useStudentAuth();
  
  if (authLoading || !student) {
    return <LoadingSpinner message="Memuat data leaderboard..." />;
  }
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentScore[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentScore[]>([]);
  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, selectedGrade]);


  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get student's grade first with simplified query
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          class_students!inner(
            class:classes(grade)
          )
        `)
        .eq('id', student.id)
        .single();

      if (studentError) {
        console.error('Error loading student data:', studentError);
        throw new Error('Gagal memuat data siswa');
      }

      const studentGrade = (studentData as any).class_students?.[0]?.class?.grade || '10';

      // Get all students in the same grade with optimized query (limit to 100 for leaderboard)
      const { data: scoresData, error: scoresError } = await supabase
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
        .eq('is_active', true)
        .eq('class_students.class.grade', studentGrade)
        .limit(100)
        .order('full_name');

      if (scoresError) throw scoresError;

      // Get all assignments for the grade in one query
      const { data: allAssignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('id, total_points, class_id, target_grade')
        .or(`target_grade.eq.${studentGrade},class_id.in.(${scoresData?.map((s: any) => s.class_students?.[0]?.class?.id).filter(Boolean).join(',') || ''})`);

      if (assignmentsError) {
        console.error('Error loading assignments:', assignmentsError);
        // Continue with empty assignments rather than throwing
      }

      // Get all submissions for all students in one query
      const studentIds = scoresData?.map((s: any) => s.id) || [];
      let allSubmissions: any[] = [];
      
      if (studentIds.length > 0) {
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('submissions')
          .select(`
            student_id,
            grade,
            assignment:assignments(total_points)
          `)
          .in('student_id', studentIds)
          .eq('status', 'graded');

        if (submissionsError) {
          console.error('Error loading submissions:', submissionsError);
          // Continue with empty submissions rather than throwing
        } else {
          allSubmissions = submissionsData || [];
        }
      }

      // Process data efficiently
      const studentScores: StudentScore[] = [];
      const submissionsByStudent = new Map<string, any[]>();
      const assignmentsByClass = new Map<string, any[]>();

      // Group submissions by student
      allSubmissions.forEach(submission => {
        const studentId = submission.student_id;
        if (!submissionsByStudent.has(studentId)) {
          submissionsByStudent.set(studentId, []);
        }
        submissionsByStudent.get(studentId)!.push(submission);
      });

      // Group assignments by class
      allAssignments?.forEach(assignment => {
        if (assignment.class_id) {
          if (!assignmentsByClass.has(assignment.class_id)) {
            assignmentsByClass.set(assignment.class_id, []);
          }
          assignmentsByClass.get(assignment.class_id)!.push(assignment);
        }
      });

      // Calculate scores for each student (optimized)
      const gradeAssignments = allAssignments?.filter(a => a.target_grade === studentGrade) || [];
      
      for (const studentData of scoresData || []) {
        const classId = (studentData as any).class_students?.[0]?.class?.id;
        const classAssignments = assignmentsByClass.get(classId) || [];
        const allStudentAssignments = [...classAssignments, ...gradeAssignments];
        
        const submissions = submissionsByStudent.get(studentData.id) || [];
        
        // Optimized calculations
        let totalPoints = 0;
        let earnedPoints = 0;
        
        for (const assignment of allStudentAssignments) {
          totalPoints += assignment.total_points;
        }
        
        for (const submission of submissions) {
          earnedPoints += submission.grade || 0;
        }
        
        const totalAssignments = allStudentAssignments.length;
        const completedAssignments = submissions.length;
        const averageScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

        studentScores.push({
          id: studentData.id,
          full_name: studentData.full_name,
          email: studentData.email,
          grade: (studentData as any).class_students?.[0]?.class?.grade || studentGrade,
          total_assignments: totalAssignments,
          completed_assignments: completedAssignments,
          total_points: totalPoints,
          earned_points: earnedPoints,
          average_score: averageScore,
          rank: 0, // Will be calculated after sorting
          class_name: (studentData as any).class_students?.[0]?.class?.name,
          is_current_student: studentData.id === student.id
        });
      }

      // Sort by average score and assign ranks
      studentScores.sort((a, b) => b.average_score - a.average_score);
      studentScores.forEach((student, index) => {
        student.rank = index + 1;
      });

      setStudents(studentScores);
      calculatePersonalStats(studentScores, student.id);
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal memuat data leaderboard';
      setError(errorMessage);
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePersonalStats = (studentScores: StudentScore[], currentStudentId: string) => {
    const currentStudent = studentScores.find(s => s.id === currentStudentId);
    if (!currentStudent) return;

    const totalStudents = studentScores.length;
    const currentRank = currentStudent.rank;
    const percentile = Math.round(((totalStudents - currentRank + 1) / totalStudents) * 100);
    
    const nextRankStudent = studentScores.find(s => s.rank === currentRank + 1);
    const improvementNeeded = nextRankStudent ? nextRankStudent.average_score - currentStudent.average_score : 0;

    setPersonalStats({
      current_rank: currentRank,
      total_students: totalStudents,
      percentile: percentile,
      next_rank_student: nextRankStudent?.full_name,
      next_rank_score: nextRankStudent?.average_score,
      improvement_needed: improvementNeeded
    });
  };

  const filterStudents = () => {
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

    setFilteredStudents(filtered);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset pagination when filters change (but not when data loads)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGrade]);

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

  if (loading) {
    return <LoadingSpinner message="Memuat data leaderboard... Mohon tunggu sebentar" />;
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert color="red" title="Error" icon={<IconTarget size={16} />}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={1}>Leaderboard</Title>
            <Text c="dimmed">Peringkat nilai siswa di tingkat {formatGrade(students[0]?.grade || '10')}</Text>
            <Text size="xs" c="dimmed">Menampilkan 100 siswa terbaik</Text>
          </div>
          <ActionIcon
            variant="light"
            onClick={loadData}
          >
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>

        {/* Personal Stats */}
        {personalStats && (
          <Card withBorder radius="md" p="md" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Group gap="md">
              <Avatar size="xl" radius="xl" color="white" c="blue">
                <IconStar size={24} />
              </Avatar>
              <div style={{ flex: 1 }}>
                <Text c="white" fw={600} size="xl">
                  Peringkat Anda: #{personalStats.current_rank}
                </Text>
                <Text c="white" size="sm" opacity={0.9}>
                  Dari {personalStats.total_students} siswa di tingkat {formatGrade(students[0]?.grade || '10')}
                </Text>
                <Text c="white" size="sm" opacity={0.9}>
                  Anda berada di {personalStats.percentile}% teratas
                </Text>
                {personalStats.next_rank_student && (
                  <Text c="white" size="sm" opacity={0.9}>
                    Untuk naik peringkat, butuh {personalStats.improvement_needed}% lebih tinggi dari {personalStats.next_rank_student}
                  </Text>
                )}
              </div>
            </Group>
          </Card>
        )}

        {/* Quick Stats */}
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          <Paper p="md" withBorder radius="md">
            <Group gap="sm">
              <IconTrophy size={24} color="var(--mantine-color-yellow-6)" />
              <div>
                <Text size="lg" fw={700} c="yellow">
                  #{personalStats?.current_rank || 0}
                </Text>
                <Text size="sm" c="dimmed">Peringkat Anda</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder radius="md">
            <Group gap="sm">
              <IconTarget size={24} color="var(--mantine-color-blue-6)" />
              <div>
                <Text size="lg" fw={700} c="blue">
                  {personalStats?.percentile || 0}%
                </Text>
                <Text size="sm" c="dimmed">Percentile</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder radius="md">
            <Group gap="sm">
              <IconClipboardList size={24} color="var(--mantine-color-green-6)" />
              <div>
                <Text size="lg" fw={700} c="green">
                  {students.find(s => s.is_current_student)?.completed_assignments || 0}/{students.find(s => s.is_current_student)?.total_assignments || 0}
                </Text>
                <Text size="sm" c="dimmed">Tugas Selesai</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder radius="md">
            <Group gap="sm">
              <IconTrendingUp size={24} color="var(--mantine-color-orange-6)" />
              <div>
                <Text size="lg" fw={700} c="orange">
                  {students.find(s => s.is_current_student)?.average_score || 0}%
                </Text>
                <Text size="sm" c="dimmed">Nilai Rata-rata</Text>
              </div>
            </Group>
          </Paper>
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

            <ScrollArea h={500}>
              <div style={{ overflowX: 'auto' }}>
                <Table style={{ minWidth: 800 }}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: 80 }}>Peringkat</Table.Th>
                      <Table.Th>Siswa</Table.Th>
                      <Table.Th>Kelas</Table.Th>
                      <Table.Th>Tugas</Table.Th>
                      <Table.Th>Nilai</Table.Th>
                      <Table.Th>Progress</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedStudents.map((student) => (
                      <Table.Tr 
                        key={student.id}
                        style={{ 
                          backgroundColor: student.is_current_student ? 'var(--mantine-color-blue-0)' : undefined,
                          borderColor: student.is_current_student ? 'var(--mantine-color-blue-3)' : undefined
                        }}
                      >
                        <Table.Td>
                          <Group gap="xs" justify="center">
                            {getRankIcon(student.rank)}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="sm">
                            <Avatar size="md" radius="xl" color={student.is_current_student ? "blue" : "gray"}>
                              {student.full_name.charAt(0)}
                            </Avatar>
                            <div>
                              <Text fw={500} c={student.is_current_student ? "blue" : undefined}>
                                {student.full_name}
                                {student.is_current_student && " (Anda)"}
                              </Text>
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
                            color={student.is_current_student ? "blue" : "gray"}
                            style={{ minWidth: 100 }}
                          />
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            </ScrollArea>

            {/* Pagination */}
            {totalPages > 1 && (
              <Group justify="space-between" mt="md">
                <Text size="sm" c="dimmed">
                  Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredStudents.length)} dari {filteredStudents.length} siswa
                </Text>
                <Pagination
                  total={totalPages}
                  value={currentPage}
                  onChange={handlePageChange}
                  size="sm"
                  withEdges
                />
              </Group>
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
