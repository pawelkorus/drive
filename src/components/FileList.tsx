import { useEffect, useState, useCallback, useRef } from 'react'
import { S3File, stripUserPrefix } from '../types'
import { s3Service } from '../services/s3Service'
import { formatFileSize } from '../utils/formatters'
import { debounce, preventRapidClicks } from '../utils/rateLimit'

interface FileListProps {
  refreshTrigger: number
}

export const FileList = ({ refreshTrigger }: FileListProps) => {
  const [files, setFiles] = useState<S3File[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<'list' | 'download' | 'delete' | null>(null)
  const [failedOperation, setFailedOperation] = useState<{ type: 'download' | 'delete', key: string } | null>(null)
  
  // Track if initial load has been triggered to prevent double-loading in StrictMode
  const hasLoadedRef = useRef(false)

  // Debounced file list refresh to prevent excessive API calls
  const debouncedLoadFiles = useRef(
    debounce(() => {
      loadFiles()
    }, 300)
  ).current

  // Initial load on mount
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadFiles()
    }
  }, [])

  // Refresh when refreshTrigger changes (after uploads)
  useEffect(() => {
    if (refreshTrigger > 0) {
      debouncedLoadFiles()
    }
  }, [refreshTrigger, debouncedLoadFiles])

  const loadFiles = async () => {
    setLoading(true)
    setError(null)
    setErrorType(null)
    setFailedOperation(null)
    try {
      const fileList = await s3Service.listFiles()
      setFiles(fileList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files')
      setErrorType('list')
    } finally {
      setLoading(false)
    }
  }

  // Prevent rapid button clicks with rate limiting
  const handleDownload = useCallback(
    preventRapidClicks(async (key: string) => {
      setError(null)
      setErrorType(null)
      setFailedOperation(null)
      try {
        await s3Service.downloadFile(key)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Download failed')
        setErrorType('download')
        setFailedOperation({ type: 'download', key })
      }
    }, 1000),
    []
  )

  const handleDelete = useCallback(
    preventRapidClicks(async (key: string) => {
      const displayName = stripUserPrefix(key)
      if (!confirm(`Are you sure you want to delete "${displayName}"?\n\nThis action cannot be undone.`)) return
      setError(null)
      setErrorType(null)
      setFailedOperation(null)
      try {
        await s3Service.deleteFile(key)
        await loadFiles()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed')
        setErrorType('delete')
        setFailedOperation({ type: 'delete', key })
      }
    }, 1000),
    []
  )

  const handleRetry = () => {
    if (errorType === 'list') {
      loadFiles()
    } else if (failedOperation) {
      if (failedOperation.type === 'download') {
        handleDownload(failedOperation.key)
      } else if (failedOperation.type === 'delete') {
        handleDelete(failedOperation.key)
      }
    }
  }

  if (loading) return (
    <p role="status" aria-live="polite" aria-busy="true">
      Loading files...
    </p>
  );
  
  if (error) {
    return (
      <div className="error-container" role="alert" aria-live="assertive">
        <p className="error">{error}</p>
        <button 
          onClick={handleRetry} 
          className="retry-button"
          aria-label={`Retry ${errorType === 'list' ? 'loading files' : errorType === 'download' ? 'downloading file' : 'deleting file'}`}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="file-list-section" role="region" aria-labelledby="file-list-heading">
      <h2 id="file-list-heading">Files ({files.length})</h2>
      {files.length === 0 ? (
        <p role="status">No files uploaded yet</p>
      ) : (
        <table role="table" aria-label="List of uploaded files">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Size</th>
              <th scope="col">Modified</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map(file => {
              const displayName = stripUserPrefix(file.key);
              return (
                <tr key={file.key}>
                  <td>{displayName}</td>
                  <td>{formatFileSize(file.size)}</td>
                  <td>{file.lastModified.toLocaleDateString()}</td>
                  <td>
                    <button 
                      onClick={() => handleDownload(file.key)}
                      aria-label={`Download ${displayName}`}
                    >
                      Download
                    </button>
                    <button 
                      onClick={() => handleDelete(file.key)}
                      aria-label={`Delete ${displayName}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
