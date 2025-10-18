import { useState, useEffect } from 'react';
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
  Box,
  Code,
  Badge,
} from '@mantine/core';
import { 
  Terminal, 
  Code2, 
  AlertCircle, 
  Mail, 
  Lock, 
  User, 
  Shield,
  Database,
  Cpu,
  GitBranch,
  ChevronRight
} from 'lucide-react';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';
import './UnifiedLogin.css';

export default function UnifiedLogin() {
  const navigate = useNavigate();
  const { loginTeacher, loginStudent, loading } = useUnifiedAuth();

  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherError, setTeacherError] = useState('');

  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentError, setStudentError] = useState('');

  const [typingText, setTypingText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [currentLine, setCurrentLine] = useState(0);

  useEffect(() => {
    const terminalLines = [
      '> Initializing Learning Management System...',
      '> Loading authentication modules...',
      '> Connecting to database...',
      '> System ready. Welcome to LMS v3.0',
      '> Select your role to continue:'
    ];

    const typeText = () => {
      if (currentLine < terminalLines.length) {
        const currentText = terminalLines[currentLine];
        if (typingText.length < currentText.length) {
          setTypingText(currentText.slice(0, typingText.length + 1));
        } else {
          setTimeout(() => {
            setCurrentLine(currentLine + 1);
            setTypingText('');
          }, 1000);
        }
      }
    };

    const timer = setTimeout(typeText, 50);
    return () => clearTimeout(timer);
  }, [typingText, currentLine]);

  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(cursorTimer);
  }, []);

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError('');

    try {
      await loginTeacher(teacherEmail, teacherPassword);
      navigate('/teacher/dashboard');
    } catch (err: unknown) {
      const error = err as Error;
      setTeacherError(error.message || 'Gagal login sebagai guru');
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    try {
      await loginStudent(studentEmail, studentPassword);
      navigate('/student/dashboard');
    } catch (err: unknown) {
      const error = err as Error;
      setStudentError(error.message || 'Gagal login sebagai siswa');
    }
  };

  return (
    <Box className="programmer-container">
      {/* Terminal Background Elements */}
      <div className="terminal-grid"></div>
      <div className="code-particles"></div>
      <div className="binary-rain"></div>

      <Container size={1200} py={80} style={{ position: 'relative', zIndex: 1 }} className="main-container">
        <Group align="flex-start" gap="xl" className="login-layout">
          {/* Left Panel - Terminal Interface */}
          <Box className="terminal-panel">
            <Paper className="terminal-window" p="xl" radius="md">
              {/* Terminal Header */}
              <Group justify="space-between" mb="md" className="terminal-header">
                <Group gap="xs">
                  <div className="terminal-button red"></div>
                  <div className="terminal-button yellow"></div>
                  <div className="terminal-button green"></div>
                </Group>
                <Text size="sm" c="gray.5" className="terminal-title">
                  LMS Terminal v3.0
                </Text>
                <Group gap="xs">
                  <Terminal size={16} color="#10b981" />
                  <Code2 size={16} color="#3b82f6" />
                </Group>
              </Group>

              {/* Terminal Content */}
              <Box className="terminal-content">
                <Stack gap="xs">
                  <Group gap="xs">
                    <Text size="sm" c="green.4" className="terminal-prompt">
                      root@lms:~$
                    </Text>
                    <Text size="sm" c="white" className="terminal-text">
                      {typingText}
                      {showCursor && <span className="terminal-cursor">_</span>}
                    </Text>
                  </Group>
                  
                  {currentLine > 0 && (
                    <Group gap="xs">
                      <Text size="sm" c="green.4" className="terminal-prompt">
                        root@lms:~$
                      </Text>
                      <Text size="sm" c="blue.3" className="terminal-text">
                        ./lms --version
                      </Text>
                    </Group>
                  )}
                  
                  {currentLine > 1 && (
                    <Text size="sm" c="gray.4" className="terminal-output">
                      Learning Management System v3.0.0
                    </Text>
                  )}
                  
                  {currentLine > 2 && (
                    <Text size="sm" c="gray.4" className="terminal-output">
                      Built with React + TypeScript + Supabase
                    </Text>
                  )}
                  
                  {currentLine > 3 && (
                    <Group gap="xs">
                      <Text size="sm" c="green.4" className="terminal-prompt">
                        root@lms:~$
                      </Text>
                      <Text size="sm" c="yellow.4" className="terminal-text">
                        ./auth --status
                      </Text>
                    </Group>
                  )}
                  
                  {currentLine > 4 && (
                    <Text size="sm" c="green.4" className="terminal-output">
                      ✓ Authentication service online
                    </Text>
                  )}
                  
                  {currentLine > 4 && (
                    <Group gap="xs" mt="md">
                      <Text size="sm" c="green.4" className="terminal-prompt">
                        root@lms:~$
                      </Text>
                      <Text size="sm" c="blue.3" className="terminal-text">
                        whoami
                      </Text>
                    </Group>
                  )}
                  
                  {currentLine > 4 && (
                    <Text size="sm" c="yellow.4" className="terminal-output">
                      MUHAMMAD IRFAN
                    </Text>
                  )}
                  
                  {currentLine > 4 && (
                    <Text size="sm" c="gray.4" className="terminal-output">
                      Full Stack Developer & System Architect
                    </Text>
                  )}
                </Stack>
              </Box>

              {/* System Info */}
              <Box className="system-info" mt="lg">
                <Group justify="space-between" mb="sm">
                  <Text size="xs" c="gray.5" className="monospace">
                    SYSTEM STATUS
                  </Text>
                  <Badge size="xs" color="green" variant="dot">
                    ONLINE
                  </Badge>
                </Group>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="xs" c="gray.4" className="monospace">CPU:</Text>
                    <Text size="xs" c="green.4" className="monospace">12%</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="gray.4" className="monospace">RAM:</Text>
                    <Text size="xs" c="blue.4" className="monospace">2.1GB</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="gray.4" className="monospace">DB:</Text>
                    <Text size="xs" c="green.4" className="monospace">Connected</Text>
                  </Group>
                </Stack>
              </Box>
            </Paper>
          </Box>

          {/* Right Panel - Login Form */}
          <Box className="form-panel">
            <Paper className="code-window" p="xl" radius="md">
              {/* Code Window Header */}
              <Group justify="space-between" mb="lg" className="code-header">
                <Group gap="xs">
                  <div className="code-button red"></div>
                  <div className="code-button yellow"></div>
                  <div className="code-button green"></div>
                </Group>
                <Text size="sm" c="gray.5" className="monospace">
                  auth.tsx
                </Text>
                <Group gap="xs">
                  <Database size={16} color="#8b5cf6" />
                  <Shield size={16} color="#f59e0b" />
                </Group>
              </Group>

              <Stack gap="lg" mb="xl">
                <Box>
                  <Group gap="xs" mb="xs">
                    <Cpu size={20} color="#10b981" />
                    <Title order={2} c="white" className="monospace">
                      AUTHENTICATION
                    </Title>
                  </Group>
                  <Text c="gray.4" size="sm" className="monospace">
                    // Select your access level
                  </Text>
                </Box>
              </Stack>

              <Tabs defaultValue="teacher" variant="pills">
                <Tabs.List grow mb="xl" className="code-tabs">
                  <Tabs.Tab
                    value="teacher"
                    leftSection={<User size={16} />}
                    className="code-tab"
                  >
                    <Code mr="xs" />
                    TEACHER
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="student"
                    leftSection={<Shield size={16} />}
                    className="code-tab"
                  >
                    <Code mr="xs" />
                    STUDENT
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="teacher">
                  <form onSubmit={handleTeacherLogin}>
                    <Stack gap="lg">
                      {teacherError && (
                        <Alert
                          icon={<AlertCircle size={16} />}
                          className="code-alert"
                          radius="md"
                        >
                          <Text size="sm" className="monospace">
                            ERROR: {teacherError}
                          </Text>
                        </Alert>
                      )}

                      <Box>
                        <Group gap="xs" mb="xs">
                          <Text size="sm" c="green.4" className="monospace">
                            const
                          </Text>
                          <Text size="sm" c="blue.3" className="monospace">
                            teacherEmail
                          </Text>
                          <Text size="sm" c="gray.4" className="monospace">
                            =
                          </Text>
                          <Text size="sm" c="yellow.4" className="monospace">
                            "
                          </Text>
                        </Group>
                        <TextInput
                          placeholder="guru@sekolah.com"
                          required
                          value={teacherEmail}
                          onChange={(e) => setTeacherEmail(e.target.value)}
                          radius="md"
                          size="md"
                          className="code-input"
                          leftSection={<Mail size={16} color="#6b7280" />}
                        />
                      </Box>

                      <Box>
                        <Group gap="xs" mb="xs">
                          <Text size="sm" c="green.4" className="monospace">
                            const
                          </Text>
                          <Text size="sm" c="blue.3" className="monospace">
                            teacherPassword
                          </Text>
                          <Text size="sm" c="gray.4" className="monospace">
                            =
                          </Text>
                          <Text size="sm" c="yellow.4" className="monospace">
                            "
                          </Text>
                        </Group>
                        <PasswordInput
                          placeholder="••••••••"
                          required
                          value={teacherPassword}
                          onChange={(e) => setTeacherPassword(e.target.value)}
                          radius="md"
                          size="md"
                          className="code-input"
                          leftSection={<Lock size={16} color="#6b7280" />}
                        />
                      </Box>

                      <Button
                        type="submit"
                        fullWidth
                        loading={loading}
                        size="md"
                        radius="md"
                        className="code-button-primary"
                        rightSection={<ChevronRight size={16} />}
                      >
                        <Terminal size={16} className="mr-2" />
                        EXECUTE LOGIN
                      </Button>
                    </Stack>
                  </form>
                </Tabs.Panel>

                <Tabs.Panel value="student">
                  <form onSubmit={handleStudentLogin}>
                    <Stack gap="lg">
                      {studentError && (
                        <Alert
                          icon={<AlertCircle size={16} />}
                          className="code-alert"
                          radius="md"
                        >
                          <Text size="sm" className="monospace">
                            ERROR: {studentError}
                          </Text>
                        </Alert>
                      )}

                      <Box>
                        <Group gap="xs" mb="xs">
                          <Text size="sm" c="green.4" className="monospace">
                            const
                          </Text>
                          <Text size="sm" c="blue.3" className="monospace">
                            studentEmail
                          </Text>
                          <Text size="sm" c="gray.4" className="monospace">
                            =
                          </Text>
                          <Text size="sm" c="yellow.4" className="monospace">
                            "
                          </Text>
                        </Group>
                        <TextInput
                          placeholder="siswa@sekolah.com"
                          required
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          radius="md"
                          size="md"
                          className="code-input"
                          leftSection={<Mail size={16} color="#6b7280" />}
                        />
                      </Box>

                      <Box>
                        <Group gap="xs" mb="xs">
                          <Text size="sm" c="green.4" className="monospace">
                            const
                          </Text>
                          <Text size="sm" c="blue.3" className="monospace">
                            studentPassword
                          </Text>
                          <Text size="sm" c="gray.4" className="monospace">
                            =
                          </Text>
                          <Text size="sm" c="yellow.4" className="monospace">
                            "
                          </Text>
                        </Group>
                        <PasswordInput
                          placeholder="••••••••"
                          required
                          value={studentPassword}
                          onChange={(e) => setStudentPassword(e.target.value)}
                          radius="md"
                          size="md"
                          className="code-input"
                          leftSection={<Lock size={16} color="#6b7280" />}
                        />
                      </Box>

                      <Button
                        type="submit"
                        fullWidth
                        loading={loading}
                        size="md"
                        radius="md"
                        className="code-button-secondary"
                        rightSection={<ChevronRight size={16} />}
                      >
                        <GitBranch size={16} className="mr-2" />
                        EXECUTE LOGIN
                      </Button>
                    </Stack>
                  </form>
                </Tabs.Panel>
              </Tabs>

              {/* Help Section */}
              <Paper className="code-help" p="md" radius="md" mt="xl">
                <Group gap="xs" mb="sm">
                  <Code2 size={14} color="#10b981" />
                  <Text size="xs" c="green.4" className="monospace">
                    // AUTHENTICATION GUIDE
                  </Text>
                </Group>
                <Stack gap="xs">
                  <Group gap="xs">
                    <Text size="xs" c="blue.3" className="monospace">//</Text>
                    <Text size="xs" c="gray.4" className="monospace">
                      TEACHER: Use registered email & password
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <Text size="xs" c="purple.3" className="monospace">//</Text>
                    <Text size="xs" c="gray.4" className="monospace">
                      STUDENT: Default password is birthdate (DDMMYYYY)
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <Text size="xs" c="red.3" className="monospace">//</Text>
                    <Text size="xs" c="gray.4" className="monospace">
                      SUPPORT: Contact system administrator
                    </Text>
                  </Group>
                </Stack>
              </Paper>
            </Paper>
          </Box>
        </Group>
      </Container>
    </Box>
  );
}