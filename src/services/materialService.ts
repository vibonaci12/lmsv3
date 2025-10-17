import { supabase } from '../lib/supabase';
import { Material } from '../types';

export const materialService = {
  // Get materials by class (for class-specific materials)
  async getMaterialsByClass(classId: string) {
    const { data, error } = await supabase
      .from('materials')
      .select(`
        *,
        teachers!materials_created_by_fkey(full_name),
        class:classes(name, grade)
      `)
      .eq('class_id', classId)
      .eq('material_type', 'class')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform data to match interface
    const transformedData = (data || []).map(item => ({
      ...item,
      created_by_teacher: item.teachers,
      class_info: item.class
    }));
    
    return transformedData;
  },

  // Get materials by grade (for grade-based materials)
  async getMaterialsByGrade(grade: string) {
    const { data, error } = await supabase
      .from('materials')
      .select(`
        *,
        teachers!materials_created_by_fkey(full_name)
      `)
      .eq('target_grade', grade)
      .eq('material_type', 'grade')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform data to match interface
    const transformedData = (data || []).map(item => ({
      ...item,
      created_by_teacher: item.teachers
    }));
    
    return transformedData;
  },

  // Get all materials for a student (both class and grade-based)
  async getMaterialsForStudent(studentId: string) {
    // Get student's grade from their enrolled classes
    const { data: studentClasses, error: classError } = await supabase
      .from('class_students')
      .select(`
        class_id,
        class:classes(grade)
      `)
      .eq('student_id', studentId);

    if (classError) throw classError;

    const grades = [...new Set(studentClasses?.map((sc: any) => sc.class?.grade).filter(Boolean))];
    const classIds = studentClasses?.map(sc => sc.class_id) || [];

    // Get class-based materials
    const { data: classMaterials, error: classMaterialsError } = await supabase
      .from('materials')
      .select(`
        *,
        teachers!materials_created_by_fkey(full_name),
        class:classes(name, grade)
      `)
      .in('class_id', classIds)
      .eq('material_type', 'class')
      .order('created_at', { ascending: false });

    if (classMaterialsError) throw classMaterialsError;

    // Get grade-based materials
    const { data: gradeMaterials, error: gradeMaterialsError } = await supabase
      .from('materials')
      .select(`
        *,
        teachers!materials_created_by_fkey(full_name)
      `)
      .in('target_grade', grades)
      .eq('material_type', 'grade')
      .order('created_at', { ascending: false });

    if (gradeMaterialsError) throw gradeMaterialsError;

    // Combine and transform data
    const allMaterials = [
      ...(classMaterials || []).map(item => ({
        ...item,
        created_by_teacher: item.teachers,
        class_info: item.class,
        material_type: 'class'
      })),
      ...(gradeMaterials || []).map(item => ({
        ...item,
        created_by_teacher: item.teachers,
        material_type: 'grade'
      }))
    ];

    // Sort by creation date
    allMaterials.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return allMaterials;
  },

  async getMaterialById(materialId: string) {
    const { data, error } = await supabase
      .from('materials')
      .select(`
        *,
        class:classes(name, grade, subject),
        created_by_teacher:teachers!materials_created_by_fkey(full_name),
        updated_by_teacher:teachers!materials_updated_by_fkey(full_name)
      `)
      .eq('id', materialId)
      .single();

    if (error) throw error;
    return data;
  },

  async uploadMaterial(
    materialData: {
      class_id: string;
      title: string;
      description?: string;
      file_url: string;
      file_name?: string;
      file_type?: string;
      file_size?: number;
    },
    createdBy: string
  ) {
    const { data, error } = await supabase
      .from('materials')
      .insert({
        ...materialData,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      teacher_id: createdBy,
      action: 'create',
      entity_type: 'material',
      entity_id: data.id,
      description: `Uploaded material ${materialData.title}`,
    });

    // Notify students in the class
    const { data: classStudents } = await supabase
      .from('class_students')
      .select('student_id')
      .eq('class_id', materialData.class_id);

    if (classStudents && classStudents.length > 0) {
      const notifications = classStudents.map((cs) => ({
        user_id: cs.student_id,
        user_type: 'student' as const,
        title: 'Materi Baru',
        message: `Materi "${materialData.title}" telah diupload`,
        link: `/student/classes/${materialData.class_id}`,
      }));

      await supabase.from('notifications').insert(notifications);
    }

    return data;
  },

  async updateMaterial(
    materialId: string,
    updates: Partial<Material>,
    updatedBy: string
  ) {
    const { data, error } = await supabase
      .from('materials')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      })
      .eq('id', materialId)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      teacher_id: updatedBy,
      action: 'update',
      entity_type: 'material',
      entity_id: materialId,
      description: `Updated material ${data.title}`,
    });

    return data;
  },

  async deleteMaterial(materialId: string, deletedBy?: string) {
    const { data: material } = await supabase
      .from('materials')
      .select('title')
      .eq('id', materialId)
      .single();

    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', materialId);

    if (error) throw error;

    if (deletedBy) {
      await supabase.from('activity_logs').insert({
        teacher_id: deletedBy,
        action: 'delete',
        entity_type: 'material',
        entity_id: materialId,
        description: `Deleted material ${material?.title || ''}`,
      });
    }
  },

  async uploadFile(file: File, bucket: string = 'materials'): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${bucket}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async deleteFile(fileUrl: string, bucket: string = 'materials') {
    // Extract file path from URL
    const urlParts = fileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `${bucket}/${fileName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
  },

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  getFileIcon(fileType?: string): string {
    if (!fileType) return '📄';
    
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return '📕';
    if (type.includes('word') || type.includes('doc')) return '📘';
    if (type.includes('excel') || type.includes('sheet')) return '📗';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📙';
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    
    return '📄';
  },

  // Get all materials (for teachers)
  async getAllMaterials() {
    const { data, error } = await supabase
      .from('materials')
      .select(`
        *,
        class:classes(name, grade),
        teachers!materials_created_by_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform data to match interface
    const transformedData = (data || []).map(item => ({
      ...item,
      created_by_teacher: item.teachers,
      class_info: item.class
    }));
    
    return transformedData;
  },

  // Create new material
  async createMaterial(material: {
    title: string;
    description?: string;
    file_url: string;
    file_name: string;
    file_type: string;
    file_size: number;
    material_type: 'class' | 'grade';
    class_id?: string;
    target_grade?: string;
  }, createdBy: string) {
    const { data, error } = await supabase
      .from('materials')
      .insert({
        ...material,
        created_by: createdBy,
        updated_by: createdBy,
      })
      .select(`
        *,
        teachers!materials_created_by_fkey(full_name),
        class:classes(name, grade)
      `)
      .single();

    if (error) throw error;
    
    // Transform data to match interface
    return {
      ...data,
      created_by_teacher: data.teachers,
      class_info: data.class
    };
  },

};
