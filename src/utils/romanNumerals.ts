// Utility functions for Roman numerals conversion

export function toRoman(num: number): string {
  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  
  let result = '';
  for (let i = 0; i < values.length; i++) {
    while (num >= values[i]) {
      result += symbols[i];
      num -= values[i];
    }
  }
  return result;
}

export function fromRoman(roman: string): number {
  const romanMap: { [key: string]: number } = {
    'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000
  };
  
  let result = 0;
  for (let i = 0; i < roman.length; i++) {
    const current = romanMap[roman[i]];
    const next = romanMap[roman[i + 1]];
    
    if (next && current < next) {
      result -= current;
    } else {
      result += current;
    }
  }
  return result;
}

// Grade options for forms
export const GRADE_OPTIONS = [
  { value: '10', label: 'Kelas X' },
  { value: '11', label: 'Kelas XI' },
  { value: '12', label: 'Kelas XII' },
];

// Display grade with Roman numerals
export function formatGrade(grade: string): string {
  const gradeNum = parseInt(grade);
  if (gradeNum >= 10 && gradeNum <= 12) {
    return `Kelas ${toRoman(gradeNum)}`;
  }
  return `Kelas ${grade}`;
}
