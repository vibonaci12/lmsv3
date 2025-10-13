import { Center, Loader, Stack, Text } from '@mantine/core';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <Center h="100%" py={60}>
      <Stack align="center" gap="md">
        <Loader size="lg" />
        <Text c="dimmed" size="sm">{message}</Text>
      </Stack>
    </Center>
  );
}
