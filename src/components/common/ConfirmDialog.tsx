import { Modal, Button, Text, Stack, Group } from '@mantine/core';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  loading?: boolean;
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
        <Text size="sm" c="dimmed">
          {message}
        </Text>
        
        <Group justify="flex-end" gap="sm">
          <Button
            variant="subtle"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            color={confirmColor}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
