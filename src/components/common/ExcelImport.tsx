import { useState, useRef } from 'react';
import {
  Paper,
  Text,
  Button,
  Group,
  Stack,
  Alert,
  Progress,
  Table,
  Badge,
  Modal,
  ScrollArea,
  ThemeIcon,
  FileInput,
  TextInput,
  Checkbox
} from '@mantine/core';
import {
  IconUpload,
  IconFileSpreadsheet,
  IconCheck,
  IconAlertCircle,
  IconDownload,
  IconEdit
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import * as XLSX from 'xlsx';

interface ExcelImportProps {
  onImport: (data: any[]) => Promise<{ success: number; errors: any[] }>;
  templateUrl?: string;
  maxRows?: number;
  requiredColumns?: string[];
  columnMappings?: { [key: string]: string };
  previewColumns?: string[];
  onClose?: () => void;
  opened?: boolean;
  title?: string;
}

interface ImportData {
  [key: string]: any;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function ExcelImport({
  onImport,
  templateUrl,
  maxRows = 1000,
  requiredColumns = [],
  columnMappings = {},
  previewColumns = [],
  onClose,
  opened = false,
  title = "Import Data dari Excel"
}: ExcelImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; errors: any[] } | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'import' | 'complete'>('upload');
  const [editableData, setEditableData] = useState<ImportData[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setStep('preview');
    processFile(selectedFile);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setValidationErrors([]);
    
    try {
      const data = await readExcelFile(file);
      const validatedData = validateData(data);
      
      setValidationErrors(validatedData.errors);
      setEditableData([...validatedData.validData]);
      
      if (validatedData.errors.length > 0) {
        notifications.show({
          title: 'Data Validation Warning',
          message: `Found ${validatedData.errors.length} validation errors. Please review before importing.`,
          color: 'yellow',
        });
      }
    } catch (error) {
      console.error('Error processing file:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to process Excel file. Please check the file format.',
        color: 'red',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const readExcelFile = (file: File): Promise<ImportData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with header mapping
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            blankrows: false
          });
          
          if (jsonData.length < 2) {
            throw new Error('File must contain at least a header row and one data row');
          }
          
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          
          const mappedData = rows.map((row, index) => {
            const rowData: ImportData = { _rowNumber: index + 2 };
            headers.forEach((header, colIndex) => {
              if (header && colIndex < row.length) {
                // Keep original header name for validation, but also add mapped key
                rowData[header] = row[colIndex];
                if (columnMappings[header]) {
                  rowData[columnMappings[header]] = row[colIndex];
                }
              }
            });
            return rowData;
          });
          
          resolve(mappedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const validateData = (data: ImportData[]) => {
    const errors: ValidationError[] = [];
    const validData: ImportData[] = [];
    
    data.forEach((row, index) => {
      let isValid = true;
      
      // Check required columns
      requiredColumns.forEach(column => {
        if (!row[column] || row[column].toString().trim() === '') {
          errors.push({
            row: row._rowNumber || index + 2,
            field: column,
            message: `${column} is required`
          });
          isValid = false;
        }
      });
      
      // Check max rows
      if (index >= maxRows) {
        errors.push({
          row: row._rowNumber || index + 2,
          field: '_system',
          message: `Maximum ${maxRows} rows allowed`
        });
        isValid = false;
      }
      
      if (isValid) {
        validData.push(row);
      }
    });
    
    return { validData, errors };
  };

  const handleEditCell = (rowIndex: number, field: string, value: any) => {
    const newData = [...editableData];
    newData[rowIndex] = {
      ...newData[rowIndex],
      [field]: value
    };
    setEditableData(newData);
  };

  const handleSelectRow = (rowIndex: number, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, rowIndex]);
    } else {
      setSelectedRows(selectedRows.filter(i => i !== rowIndex));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(editableData.map((_, index) => index));
    } else {
      setSelectedRows([]);
    }
  };

  const handleImport = async () => {
    if (editableData.length === 0) {
      notifications.show({
        title: 'No Data',
        message: 'No data to import',
        color: 'yellow',
      });
      return;
    }

    setStep('import');
    setImportProgress(0);
    
    try {
      const dataToImport = selectedRows.length > 0 
        ? selectedRows.map(i => editableData[i])
        : editableData;
      
      const results = await onImport(dataToImport);
      setImportResults(results);
      setStep('complete');
      
      notifications.show({
        title: 'Import Complete',
        message: `Successfully imported ${results.success} records. ${results.errors.length} errors occurred.`,
        color: results.errors.length > 0 ? 'yellow' : 'green',
      });
    } catch (error) {
      console.error('Import error:', error);
      notifications.show({
        title: 'Import Failed',
        message: 'Failed to import data. Please try again.',
        color: 'red',
      });
    }
  };

  const handleReset = () => {
    setFile(null);
    setEditableData([]);
    setValidationErrors([]);
    setImportResults(null);
    setSelectedRows([]);
    setStep('upload');
    setImportProgress(0);
  };

  const handleClose = () => {
    handleReset();
    onClose?.();
  };

  const renderUploadStep = () => (
    <Stack gap="md">
      <Paper p="xl" withBorder radius="md" style={{ textAlign: 'center' }}>
        <ThemeIcon size="xl" variant="light" color="blue" mb="md">
          <IconFileSpreadsheet size={32} />
        </ThemeIcon>
        <Text size="lg" fw={600} mb="sm">Upload Excel File</Text>
        <Text size="sm" c="dimmed" mb="md">
          Drag and drop your Excel file here or click to browse
        </Text>
        
        <FileInput
          placeholder="Choose Excel file..."
          accept=".xlsx,.xls"
          value={file}
          onChange={handleFileSelect}
          leftSection={<IconUpload size={16} />}
          style={{ maxWidth: 300, margin: '0 auto' }}
        />
        
        {templateUrl && (
          <Button
            variant="light"
            leftSection={<IconDownload size={16} />}
            component="a"
            href={templateUrl}
            download
            mt="md"
          >
            Download Template
          </Button>
        )}
      </Paper>
      
      {requiredColumns.length > 0 && (
        <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
          <Text size="sm" fw={600} mb="xs">Required Columns:</Text>
          <Text size="sm">{requiredColumns.join(', ')}</Text>
        </Alert>
      )}
    </Stack>
  );

  const renderPreviewStep = () => (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="lg" fw={600}>Preview Data ({editableData.length} rows)</Text>
        <Group gap="sm">
          <Button
            variant="light"
            onClick={() => setStep('upload')}
            leftSection={<IconEdit size={16} />}
          >
            Change File
          </Button>
          <Button
            onClick={handleImport}
            disabled={editableData.length === 0}
            leftSection={<IconUpload size={16} />}
          >
            Import {selectedRows.length > 0 ? `${selectedRows.length} selected` : 'all'} rows
          </Button>
        </Group>
      </Group>

      {validationErrors.length > 0 && (
        <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
          <Text size="sm" fw={600} mb="xs">Validation Errors ({validationErrors.length}):</Text>
          <ScrollArea h={150}>
            {validationErrors.slice(0, 10).map((error, index) => (
              <Text key={index} size="xs" c="dimmed">
                Row {error.row}: {error.field} - {error.message}
              </Text>
            ))}
            {validationErrors.length > 10 && (
              <Text size="xs" c="dimmed">... and {validationErrors.length - 10} more errors</Text>
            )}
            </ScrollArea>
        </Alert>
      )}

      <Paper withBorder radius="md">
        <ScrollArea h={400}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 50 }}>
                  <Checkbox
                    checked={selectedRows.length === editableData.length && editableData.length > 0}
                    indeterminate={selectedRows.length > 0 && selectedRows.length < editableData.length}
                    onChange={(event) => handleSelectAll(event.currentTarget.checked)}
                  />
                </Table.Th>
                {previewColumns.length > 0 ? previewColumns.map(col => (
                  <Table.Th key={col}>{col}</Table.Th>
                )) : Object.keys(editableData[0] || {}).filter(key => key !== '_rowNumber').map(col => (
                  <Table.Th key={col}>{col}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {editableData.map((row, index) => (
                <Table.Tr key={index}>
                  <Table.Td>
                    <Checkbox
                      checked={selectedRows.includes(index)}
                      onChange={(event) => handleSelectRow(index, event.currentTarget.checked)}
                    />
                  </Table.Td>
                  {previewColumns.length > 0 ? previewColumns.map(col => (
                    <Table.Td key={col}>
                      <TextInput
                        value={row[col] || ''}
                        onChange={(event) => handleEditCell(index, col, event.target.value)}
                        size="xs"
                        variant="unstyled"
                      />
                    </Table.Td>
                  )) : Object.keys(row).filter(key => key !== '_rowNumber').map(col => (
                    <Table.Td key={col}>
                      <TextInput
                        value={row[col] || ''}
                        onChange={(event) => handleEditCell(index, col, event.target.value)}
                        size="xs"
                        variant="unstyled"
                      />
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
            </ScrollArea>
      </Paper>
    </Stack>
  );

  const renderImportStep = () => (
    <Stack gap="md" align="center">
      <ThemeIcon size="xl" variant="light" color="blue">
        <IconUpload size={32} />
      </ThemeIcon>
      <Text size="lg" fw={600}>Importing Data...</Text>
      <Progress value={importProgress} style={{ width: '100%', maxWidth: 400 }} />
      <Text size="sm" c="dimmed">Please wait while we import your data</Text>
    </Stack>
  );

  const renderCompleteStep = () => (
    <Stack gap="md" align="center">
      <ThemeIcon size="xl" variant="light" color="green">
        <IconCheck size={32} />
      </ThemeIcon>
      <Text size="lg" fw={600}>Import Complete!</Text>
      
      {importResults && (
        <Group gap="lg">
          <Badge color="green" size="lg">
            {importResults.success} Success
          </Badge>
          {importResults.errors.length > 0 && (
            <Badge color="red" size="lg">
              {importResults.errors.length} Errors
            </Badge>
          )}
        </Group>
      )}
      
      <Group gap="sm">
        <Button onClick={handleReset} variant="light">
          Import More
        </Button>
        <Button onClick={handleClose}>
          Close
        </Button>
      </Group>
    </Stack>
  );

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={title}
      size="xl"
      centered
    >
      {isProcessing && (
        <Stack gap="md" align="center" py="xl">
          <ThemeIcon size="xl" variant="light" color="blue">
            <IconFileSpreadsheet size={32} />
          </ThemeIcon>
          <Text>Processing file...</Text>
        </Stack>
      )}
      
      {!isProcessing && step === 'upload' && renderUploadStep()}
      {!isProcessing && step === 'preview' && renderPreviewStep()}
      {!isProcessing && step === 'import' && renderImportStep()}
      {!isProcessing && step === 'complete' && renderCompleteStep()}
    </Modal>
  );
}
