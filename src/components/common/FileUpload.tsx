import { Text, Group, Button, Stack, Progress } from '@mantine/core';
import { Dropzone, DropzoneProps } from '@mantine/dropzone';
import { IconUpload, IconX, IconFile } from '@tabler/icons-react';
import { useState } from 'react';

interface FileUploadProps extends Omit<DropzoneProps, 'children'> {
  onUpload: (files: File[]) => Promise<void>;
  loading?: boolean;
  maxFiles?: number;
  acceptedFileTypes?: Record<string, string[]>;
  maxSize?: number;
}

export function FileUpload({
  onUpload,
  loading = false,
  maxFiles = 1,
  acceptedFileTypes = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    'video/*': ['.mp4', '.avi', '.mov'],
    'audio/*': ['.mp3', '.wav'],
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  ...props
}: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleDrop = async (files: File[]) => {
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        console.error(`File ${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploadProgress(0);
    setUploadedFiles(validFiles);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      await onUpload(validFiles);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset after a short delay
      setTimeout(() => {
        setUploadProgress(0);
        setUploadedFiles([]);
      }, 1000);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress(0);
      setUploadedFiles([]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Stack gap="md">
      <Dropzone
        onDrop={handleDrop}
        onReject={(files) => console.log('rejected files', files)}
        maxFiles={maxFiles}
        accept={acceptedFileTypes}
        maxSize={maxSize}
        loading={loading}
        {...props}
      >
        <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <IconUpload
              style={{ width: 52, height: 52, color: 'var(--mantine-color-blue-6)' }}
              stroke={1.5}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX
              style={{ width: 52, height: 52, color: 'var(--mantine-color-red-6)' }}
              stroke={1.5}
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconFile
              style={{ width: 52, height: 52, color: 'var(--mantine-color-dimmed)' }}
              stroke={1.5}
            />
          </Dropzone.Idle>

          <div>
            <Text size="xl" inline>
              Drag files here or click to select files
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              Attach files up to {formatFileSize(maxSize)}
            </Text>
          </div>
        </Group>
      </Dropzone>

      {uploadProgress > 0 && (
        <Stack gap="xs">
          <Text size="sm" fw={500}>Uploading files...</Text>
          <Progress value={uploadProgress} size="sm" />
        </Stack>
      )}

      {uploadedFiles.length > 0 && (
        <Stack gap="xs">
          <Text size="sm" fw={500}>Selected files:</Text>
          {uploadedFiles.map((file, index) => (
            <Group key={index} gap="sm" p="xs" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-sm)' }}>
              <IconFile size={20} />
              <div style={{ flex: 1 }}>
                <Text size="sm" fw={500}>{file.name}</Text>
                <Text size="xs" c="dimmed">{formatFileSize(file.size)}</Text>
              </div>
            </Group>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
