import { Modal, Button, Text, Stack, Group } from '@mantine/core';
import { AlertTriangle } from 'lucide-react';
import { ReactNode } from 'react';

interface ConfirmDialogProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  loading?: boolean;
  confirmLoading?: boolean;
  closeOnConfirm?: boolean;
}

export function ConfirmDialog({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'red',
  loading = false,
  confirmLoading = false,
  closeOnConfirm = true,
}: ConfirmDialogProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <AlertTriangle size={20} color="var(--mantine-color-orange-6)" />
          <Text fw={600}>{title}</Text>
        </Group>
      }
      centered
      size="sm"
    >
      <Stack gap="md">
        {typeof message === 'string' ? (
          <Text size="sm" c="dimmed">
            {message}
          </Text>
        ) : (
          message
        )}
        
        <Group justify="flex-end" gap="sm">
          <Button
            variant="subtle"
            onClick={onClose}
            disabled={loading || confirmLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            color={confirmColor}
            onClick={() => {
              onConfirm();
              if (closeOnConfirm) {
                onClose();
              }
            }}
            loading={confirmLoading}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
