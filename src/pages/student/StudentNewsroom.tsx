import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Title,
  Text,
  Stack,
  Group,
  Badge,
  Modal,
  Image,
  Box,
  Button,
  Center,
  Loader,
} from '@mantine/core';
import { 
  IconFileText,
  IconClock,
  IconStar,
} from '@tabler/icons-react';
import { useStudentAuth } from '../../contexts/StudentAuthContext';
import { newsroomService, NewsroomItem } from '../../services/newsroomService';
import { LoadingSpinner } from '../../components';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';

export function StudentNewsroom() {
  const { student } = useStudentAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NewsroomItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<NewsroomItem | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  
  // Lazy loading states
  const [displayedItems, setDisplayedItems] = useState<NewsroomItem[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const itemsPerLoad = 12;
  
  // Content preview states
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  // Refs for intersection observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (student) {
      loadData();
    }
  }, [student]);

  // Initialize displayed items when items change
  useEffect(() => {
    setDisplayedItems(items.slice(0, itemsPerLoad));
    setCurrentOffset(itemsPerLoad);
    setHasMore(items.length > itemsPerLoad);
  }, [items]);

  const loadData = async () => {
    try {
      setLoading(true);
      const itemsData = await newsroomService.getItemsByType('news', true);
      setItems(itemsData);
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal memuat berita',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Lazy load more items
  const loadMoreItems = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      const nextOffset = currentOffset + itemsPerLoad;
      const newItems = items.slice(currentOffset, nextOffset);
      
      setDisplayedItems(prev => [...prev, ...newItems]);
      setCurrentOffset(nextOffset);
      setHasMore(nextOffset < items.length);
      setLoadingMore(false);
    }, 500);
  }, [currentOffset, items, itemsPerLoad, loadingMore, hasMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreItems();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadMoreItems, hasMore, loadingMore]);

  const openViewModal = (item: NewsroomItem) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };

  const toggleContentPreview = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const getContentPreview = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Get image URL for display
  const getImageUrl = (item: NewsroomItem): string | null => {
    return newsroomService.getImageUrl(item);
  };

  // Check if item has an image
  const hasImage = (item: NewsroomItem): boolean => {
    return !!(item.image_file_path || item.image_url);
  };



  if (!student) {
    return <LoadingSpinner message="Memuat data..." />;
  }

  if (loading) {
    return <LoadingSpinner message="Memuat berita..." />;
  }

  // Get featured post (most recent high priority)
  const featuredPost = displayedItems.find(item => item.priority === 'urgent' || item.priority === 'high') || displayedItems[0];
  const regularPosts = displayedItems.filter(item => item.id !== featuredPost?.id);

  return (
    <Box py="md" px="md">
      <Stack gap="lg">
        {/* CNN Style Header */}
        <Box>
          <Group justify="space-between" align="center" mb="md">
            <Box>
              <Title order={1} size="h1" fw={900} c="red" mb="xs" style={{ 
                fontFamily: 'Georgia, serif',
                letterSpacing: '-0.02em'
              }}>
                NEWSROOM
              </Title>
              <Text size="sm" c="dimmed" fw={500}>
                Informasi terbaru dan berita dari sekolah
              </Text>
            </Box>
            
            {/* News Stats */}
            <Group gap="md">
              <Text size="sm" c="dimmed" fw={500}>
                {items.length} Berita
              </Text>
            </Group>
          </Group>
          
          {/* News Stats */}
          <Group gap="xl" c="dimmed" mb="lg">
            <Text size="sm" fw={500}>
              {displayedItems.length} dari {items.length} Berita Ditampilkan
            </Text>
          </Group>
        </Box>

        {/* Main Content Layout */}
        <Group align="flex-start" gap="lg">
          {/* Main News Section */}
          <Box style={{ flex: 1 }}>
            {/* Featured Post - Vertical Layout */}
            {featuredPost && (
              <Box
                style={{ 
                  cursor: 'pointer',
                  marginBottom: '24px'
                }}
                onClick={() => openViewModal(featuredPost)}
              >
                <Stack gap="md">
                  {/* Badges */}
                  <Group gap="md">
                    <Badge 
                      color="red" 
                      variant="filled"
                      size="md"
                      radius="sm"
                      style={{ fontWeight: 700 }}
                    >
                      BERITA
                    </Badge>
                    {featuredPost.priority === 'urgent' && (
                      <Badge color="red" variant="outline" size="md" radius="sm">
                        <Group gap="xs">
                          <IconStar size={10} />
                          MENDESAK
                        </Group>
                      </Badge>
                    )}
                  </Group>
                  
                  {/* Title */}
                  <Title order={1} size="h1" fw={800} c="dark" style={{
                    fontFamily: 'Georgia, serif',
                    lineHeight: 1.2,
                    fontSize: '32px'
                  }}>
                    {featuredPost.title}
                  </Title>
                  
                  {/* Image */}
                  {hasImage(featuredPost) && getImageUrl(featuredPost) ? (
                    <Box style={{ 
                      width: '100%',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <Image
                        src={getImageUrl(featuredPost)!}
                        alt={featuredPost.title}
                        style={{ 
                          width: '100%',
                          height: 'auto',
                          maxHeight: '500px',
                          objectFit: 'contain',
                          display: 'block'
                        }}
                        onError={(e) => {
                          console.log('Image failed to load:', getImageUrl(featuredPost));
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', getImageUrl(featuredPost));
                        }}
                      />
                    </Box>
                  ) : (
                    <Box style={{ 
                      height: '400px', 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed #dee2e6'
                    }}>
                      <Stack align="center" gap="md">
                        <IconFileText size={48} color="#6c757d" />
                        <Text c="dimmed" size="sm">
                          {featuredPost.image_url ? 'Gambar tidak dapat dimuat' : 'Tidak ada gambar'}
                        </Text>
                        {featuredPost.image_url && (
                          <Text c="dimmed" size="xs" ta="center">
                            URL: {featuredPost.image_url}
                          </Text>
                        )}
                      </Stack>
                    </Box>
                  )}
                  
                  {/* Content */}
                  <Box>
                    {/* Excerpt */}
                    {featuredPost.excerpt && (
                      <Text size="lg" c="dimmed" mb="md" style={{ lineHeight: 1.6, fontStyle: 'italic' }}>
                        {featuredPost.excerpt}
                      </Text>
                    )}
                    
                    {/* Content Preview */}
                    <Box mb="md">
                      <Text size="md" c="dark" style={{ lineHeight: 1.6 }}>
                        {expandedItems.has(featuredPost.id) 
                          ? featuredPost.content 
                          : getContentPreview(featuredPost.content, 300)
                        }
                      </Text>
                      {featuredPost.content.length > 300 && (
                        <Button
                          variant="subtle"
                          color="red"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleContentPreview(featuredPost.id);
                          }}
                          style={{ marginTop: '8px', padding: 0 }}
                        >
                          {expandedItems.has(featuredPost.id) ? 'Tampilkan Lebih Sedikit' : 'Baca Selengkapnya'}
                        </Button>
                      )}
                    </Box>
                    
                    {/* Meta Info */}
                    <Group gap="md" c="dimmed">
                      <Group gap="xs">
                        <Text size="sm" fw={600}>
                          {featuredPost.created_by_teacher?.full_name}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <IconClock size={14} />
                        <Text size="sm">
                          {dayjs(featuredPost.published_at || featuredPost.created_at).format('DD MMM YYYY')}
                        </Text>
                      </Group>
                    </Group>
                  </Box>
                </Stack>
              </Box>
            )}

            {/* Other News - Vertical Layout */}
            {regularPosts.length > 0 && (
              <Stack gap="lg">
                {regularPosts.map((item) => (
                  <Box
                    key={item.id}
                    style={{ 
                      cursor: 'pointer',
                      padding: '16px 0',
                      borderBottom: '1px solid #f0f0f0'
                    }}
                    onClick={() => openViewModal(item)}
                  >
                    <Stack gap="md">
                      {/* Badges */}
                      <Group gap="md">
                        <Badge 
                          color="red" 
                          variant="filled"
                          size="sm"
                          radius="sm"
                          style={{ fontWeight: 700 }}
                        >
                          BERITA
                        </Badge>
                        {item.priority === 'urgent' && (
                          <Badge color="red" variant="outline" size="sm" radius="sm">
                            <Group gap="xs">
                              <IconStar size={8} />
                              MENDESAK
                            </Group>
                          </Badge>
                        )}
                      </Group>
                      
                      {/* Title */}
                      <Title order={3} size="h3" fw={700} c="dark" style={{
                        fontFamily: 'Georgia, serif',
                        lineHeight: 1.3,
                        fontSize: '20px'
                      }}>
                        {item.title}
                      </Title>
                      
                      {/* Image */}
                      {hasImage(item) && getImageUrl(item) ? (
                        <Box style={{ 
                          width: '100%',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          <Image
                            src={getImageUrl(item)!}
                            alt={item.title}
                            style={{ 
                              width: '100%',
                              height: 'auto',
                              maxHeight: '300px',
                              objectFit: 'contain',
                              display: 'block'
                            }}
                            onError={(e) => {
                              console.log('Image failed to load:', getImageUrl(item));
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('Image loaded successfully:', getImageUrl(item));
                            }}
                          />
                        </Box>
                      ) : (
                        <Box style={{ 
                          height: '250px', 
                          backgroundColor: '#f8f9fa', 
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px dashed #dee2e6'
                        }}>
                          <Stack align="center" gap="sm">
                            <IconFileText size={32} color="#6c757d" />
                            <Text c="dimmed" size="xs">
                              {item.image_url ? 'Gambar tidak dapat dimuat' : 'Tidak ada gambar'}
                            </Text>
                            {item.image_url && (
                              <Text c="dimmed" size="xs" ta="center" style={{ fontSize: '10px' }}>
                                {item.image_url.length > 50 ? item.image_url.substring(0, 50) + '...' : item.image_url}
                              </Text>
                            )}
                          </Stack>
                        </Box>
                      )}
                      
                      {/* Content */}
                      <Box>
                        {/* Excerpt */}
                        {item.excerpt && (
                          <Text size="md" c="dimmed" mb="md" style={{ lineHeight: 1.5, fontStyle: 'italic' }}>
                            {item.excerpt}
                          </Text>
                        )}
                        
                        {/* Content Preview */}
                        <Box mb="md">
                          <Text size="sm" c="dark" style={{ lineHeight: 1.5 }}>
                            {expandedItems.has(item.id) 
                              ? item.content 
                              : getContentPreview(item.content, 200)
                            }
                          </Text>
                          {item.content.length > 200 && (
                            <Button
                              variant="subtle"
                              color="red"
                              size="xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleContentPreview(item.id);
                              }}
                              style={{ marginTop: '6px', padding: 0 }}
                            >
                              {expandedItems.has(item.id) ? 'Tampilkan Lebih Sedikit' : 'Baca Selengkapnya'}
                            </Button>
                          )}
                        </Box>
                        
                        {/* Meta Info */}
                        <Group gap="md" c="dimmed">
                          <Group gap="xs">
                            <Text size="sm" fw={600}>
                              {item.created_by_teacher?.full_name}
                            </Text>
                          </Group>
                          <Group gap="xs">
                            <IconClock size={14} />
                            <Text size="sm">
                              {dayjs(item.published_at || item.created_at).format('DD MMM YYYY')}
                            </Text>
                          </Group>
                        </Group>
                      </Box>
                    </Stack>
                  </Box>
                ))}

                {/* Lazy Loading Trigger */}
                {hasMore && (
                  <Box ref={loadMoreRef} py="xl">
                    <Center>
                      {loadingMore ? (
                        <Group gap="md">
                          <Loader size="sm" color="red" />
                          <Text size="sm" c="dimmed">Memuat artikel lainnya...</Text>
                        </Group>
                      ) : (
                        <Button
                          variant="outline"
                          color="red"
                          onClick={loadMoreItems}
                          style={{ fontWeight: 600 }}
                        >
                          Muat Lebih Banyak
                        </Button>
                      )}
                    </Center>
                  </Box>
                )}

                {/* End of Content */}
                {!hasMore && displayedItems.length > 0 && (
                  <Center py="xl">
                    <Text size="sm" c="dimmed">
                      Semua artikel telah dimuat ({displayedItems.length} dari {items.length})
                    </Text>
                  </Center>
                )}
              </Stack>
            )}
          </Box>

          {/* Sidebar - Small News Boxes */}
          <Box style={{ width: '300px', flexShrink: 0 }}>
            <Stack gap="md">
              <Title order={4} size="h4" fw={700} c="dark" mb="md" style={{
                fontFamily: 'Georgia, serif',
                borderBottom: '2px solid #dc3545',
                paddingBottom: '8px'
              }}>
                Berita Lainnya
              </Title>
              
                {displayedItems.slice(0, 5).map((item) => (
                <Box
                  key={item.id}
                  style={{ 
                    cursor: 'pointer',
                    padding: '12px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e5e5',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => openViewModal(item)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.borderColor = '#dc3545';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#e5e5e5';
                  }}
                >
                  <Stack gap="xs">
                    {/* Badge */}
                    <Badge 
                      color="red" 
                      variant="filled"
                      size="xs"
                      radius="sm"
                      style={{ fontWeight: 700, width: 'fit-content' }}
                    >
                      BERITA
                    </Badge>
                    
                    {/* Title */}
                    <Title order={5} size="h5" fw={600} lineClamp={2} c="dark" style={{
                      fontFamily: 'Georgia, serif',
                      lineHeight: 1.3,
                      fontSize: '14px'
                    }}>
                      {item.title}
                    </Title>
                    
                    {/* Meta Info */}
                    <Group gap="xs" c="dimmed">
                      <IconClock size={10} />
                      <Text size="xs">
                        {dayjs(item.published_at || item.created_at).format('DD MMM YYYY')}
                      </Text>
                    </Group>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        </Group>

        {/* CNN Style Article Modal */}
        <Modal
          opened={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedItem(null);
          }}
          size="xl"
          padding={0}
          radius="md"
        >
          {selectedItem && (
            <Box>
              {/* Hero Image */}
              {hasImage(selectedItem) && getImageUrl(selectedItem) ? (
                <Box style={{ 
                  height: '400px', 
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <Image
                    src={getImageUrl(selectedItem)!}
                    alt={selectedItem.title}
                    height="100%"
                    style={{ 
                      objectFit: 'cover',
                      width: '100%',
                      maxWidth: '100%',
                      height: 'auto',
                      minHeight: '400px'
                    }}
                    onError={(e) => {
                      console.log('Modal image failed to load:', getImageUrl(selectedItem));
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('Modal image loaded successfully:', getImageUrl(selectedItem));
                    }}
                  />
                </Box>
              ) : hasImage(selectedItem) ? (
                <Box style={{ 
                  height: '400px', 
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed #dee2e6'
                }}>
                  <Stack align="center" gap="md">
                    <IconFileText size={48} color="#6c757d" />
                    <Text c="dimmed" size="sm">Gambar tidak dapat dimuat</Text>
                    <Text c="dimmed" size="xs" ta="center">
                      URL: {selectedItem.image_url}
                    </Text>
                  </Stack>
                </Box>
              ) : null}
              
              {/* Content */}
              <Box p="xl">
                <Stack gap="lg">
                  {/* Header */}
                  <Box>
                    <Group gap="md" mb="md">
                      <Badge 
                        color="red" 
                        variant="filled"
                        size="md"
                        radius="sm"
                        style={{ fontWeight: 700 }}
                      >
                        BERITA
                      </Badge>
                      {selectedItem.priority === 'urgent' && (
                        <Badge color="red" variant="outline" size="md" radius="sm">
                          <Group gap="xs">
                            <IconStar size={10} />
                            MENDESAK
                          </Group>
                        </Badge>
                      )}
                    </Group>
                    
                    <Title order={1} size="h1" fw={800} mb="md" c="dark" style={{
                      fontFamily: 'Georgia, serif',
                      lineHeight: 1.2,
                      fontSize: '32px'
                    }}>
                      {selectedItem.title}
                    </Title>
                    
                    {/* Meta Info */}
                    <Group gap="xl" c="dimmed" mb="lg" style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: '16px' }}>
                      <Group gap="xs">
                        <Text size="sm" fw={600}>
                          {selectedItem.created_by_teacher?.full_name}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <IconClock size={14} />
                        <Text size="sm">
                          {dayjs(selectedItem.published_at || selectedItem.created_at).format('DD MMMM YYYY, HH:mm')}
                        </Text>
                      </Group>
                    </Group>
                  </Box>
                  
                  {/* Excerpt */}
                  {selectedItem.excerpt && (
                    <Box style={{ 
                      backgroundColor: '#f8f9fa',
                      padding: '16px',
                      borderRadius: '6px',
                      borderLeft: '4px solid #dc3545'
                    }}>
                      <Text size="lg" fw={500} c="dark" style={{ lineHeight: 1.5 }}>
                        {selectedItem.excerpt}
                      </Text>
                    </Box>
                  )}
                  
                  {/* Content */}
                  <Box>
                    <div style={{ 
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.7,
                      fontSize: '18px',
                      color: '#333',
                      fontFamily: 'Georgia, serif'
                    }}>
                      {selectedItem.content}
                    </div>
                  </Box>
                  
                  {/* Footer */}
                  <Box pt="md" style={{ borderTop: '1px solid #e5e5e5' }}>
                    <Group justify="space-between" align="center">
                      <Text size="sm" c="dimmed">
                        Dipublikasikan pada {dayjs(selectedItem.published_at || selectedItem.created_at).format('DD MMMM YYYY')}
                      </Text>
                      <Button 
                        variant="outline" 
                        color="red"
                        onClick={() => setViewModalOpen(false)}
                        style={{ fontWeight: 600 }}
                      >
                        Tutup
                      </Button>
                    </Group>
                  </Box>
                </Stack>
              </Box>
            </Box>
          )}
        </Modal>
      </Stack>
    </Box>
  );
}
