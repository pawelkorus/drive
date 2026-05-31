import { useRef, useState, ChangeEvent, DragEvent, useCallback } from "react";
import { s3Service } from "../services/s3Service";
import { authService } from "../services/authService";
import { throttle } from "../utils/rateLimit";

interface FileUploadProps {
  onUploadSuccess: () => void;
}

export const FileUpload = ({ onUploadSuccess }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [failedFiles, setFailedFiles] = useState<File[]>([]);

  const isAuthenticated = authService.isAuthenticated();

  // Throttled upload to limit concurrent operations (sequential upload is already implemented)
  const uploadFiles = useCallback(
    throttle(async (files: File[]) => {
      if (files.length === 0) return;

      setUploading(true);
      setError(null);
      setFailedFiles([]);

      try {
        // Sequential upload - one file at a time (concurrent upload limit = 1)
        for (let i = 0; i < files.length; i++) {
          await s3Service.uploadFile(files[i]);
        }
        onUploadSuccess();
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setFailedFiles(files);
      } finally {
        setUploading(false);
      }
    }, 500),
    [onUploadSuccess]
  );

  const handleRetry = () => {
    if (failedFiles.length > 0) {
      uploadFiles(failedFiles);
    }
  };

  const handleFileSelect = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    uploadFiles(fileArray);
  };

  const filterFiles = (items: DataTransferItemList): File[] => {
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }
    return files;
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const files = filterFiles(event.dataTransfer.items);
    uploadFiles(files);
  };

  return (
    <div className="upload-section" role="region" aria-labelledby="upload-heading">
      <h2 id="upload-heading">Upload Files</h2>
      <label htmlFor="file-input" className="visually-hidden">
        Select files to upload
      </label>
      <input
        id="file-input"
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        disabled={uploading}
        aria-label="Select files to upload"
        aria-describedby={uploading ? "upload-status" : undefined}
      />
      {isAuthenticated && (
        <div
          ref={dropZoneRef}
          className={`drag-drop-zone ${isDragOver ? "drag-over" : ""} ${uploading ? "uploading" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={uploading ? -1 : 0}
          aria-label="Drag and drop zone for file upload"
          aria-describedby="drop-zone-instructions"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <p id="drop-zone-instructions">Drag and drop files here or press Enter to select files</p>
        </div>
      )}
      {uploading && (
        <p id="upload-status" role="status" aria-live="polite">
          Uploading...
        </p>
      )}
      {error && (
        <div className="error-container" role="alert" aria-live="assertive">
          <p className="error">{error}</p>
          <button 
            onClick={handleRetry} 
            className="retry-button"
            aria-label="Retry failed upload"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};
