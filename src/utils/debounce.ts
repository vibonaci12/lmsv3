import { useState } from 'react';

/**
 * Debounce utility to prevent rapid function calls
 * Useful for preventing lag when buttons are pressed multiple times
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle utility to limit function calls to once per interval
 * Useful for preventing multiple rapid API calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Hook for preventing multiple rapid button clicks
 * Returns a function that can be used to handle button clicks with loading state
 */
export function useButtonHandler() {
  const [loading, setLoading] = useState<string | null>(null);
  
  const handleClick = (action: () => void, buttonId: string, delay: number = 100) => {
    if (loading) return; // Prevent multiple clicks
    
    setLoading(buttonId);
    
    // Small delay to show loading state and prevent rapid clicks
    setTimeout(() => {
      action();
      setLoading(null);
    }, delay);
  };
  
  return { loading, handleClick };
}
