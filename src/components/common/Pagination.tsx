import { useState, useEffect } from 'react';
import {
  Group,
  Button,
  Text,
  Select,
  ActionIcon,
  NumberInput,
  Paper,
  Center
} from '@mantine/core';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight
} from '@tabler/icons-react';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  showItemsPerPage?: boolean;
  showTotal?: boolean;
  showPageInput?: boolean;
  itemsPerPageOptions?: number[];
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'outline' | 'light' | 'filled' | 'subtle';
  color?: string;
  disabled?: boolean;
  className?: string;
}

export function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  showTotal = true,
  showPageInput = false,
  itemsPerPageOptions = [10, 25, 50, 100],
  size = 'sm',
  variant = 'light',
  color = 'blue',
  disabled = false,
  className
}: PaginationProps) {
  const [pageInput, setPageInput] = useState(currentPage);
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  useEffect(() => {
    setPageInput(currentPage);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && !disabled) {
      onPageChange(page);
    }
  };

  const handlePageInputChange = (value: string | number) => {
    const page = typeof value === 'string' ? parseInt(value) : value;
    if (page >= 1 && page <= totalPages) {
      handlePageChange(page);
    }
  };

  const handleItemsPerPageChange = (value: string | null) => {
    if (value && onItemsPerPageChange) {
      const newItemsPerPage = parseInt(value);
      onItemsPerPageChange(newItemsPerPage);
      // Reset to first page when changing items per page
      onPageChange(1);
    }
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalItems === 0) {
    return (
      <Paper p="md" withBorder radius="md">
        <Center>
          <Text size="sm" c="dimmed">No data to display</Text>
        </Center>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder radius="md" className={className}>
      <Group justify="space-between" align="center">
        {/* Left side - Items info and per page selector */}
        <Group gap="md">
          {showTotal && (
            <Text size="sm" c="dimmed">
              Showing {startItem} to {endItem} of {totalItems} items
            </Text>
          )}
          
          {showItemsPerPage && onItemsPerPageChange && (
            <Group gap="xs" align="center">
              <Text size="sm">Items per page:</Text>
              <Select
                value={itemsPerPage.toString()}
                onChange={handleItemsPerPageChange}
                data={itemsPerPageOptions.map(option => ({
                  value: option.toString(),
                  label: option.toString()
                }))}
                size={size}
                variant={variant}
                color={color}
                disabled={disabled}
                style={{ width: 80 }}
              />
            </Group>
          )}
        </Group>

        {/* Right side - Pagination controls */}
        <Group gap="xs">
          {/* First page */}
          <ActionIcon
            variant={variant}
            color={color}
            size={size}
            onClick={() => handlePageChange(1)}
            disabled={disabled || currentPage === 1}
            aria-label="First page"
          >
            <IconChevronsLeft size={16} />
          </ActionIcon>

          {/* Previous page */}
          <ActionIcon
            variant={variant}
            color={color}
            size={size}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={disabled || currentPage === 1}
            aria-label="Previous page"
          >
            <IconChevronLeft size={16} />
          </ActionIcon>

          {/* Page numbers */}
          {getVisiblePages().map((page, index) => (
            <div key={index}>
              {page === '...' ? (
                <Text size="sm" c="dimmed" px="xs">
                  ...
                </Text>
              ) : (
                <Button
                  variant={currentPage === page ? 'filled' : variant}
                  color={currentPage === page ? color : 'gray'}
                  size={size}
                  onClick={() => handlePageChange(page as number)}
                  disabled={disabled}
                  aria-label={`Page ${page}`}
                  style={{ minWidth: 40 }}
                >
                  {page}
                </Button>
              )}
            </div>
          ))}

          {/* Next page */}
          <ActionIcon
            variant={variant}
            color={color}
            size={size}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={disabled || currentPage === totalPages}
            aria-label="Next page"
          >
            <IconChevronRight size={16} />
          </ActionIcon>

          {/* Last page */}
          <ActionIcon
            variant={variant}
            color={color}
            size={size}
            onClick={() => handlePageChange(totalPages)}
            disabled={disabled || currentPage === totalPages}
            aria-label="Last page"
          >
            <IconChevronsRight size={16} />
          </ActionIcon>

          {/* Page input (optional) */}
          {showPageInput && (
            <Group gap="xs" align="center">
              <Text size="sm">Go to:</Text>
              <NumberInput
                value={pageInput}
                onChange={setPageInput}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handlePageInputChange(pageInput);
                  }
                }}
                min={1}
                max={totalPages}
                size={size}
                variant={variant}
                color={color}
                disabled={disabled}
                style={{ width: 60 }}
                hideControls
              />
            </Group>
          )}
        </Group>
      </Group>
    </Paper>
  );
}

// Hook for pagination logic
export function usePagination<T>(
  data: T[],
  initialItemsPerPage: number = 10,
  initialPage: number = 1
) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  const resetPagination = () => {
    setCurrentPage(1);
  };

  return {
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    paginatedData,
    handlePageChange,
    handleItemsPerPageChange,
    resetPagination
  };
}
