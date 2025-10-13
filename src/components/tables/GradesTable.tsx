import { Table, Text, Badge, Group, Progress, Avatar } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-react';

interface GradeData {
  student_id: string;
  student_name: string;
  student_email: string;
  total_points: number;
  max_points: number;
  percentage: number;
  grade: string;
  assignments_completed: number;
  total_assignments: number;
}

interface GradesTableProps {
  grades: GradeData[];
  showTrend?: boolean;
  previousGrades?: Record<string, number>;
}

export function GradesTable({ 
  grades, 
  showTrend = false,
  previousGrades = {}
}: GradesTableProps) {
  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'green';
    if (percentage >= 80) return 'blue';
    if (percentage >= 70) return 'yellow';
    if (percentage >= 60) return 'orange';
    return 'red';
  };

  const getGradeLabel = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'E';
  };

  const getTrendIcon = (currentGrade: number, previousGrade?: number) => {
    if (!previousGrade) return <IconMinus size={14} color="gray" />;
    
    if (currentGrade > previousGrade) {
      return <IconTrendingUp size={14} color="green" />;
    } else if (currentGrade < previousGrade) {
      return <IconTrendingDown size={14} color="red" />;
    } else {
      return <IconMinus size={14} color="gray" />;
    }
  };

  const getCompletionRate = (completed: number, total: number) => {
    if (total === 0) return 0;
    return (completed / total) * 100;
  };

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Siswa</Table.Th>
          <Table.Th>Nilai</Table.Th>
          <Table.Th>Persentase</Table.Th>
          <Table.Th>Progress</Table.Th>
          <Table.Th>Poin</Table.Th>
          {showTrend && <Table.Th>Tren</Table.Th>}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {grades.map((grade) => {
          const gradeColor = getGradeColor(grade.percentage);
          const gradeLabel = getGradeLabel(grade.percentage);
          const completionRate = getCompletionRate(grade.assignments_completed, grade.total_assignments);
          const previousGrade = previousGrades[grade.student_id];
          
          return (
            <Table.Tr key={grade.student_id}>
              <Table.Td>
                <Group gap="sm">
                  <Avatar size="sm" radius="xl" color="blue">
                    {grade.student_name.charAt(0)}
                  </Avatar>
                  <div>
                    <Text fw={500} size="sm">
                      {grade.student_name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {grade.student_email}
                    </Text>
                  </div>
                </Group>
              </Table.Td>
              <Table.Td>
                <Badge 
                  color={gradeColor} 
                  variant="light"
                  size="lg"
                >
                  {gradeLabel}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size="sm" fw={500}>
                  {grade.percentage.toFixed(1)}%
                </Text>
              </Table.Td>
              <Table.Td>
                <div>
                  <Progress 
                    value={completionRate} 
                    size="sm" 
                    color={completionRate >= 80 ? 'green' : completionRate >= 60 ? 'yellow' : 'red'}
                    mb={4}
                  />
                  <Text size="xs" c="dimmed">
                    {grade.assignments_completed}/{grade.total_assignments} tugas
                  </Text>
                </div>
              </Table.Td>
              <Table.Td>
                <Text size="sm" fw={500}>
                  {grade.total_points}/{grade.max_points}
                </Text>
              </Table.Td>
              {showTrend && (
                <Table.Td>
                  <Group gap="xs">
                    {getTrendIcon(grade.percentage, previousGrade)}
                    {previousGrade && (
                      <Text size="xs" c="dimmed">
                        {grade.percentage > previousGrade ? '+' : ''}
                        {(grade.percentage - previousGrade).toFixed(1)}%
                      </Text>
                    )}
                  </Group>
                </Table.Td>
              )}
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}
