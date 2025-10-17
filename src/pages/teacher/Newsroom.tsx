import { useState, useEffect } from 'react';
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
  Textarea,
  Select,
  Alert,
  SimpleGrid,
  Paper,
  Tabs,
  Pagination,
  LoadingOverlay,
  FileInput,
  Image,
  Box,
} from '@mantine/core';
import { 
  IconPlus, 
  IconEdit,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconArchive,
  IconFileText,
  IconSpeakerphone,
  IconCalendar,
  IconUser,
  IconAlertCircle,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useAuth } from '../../contexts/AuthContext';
import { newsroomService, NewsroomItem, CreateNewsroomItem } from '../../services/newsroomService';
import { LoadingSpinner, EmptyState, ConfirmDialog } from '../../components';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';

export function Newsroom() {
  const { user } = useAuth();
  const teacher = user!;
  
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NewsroomItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<NewsroomItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    announcements: 0,
    news: 0,
  });

  const form = useForm<CreateNewsroomItem>({
    initialValues: {
      title: '',
      content: '',
      excerpt: '',
      image_file: undefined,
      type: 'news',
      status: 'draft',
      priority: 'normal',
      target_audience: 'all',
    },
    validate: {
      title: (value) => (!value ? 'Judul harus diisi' : null),
      content: (value) => (!value ? 'Konten harus diisi' : null),
      image_file: (value) => {
        if (value && value.size > 2 * 1024 * 1024) {
          return 'Ukuran file maksimal 2MB';
        }
        return null;
      },
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, statsData] = await Promise.all([
        newsroomService.getAllItems(),
        newsroomService.getStatistics(),
      ]);
      
      setItems(itemsData);
      setStats(statsData);
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal memuat data',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (values: CreateNewsroomItem) => {
    try {
      await newsroomService.createItem(values, teacher.id);
      
      notifications.show({
        title: 'Berhasil',
        message: values.type === 'news' ? 'Berita berhasil ditambahkan' : 'Pengumuman berhasil ditambahkan',
        color: 'green',
      });
      
      setAddModalOpen(false);
      form.reset();
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal menambahkan item',
        color: 'red',
      });
    }
  };

  const handleUpdateItem = async (values: CreateNewsroomItem) => {
    if (!selectedItem) return;

    try {
      await newsroomService.updateItem({ ...values, id: selectedItem.id }, teacher.id);
      
      notifications.show({
        title: 'Berhasil',
        message: 'Item berhasil diperbarui',
        color: 'green',
      });
      
      setEditModalOpen(false);
      setSelectedItem(null);
      form.reset();
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal memperbarui item',
        color: 'red',
      });
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;

    try {
      await newsroomService.deleteItem(selectedItem.id, teacher.id);
      
      notifications.show({
        title: 'Berhasil',
        message: 'Item berhasil dihapus',
        color: 'green',
      });
      
      setDeleteModalOpen(false);
      setSelectedItem(null);
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal menghapus item',
        color: 'red',
      });
    }
  };

  const handlePublishItem = async () => {
    if (!selectedItem) return;

    try {
      await newsroomService.publishItem(selectedItem.id, teacher.id);
      
      notifications.show({
        title: 'Berhasil',
        message: 'Item berhasil dipublikasikan',
        color: 'green',
      });
      
      setPublishModalOpen(false);
      setSelectedItem(null);
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal mempublikasikan item',
        color: 'red',
      });
    }
  };

  const handleArchiveItem = async () => {
    if (!selectedItem) return;

    try {
      await newsroomService.archiveItem(selectedItem.id, teacher.id);
      
      notifications.show({
        title: 'Berhasil',
        message: 'Item berhasil diarsipkan',
        color: 'green',
      });
      
      setArchiveModalOpen(false);
      setSelectedItem(null);
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal mengarsipkan item',
        color: 'red',
      });
    }
  };

  const openEditModal = (item: NewsroomItem) => {
    setSelectedItem(item);
    form.setValues({
      title: item.title,
      content: item.content,
      excerpt: item.excerpt || '',
      image_file: undefined, // Reset file input
      type: item.type,
      status: item.status,
      priority: item.priority || 'normal',
      target_audience: item.target_audience || 'all',
    });
    setEditModalOpen(true);
  };

  const openViewModal = (item: NewsroomItem) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };

  const openDeleteModal = (item: NewsroomItem) => {
    setSelectedItem(item);
    setDeleteModalOpen(true);
  };

  const openPublishModal = (item: NewsroomItem) => {
    setSelectedItem(item);
    setPublishModalOpen(true);
  };

  const openArchiveModal = (item: NewsroomItem) => {
    setSelectedItem(item);
    setArchiveModalOpen(true);
  };

  // Filter items based on active tab
  const filteredItems = items.filter(item => {
    switch (activeTab) {
      case 'all':
        return true;
      case 'published':
        return 'status' in item ? item.status === 'published' : true;
      case 'draft':
        return 'status' in item ? item.status === 'draft' : false;
      case 'archived':
        return 'status' in item ? item.status === 'archived' : false;
      case 'announcements':
        return !('type' in item) || item.type === 'announcement';
      case 'news':
        return 'type' in item && item.type === 'news';
      default:
        return true;
    }
  });

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'green';
      case 'draft': return 'yellow';
      case 'archived': return 'gray';
      default: return 'blue';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'normal': return 'blue';
      case 'low': return 'gray';
      default: return 'blue';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Memuat newsroom..." />;
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={1}>NewsRoom</Title>
            <Text c="dimmed">Kelola berita dan pengumuman</Text>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setAddModalOpen(true)}
          >
            Tambah Konten
          </Button>
        </Group>

        {/* Statistics */}
        <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }}>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconFileText size={24} color="var(--mantine-color-blue-6)" />
              <div>
                <Text size="lg" fw={600}>{stats.total}</Text>
                <Text size="sm" c="dimmed">Total</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconEye size={24} color="var(--mantine-color-green-6)" />
              <div>
                <Text size="lg" fw={600}>{stats.published}</Text>
                <Text size="sm" c="dimmed">Dipublikasikan</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconEyeOff size={24} color="var(--mantine-color-yellow-6)" />
              <div>
                <Text size="lg" fw={600}>{stats.draft}</Text>
                <Text size="sm" c="dimmed">Draft</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconArchive size={24} color="var(--mantine-color-gray-6)" />
              <div>
                <Text size="lg" fw={600}>{stats.archived}</Text>
                <Text size="sm" c="dimmed">Diarsipkan</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconSpeakerphone size={24} color="var(--mantine-color-purple-6)" />
              <div>
                <Text size="lg" fw={600}>{stats.announcements}</Text>
                <Text size="sm" c="dimmed">Pengumuman</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconFileText size={24} color="var(--mantine-color-cyan-6)" />
              <div>
                <Text size="lg" fw={600}>{stats.news}</Text>
                <Text size="sm" c="dimmed">Berita</Text>
              </div>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(value) => {
          setActiveTab(value || 'all');
          setCurrentPage(1);
        }}>
          <Tabs.List>
            <Tabs.Tab value="all">Semua</Tabs.Tab>
            <Tabs.Tab value="published">Dipublikasikan</Tabs.Tab>
            <Tabs.Tab value="draft">Draft</Tabs.Tab>
            <Tabs.Tab value="archived">Diarsipkan</Tabs.Tab>
            <Tabs.Tab value="announcements">Pengumuman</Tabs.Tab>
            <Tabs.Tab value="news">Berita</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value={activeTab} pt="md">
            {paginatedItems.length === 0 ? (
              <EmptyState
                icon={IconFileText}
                title="Tidak Ada Item"
                description="Belum ada item newsroom yang sesuai dengan filter yang dipilih."
              />
            ) : (
              <Stack gap="md">
                <Box style={{ overflowX: 'auto', width: '100%' }}>
                  <Table striped highlightOnHover style={{ minWidth: '800px' }}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Judul</Table.Th>
                      <Table.Th>Tipe</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Prioritas</Table.Th>
                      <Table.Th>Target</Table.Th>
                      <Table.Th>Dibuat</Table.Th>
                      <Table.Th width={120}>Aksi</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedItems.map((item) => (
                      <Table.Tr key={item.id}>
                        <Table.Td>
                          <div>
                            <Text fw={500} size="sm">{item.title}</Text>
                            {item.excerpt && (
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {item.excerpt}
                              </Text>
                            )}
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Badge 
                            color={item.type === 'announcement' ? 'purple' : 'cyan'}
                            variant="light"
                          >
                            {item.type === 'announcement' ? 'Pengumuman' : 'Berita'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getStatusColor(item.status)} variant="light">
                            {item.status === 'published' ? 'Dipublikasikan' : 
                             item.status === 'draft' ? 'Draft' : 'Diarsipkan'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getPriorityColor(item.priority)} variant="light" size="sm">
                            {item.priority === 'urgent' ? 'Mendesak' :
                             item.priority === 'high' ? 'Tinggi' :
                             item.priority === 'normal' ? 'Normal' : 'Rendah'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light" size="sm">
                            {item.target_audience === 'all' ? 'Semua' :
                             item.target_audience === 'teachers' ? 'Guru' : 'Siswa'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {dayjs(item.created_at).format('DD MMM YYYY')}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              onClick={() => openViewModal(item)}
                            >
                              <IconEye size={14} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="green"
                              onClick={() => openEditModal(item)}
                            >
                              <IconEdit size={14} />
                            </ActionIcon>
                            {item.status === 'draft' && (
                              <ActionIcon
                                variant="light"
                                color="blue"
                                onClick={() => openPublishModal(item)}
                              >
                                <IconEye size={14} />
                              </ActionIcon>
                            )}
                            {item.status === 'published' && (
                              <ActionIcon
                                variant="light"
                                color="orange"
                                onClick={() => openArchiveModal(item)}
                              >
                                <IconArchive size={14} />
                              </ActionIcon>
                            )}
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => openDeleteModal(item)}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                </Box>

                {totalPages > 1 && (
                  <Group justify="center" mt="md">
                    <Pagination
                      value={currentPage}
                      onChange={setCurrentPage}
                      total={totalPages}
                    />
                  </Group>
                )}
              </Stack>
            )}
          </Tabs.Panel>
        </Tabs>

        {/* Add Modal */}
        <Modal
          opened={addModalOpen}
          onClose={() => {
            setAddModalOpen(false);
            form.reset();
          }}
          title="Tambah Berita"
          size="lg"
        >
          <form onSubmit={form.onSubmit(handleAddItem)}>
            <Stack gap="md">
              <TextInput
                label="Judul"
                placeholder="Masukkan judul"
                required
                {...form.getInputProps('title')}
              />
              
              <Textarea
                label="Excerpt (Ringkasan)"
                placeholder="Masukkan ringkasan singkat (opsional)"
                rows={2}
                {...form.getInputProps('excerpt')}
              />
              
              <Textarea
                label="Konten"
                placeholder="Masukkan konten lengkap"
                required
                rows={6}
                {...form.getInputProps('content')}
              />
              
              <FileInput
                label="Upload Gambar"
                placeholder="Pilih file gambar (maksimal 2MB)"
                accept="image/*"
                {...form.getInputProps('image_file')}
              />
              
              <Group grow>
                <Select
                  label="Tipe"
                  data={[
                    { value: 'announcement', label: 'Pengumuman' },
                    { value: 'news', label: 'Berita' },
                  ]}
                  required
                  {...form.getInputProps('type')}
                />
                
                <Select
                  label="Status"
                  data={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Dipublikasikan' },
                  ]}
                  {...form.getInputProps('status')}
                />
              </Group>
              
              <Group grow>
                <Select
                  label="Prioritas"
                  data={[
                    { value: 'low', label: 'Rendah' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'high', label: 'Tinggi' },
                    { value: 'urgent', label: 'Mendesak' },
                  ]}
                  {...form.getInputProps('priority')}
                />
                
                <Select
                  label="Target Audience"
                  data={[
                    { value: 'all', label: 'Semua' },
                    { value: 'teachers', label: 'Guru' },
                    { value: 'students', label: 'Siswa' },
                  ]}
                  {...form.getInputProps('target_audience')}
                />
              </Group>

              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                <Text size="sm">
                  <strong>Tips:</strong><br />
                  • Gunakan URL gambar online yang valid<br />
                  • Pastikan konten informatif dan mudah dipahami<br />
                  • Pilih prioritas sesuai tingkat kepentingan
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
                  Tambah Item
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          opened={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedItem(null);
            form.reset();
          }}
          title="Edit Berita"
          size="lg"
        >
          <form onSubmit={form.onSubmit(handleUpdateItem)}>
            <Stack gap="md">
              <TextInput
                label="Judul"
                placeholder="Masukkan judul"
                required
                {...form.getInputProps('title')}
              />
              
              <Textarea
                label="Excerpt (Ringkasan)"
                placeholder="Masukkan ringkasan singkat (opsional)"
                rows={2}
                {...form.getInputProps('excerpt')}
              />
              
              <Textarea
                label="Konten"
                placeholder="Masukkan konten lengkap"
                required
                rows={6}
                {...form.getInputProps('content')}
              />
              
              <FileInput
                label="Upload Gambar"
                placeholder="Pilih file gambar (maksimal 2MB)"
                accept="image/*"
                {...form.getInputProps('image_file')}
              />
              
              <Group grow>
                <Select
                  label="Tipe"
                  data={[
                    { value: 'announcement', label: 'Pengumuman' },
                    { value: 'news', label: 'Berita' },
                  ]}
                  required
                  {...form.getInputProps('type')}
                />
                
                <Select
                  label="Status"
                  data={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Dipublikasikan' },
                    { value: 'archived', label: 'Diarsipkan' },
                  ]}
                  {...form.getInputProps('status')}
                />
              </Group>
              
              <Group grow>
                <Select
                  label="Prioritas"
                  data={[
                    { value: 'low', label: 'Rendah' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'high', label: 'Tinggi' },
                    { value: 'urgent', label: 'Mendesak' },
                  ]}
                  {...form.getInputProps('priority')}
                />
                
                <Select
                  label="Target Audience"
                  data={[
                    { value: 'all', label: 'Semua' },
                    { value: 'teachers', label: 'Guru' },
                    { value: 'students', label: 'Siswa' },
                  ]}
                  {...form.getInputProps('target_audience')}
                />
              </Group>

              <Group justify="flex-end" gap="sm">
                <Button
                  variant="light"
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedItem(null);
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

        {/* View Modal */}
        <Modal
          opened={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedItem(null);
          }}
          title={selectedItem?.title}
          size="lg"
        >
          {selectedItem && (
            <Stack gap="md">
              {newsroomService.getImageUrl(selectedItem) && (
                <Image
                  src={newsroomService.getImageUrl(selectedItem)!}
                  alt={selectedItem.title}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              
              <Group gap="md">
                <Badge color={selectedItem.type === 'announcement' ? 'purple' : 'cyan'}>
                  {selectedItem.type === 'announcement' ? 'Pengumuman' : 'Berita'}
                </Badge>
                <Badge color={getStatusColor(selectedItem.status)}>
                  {selectedItem.status === 'published' ? 'Dipublikasikan' : 
                   selectedItem.status === 'draft' ? 'Draft' : 'Diarsipkan'}
                </Badge>
                <Badge color={getPriorityColor(selectedItem.priority)}>
                  {selectedItem.priority === 'urgent' ? 'Mendesak' :
                   selectedItem.priority === 'high' ? 'Tinggi' :
                   selectedItem.priority === 'normal' ? 'Normal' : 'Rendah'}
                </Badge>
              </Group>
              
              {selectedItem.excerpt && (
                <Alert color="blue" variant="light">
                  <Text size="sm">{selectedItem.excerpt}</Text>
                </Alert>
              )}
              
              <div>
                <Text size="sm" c="dimmed" mb="xs">Konten:</Text>
                <div style={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  padding: '12px',
                  backgroundColor: 'var(--mantine-color-gray-0)',
                  borderRadius: '8px',
                }}>
                  {selectedItem.content}
                </div>
              </div>
              
              <Group gap="md" c="dimmed">
                <Group gap="xs">
                  <IconUser size={14} />
                  <Text size="sm">Dibuat oleh: {selectedItem.created_by_teacher?.full_name}</Text>
                </Group>
                <Group gap="xs">
                  <IconCalendar size={14} />
                  <Text size="sm">{dayjs(selectedItem.created_at).format('DD MMMM YYYY, HH:mm')}</Text>
                </Group>
              </Group>
            </Stack>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          opened={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedItem(null);
          }}
          onConfirm={handleDeleteItem}
          title="Hapus Item"
          message={`Apakah Anda yakin ingin menghapus "${selectedItem?.title}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Hapus"
          cancelLabel="Batal"
          confirmColor="red"
        />

        {/* Publish Confirmation Modal */}
        <ConfirmDialog
          opened={publishModalOpen}
          onClose={() => {
            setPublishModalOpen(false);
            setSelectedItem(null);
          }}
          onConfirm={handlePublishItem}
          title="Publikasikan Item"
          message={`Apakah Anda yakin ingin mempublikasikan "${selectedItem?.title}"? Item akan terlihat oleh siswa.`}
          confirmLabel="Publikasikan"
          cancelLabel="Batal"
          confirmColor="green"
        />

        {/* Archive Confirmation Modal */}
        <ConfirmDialog
          opened={archiveModalOpen}
          onClose={() => {
            setArchiveModalOpen(false);
            setSelectedItem(null);
          }}
          onConfirm={handleArchiveItem}
          title="Arsipkan Item"
          message={`Apakah Anda yakin ingin mengarsipkan "${selectedItem?.title}"? Item tidak akan terlihat oleh siswa.`}
          confirmLabel="Arsipkan"
          cancelLabel="Batal"
          confirmColor="orange"
        />
      </Stack>
    </Container>
  );
}
