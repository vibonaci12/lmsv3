import { supabase } from '../lib/supabase';
import { compressImage, isImageFile, validateImageFile } from '../utils/imageCompression';

export interface NewsroomItem {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  image_url?: string; // Keep for backward compatibility
  image_file_name?: string;
  image_file_path?: string;
  image_file_size?: number;
  type: 'announcement' | 'news';
  status: 'draft' | 'published' | 'archived';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  target_audience?: 'all' | 'teachers' | 'students';
  published_at?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
  created_by_teacher?: {
    full_name: string;
    email: string;
  };
  updated_by_teacher?: {
    full_name: string;
    email: string;
  };
}

export interface CreateNewsroomItem {
  title: string;
  content: string;
  excerpt?: string;
  image_file?: File;
  type: 'announcement' | 'news';
  status?: 'draft' | 'published' | 'archived';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  target_audience?: 'all' | 'teachers' | 'students';
}

export interface UpdateNewsroomItem {
  id: string;
  title?: string;
  content?: string;
  excerpt?: string;
  image_file?: File;
  type?: 'announcement' | 'news';
  status?: 'draft' | 'published' | 'archived';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  target_audience?: 'all' | 'teachers' | 'students';
}

// Helper function to upload image to Supabase Storage
async function uploadImage(file: File, itemId: string): Promise<{ filePath: string; fileName: string; fileSize: number }> {
  // Validate image file
  const validation = validateImageFile(file, 2000); // 2MB max
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid image file');
  }

  let fileToUpload = file;

  // Compress image if it's an image file
  if (isImageFile(file)) {
    try {
      fileToUpload = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        maxSizeKB: 500
      });
    } catch (error) {
      console.warn('Failed to compress image, using original:', error);
      // Continue with original file if compression fails
    }
  }

  const fileExt = fileToUpload.name.split('.').pop();
  const fileName = `${itemId}.${fileExt}`;
  const filePath = `newsroom/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('newsroom-images')
    .upload(filePath, fileToUpload, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  return {
    filePath,
    fileName: fileToUpload.name,
    fileSize: fileToUpload.size
  };
}

// Helper function to delete image from Supabase Storage
async function deleteImage(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('newsroom-images')
    .remove([filePath]);

  if (error) {
    console.error('Failed to delete image:', error);
    // Don't throw error as the main operation should continue
  }
}

// Helper function to get public URL for image
function getImageUrl(filePath: string): string {
  const { data } = supabase.storage
    .from('newsroom-images')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

export const newsroomService = {
  // Get all newsroom items (for teachers - includes drafts)
  async getAllItems(): Promise<NewsroomItem[]> {
    // First, get all newsroom items
    const { data: newsroomData, error: newsroomError } = await supabase
      .from('newsroom')
      .select('*')
      .order('created_at', { ascending: false });

    if (newsroomError) {
      console.error('Error loading newsroom items:', newsroomError);
      throw newsroomError;
    }

    if (!newsroomData || newsroomData.length === 0) {
      return [];
    }

    // Get unique teacher IDs
    const teacherIds = [...new Set([
      ...newsroomData.map(item => item.created_by).filter(Boolean),
      ...newsroomData.map(item => item.updated_by).filter(Boolean)
    ])];

    // Fetch teacher data separately
    const { data: teachersData, error: teachersError } = await supabase
      .from('teachers')
      .select('id, full_name, email')
      .in('id', teacherIds);

    if (teachersError) {
      console.error('Error loading teachers:', teachersError);
    }

    // Create a map of teacher data
    const teachersMap = new Map();
    (teachersData || []).forEach(teacher => {
      teachersMap.set(teacher.id, teacher);
    });

    // Combine the data
    const combinedData = newsroomData.map(item => ({
      ...item,
      created_by_teacher: teachersMap.get(item.created_by) || null,
      updated_by_teacher: teachersMap.get(item.updated_by) || null
    }));

    return combinedData;
  },

  // Get published items only (for students)
  async getPublishedItems(): Promise<NewsroomItem[]> {
    const { data, error } = await supabase
      .from('newsroom')
      .select(`
        *,
        created_by_teacher:teachers!newsroom_created_by_fkey(full_name, email),
        updated_by_teacher:teachers!newsroom_updated_by_fkey(full_name, email)
      `)
      .eq('status', 'published')
      .in('target_audience', ['all', 'students'])
      .order('published_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get items by type
  async getItemsByType(type: 'announcement' | 'news', publishedOnly: boolean = false): Promise<NewsroomItem[]> {
    let query = supabase
      .from('newsroom')
      .select(`
        *,
        teachers!newsroom_created_by_fkey(full_name, email)
      `)
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (publishedOnly) {
      query = query.eq('status', 'published').in('target_audience', ['all', 'students']);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Transform data to match interface
    const transformedData = (data || []).map(item => ({
      ...item,
      created_by_teacher: item.teachers
    }));
    
    return transformedData;
  },

  // Get single item by ID
  async getItemById(id: string): Promise<NewsroomItem> {
    const { data, error } = await supabase
      .from('newsroom')
      .select(`
        *,
        created_by_teacher:teachers!newsroom_created_by_fkey(full_name, email),
        updated_by_teacher:teachers!newsroom_updated_by_fkey(full_name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new item
  async createItem(item: CreateNewsroomItem, createdBy: string): Promise<NewsroomItem> {
    // First, create the item in database to get the ID
    const { data: newItem, error: insertError } = await supabase
      .from('newsroom')
      .insert({
        title: item.title,
        content: item.content,
        excerpt: item.excerpt,
        type: item.type,
        status: item.status || 'draft',
        priority: item.priority || 'normal',
        target_audience: item.target_audience || 'all',
        created_by: createdBy,
        updated_by: createdBy,
      })
      .select(`
        *,
        created_by_teacher:teachers!newsroom_created_by_fkey(full_name, email),
        updated_by_teacher:teachers!newsroom_updated_by_fkey(full_name, email)
      `)
      .single();

    if (insertError) throw insertError;

    // Upload image if provided
    if (item.image_file) {
      try {
        const imageData = await uploadImage(item.image_file, newItem.id);
        
        // Update the item with image data
        const { error: updateError } = await supabase
          .from('newsroom')
          .update({
            image_file_name: imageData.fileName,
            image_file_path: imageData.filePath,
            image_file_size: imageData.fileSize,
          })
          .eq('id', newItem.id);

        if (updateError) {
          console.error('Failed to update image data:', updateError);
          // Don't throw error, just log it
        }
      } catch (uploadError) {
        console.error('Failed to upload image:', uploadError);
        // Don't throw error, just log it
      }
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      teacher_id: createdBy,
      action: 'create',
      entity_type: 'newsroom',
      entity_id: newItem.id,
      description: `Created ${item.type}: ${item.title}`,
    });

    // Return the final item with image data
    const { data: finalItem, error: fetchError } = await supabase
      .from('newsroom')
      .select(`
        *,
        created_by_teacher:teachers!newsroom_created_by_fkey(full_name, email),
        updated_by_teacher:teachers!newsroom_updated_by_fkey(full_name, email)
      `)
      .eq('id', newItem.id)
      .single();

    if (fetchError) throw fetchError;
    return finalItem;
  },

  // Update item
  async updateItem(item: UpdateNewsroomItem, updatedBy: string): Promise<NewsroomItem> {
    // Get current item to check for existing image
    const { data: currentItem, error: fetchError } = await supabase
      .from('newsroom')
      .select('image_file_path, image_file_name, image_file_size')
      .eq('id', item.id)
      .single();

    if (fetchError) throw fetchError;

    let imageData = null;
    
    // Upload new image if provided
    if (item.image_file) {
      // Delete old image if exists
      if (currentItem.image_file_path) {
        await deleteImage(currentItem.image_file_path);
      }
      
      // Upload new image
      imageData = await uploadImage(item.image_file, item.id);
    }

    const updateData: any = {
      ...item,
      updated_by: updatedBy,
    };

    // Only update image fields if new image was uploaded
    if (imageData) {
      updateData.image_file_name = imageData.fileName;
      updateData.image_file_path = imageData.filePath;
      updateData.image_file_size = imageData.fileSize;
      // Clear old image_url if new file is uploaded
      updateData.image_url = null;
    }

    // Remove image_file from update data as it's not a database field
    delete updateData.image_file;

    const { data, error } = await supabase
      .from('newsroom')
      .update(updateData)
      .eq('id', item.id)
      .select(`
        *,
        created_by_teacher:teachers!newsroom_created_by_fkey(full_name, email),
        updated_by_teacher:teachers!newsroom_updated_by_fkey(full_name, email)
      `)
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('activity_logs').insert({
      teacher_id: updatedBy,
      action: 'update',
      entity_type: 'newsroom',
      entity_id: item.id,
      description: `Updated ${data.type}: ${data.title}`,
    });

    return data;
  },

  // Delete item
  async deleteItem(id: string, deletedBy: string): Promise<void> {
    // Get item info for logging and image deletion
    const { data: item, error: fetchError } = await supabase
      .from('newsroom')
      .select('title, type, image_file_path, image_file_name, image_file_size')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Delete image if exists
    if (item.image_file_path) {
      await deleteImage(item.image_file_path);
    }

    const { error } = await supabase
      .from('newsroom')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log activity
    await supabase.from('activity_logs').insert({
      teacher_id: deletedBy,
      action: 'delete',
      entity_type: 'newsroom',
      entity_id: id,
      description: `Deleted ${item.type}: ${item.title}`,
    });
  },

  // Publish item
  async publishItem(id: string, publishedBy: string): Promise<NewsroomItem> {
    const { data, error } = await supabase
      .from('newsroom')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_by: publishedBy,
      })
      .eq('id', id)
      .select(`
        *,
        created_by_teacher:teachers!newsroom_created_by_fkey(full_name, email),
        updated_by_teacher:teachers!newsroom_updated_by_fkey(full_name, email)
      `)
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('activity_logs').insert({
      teacher_id: publishedBy,
      action: 'publish',
      entity_type: 'newsroom',
      entity_id: id,
      description: `Published ${data.type}: ${data.title}`,
    });

    return data;
  },

  // Archive item
  async archiveItem(id: string, archivedBy: string): Promise<NewsroomItem> {
    const { data, error } = await supabase
      .from('newsroom')
      .update({
        status: 'archived',
        updated_by: archivedBy,
      })
      .eq('id', id)
      .select(`
        *,
        created_by_teacher:teachers!newsroom_created_by_fkey(full_name, email),
        updated_by_teacher:teachers!newsroom_updated_by_fkey(full_name, email)
      `)
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('activity_logs').insert({
      teacher_id: archivedBy,
      action: 'archive',
      entity_type: 'newsroom',
      entity_id: id,
      description: `Archived ${data.type}: ${data.title}`,
    });

    return data;
  },

  // Get statistics
  async getStatistics(): Promise<{
    total: number;
    published: number;
    draft: number;
    archived: number;
    announcements: number;
    news: number;
  }> {
    const { data, error } = await supabase
      .from('newsroom')
      .select('status, type');

    if (error) throw error;

    const stats = {
      total: data.length,
      published: data.filter(item => item.status === 'published').length,
      draft: data.filter(item => item.status === 'draft').length,
      archived: data.filter(item => item.status === 'archived').length,
      announcements: data.filter(item => item.type === 'announcement').length,
      news: data.filter(item => item.type === 'news').length,
    };

    return stats;
  },

  // Helper function to get image URL (for backward compatibility)
  getImageUrl(item: NewsroomItem): string | null {
    if (item.image_file_path) {
      return getImageUrl(item.image_file_path);
    }
    if (item.image_url) {
      return item.image_url;
    }
    return null;
  },
};