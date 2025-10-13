import { Stack, Text, Button } from '@mantine/core';

interface EmptyStateProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Stack align="center" gap="md" py={60}>
      <Icon size={64} color="#adb5bd" />
      <Stack gap={4} align="center">
        <Text size="lg" fw={600}>{title}</Text>
        <Text size="sm" c="dimmed" ta="center" maw={400}>
          {description}
        </Text>
      </Stack>
      {actionLabel && onAction && (
        <Button onClick={onAction} mt="md">
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
}
