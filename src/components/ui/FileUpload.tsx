import { useCallback, useState } from 'react';
import { Upload, X, FileIcon, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  className?: string;
}

/**
 * Drag & Drop File Upload Component
 */
export function FileUpload({
  accept,
  maxSize = 5,
  multiple = false,
  onFilesSelected,
  className,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>('');

  const validateFiles = (fileList: FileList): File[] => {
    const validFiles: File[] = [];
    const maxSizeBytes = maxSize * 1024 * 1024;

    Array.from(fileList).forEach((file) => {
      if (file.size > maxSizeBytes) {
        setError(`File ${file.name} is too large. Max size: ${maxSize}MB`);
        return;
      }
      validFiles.push(file);
    });

    return validFiles;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      setError('');

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const validFiles = validateFiles(e.dataTransfer.files);
        if (validFiles.length > 0) {
          setFiles(validFiles);
          onFilesSelected(validFiles);
        }
      }
    },
    [onFilesSelected]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError('');

    if (e.target.files && e.target.files.length > 0) {
      const validFiles = validateFiles(e.target.files);
      if (validFiles.length > 0) {
        setFiles(validFiles);
        onFilesSelected(validFiles);
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  return (
    <div className={className}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all duration-200',
          dragActive
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600',
          'cursor-pointer'
        )}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Upload className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-base font-medium text-slate-900 dark:text-white mb-1">
            Drag & drop files here
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">or click to browse</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Max file size: {maxSize}MB
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-slide-in-up">{error}</p>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-slide-in-up"
            >
              <FileIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <button
                onClick={() => removeFile(index)}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
