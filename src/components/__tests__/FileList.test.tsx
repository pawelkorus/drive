import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FileList } from '../FileList'
import { s3Service } from '../../services/s3Service'

// Mock the s3Service
vi.mock('../../services/s3Service', () => ({
  s3Service: {
    listFiles: vi.fn(),
    downloadFile: vi.fn(),
    deleteFile: vi.fn()
  }
}))

describe('FileList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('filename display', () => {
    it('should display filenames without user prefix', async () => {
      const mockFiles = [
        {
          key: 'user-123/document.pdf',
          size: 1024,
          lastModified: new Date('2024-01-15')
        },
        {
          key: 'user-123/report.xlsx',
          size: 2048,
          lastModified: new Date('2024-01-16')
        }
      ]

      vi.mocked(s3Service.listFiles).mockResolvedValue(mockFiles)

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument()
        expect(screen.getByText('report.xlsx')).toBeInTheDocument()
      })

      // Verify that the full key is NOT displayed
      expect(screen.queryByText('user-123/document.pdf')).not.toBeInTheDocument()
      expect(screen.queryByText('user-123/report.xlsx')).not.toBeInTheDocument()
    })

    it('should handle filenames with nested paths', async () => {
      const mockFiles = [
        {
          key: 'user-456/folder/subfolder/file.txt',
          size: 512,
          lastModified: new Date('2024-01-17')
        }
      ]

      vi.mocked(s3Service.listFiles).mockResolvedValue(mockFiles)

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByText('folder/subfolder/file.txt')).toBeInTheDocument()
      })

      expect(screen.queryByText('user-456/folder/subfolder/file.txt')).not.toBeInTheDocument()
    })

    it('should display file size in KB', async () => {
      const mockFiles = [
        {
          key: 'user-123/document.pdf',
          size: 2048, // 2 KB
          lastModified: new Date('2024-01-15')
        }
      ]

      vi.mocked(s3Service.listFiles).mockResolvedValue(mockFiles)

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByText('2.00 KB')).toBeInTheDocument()
      })
    })

    it('should display last modified date in local format', async () => {
      const mockDate = new Date('2024-01-15')
      const mockFiles = [
        {
          key: 'user-123/document.pdf',
          size: 1024,
          lastModified: mockDate
        }
      ]

      vi.mocked(s3Service.listFiles).mockResolvedValue(mockFiles)

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        const expectedDate = mockDate.toLocaleDateString()
        expect(screen.getByText(expectedDate)).toBeInTheDocument()
      })
    })
  })

  describe('delete confirmation dialog', () => {
    it('should show clean filename in delete confirmation', async () => {
      const mockFiles = [
        {
          key: 'user-123/important-document.pdf',
          size: 1024,
          lastModified: new Date('2024-01-15')
        }
      ]

      vi.mocked(s3Service.listFiles).mockResolvedValue(mockFiles)
      vi.mocked(s3Service.deleteFile).mockResolvedValue(undefined)

      // Mock window.confirm to capture the message
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(true)

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByText('important-document.pdf')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /Delete/ })
      fireEvent.click(deleteButton)

      // Verify that the confirmation dialog shows the clean filename with user-friendly message
      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete "important-document.pdf"?\n\nThis action cannot be undone.')

      confirmSpy.mockRestore()
    })

    it('should not show user prefix in delete confirmation', async () => {
      const mockFiles = [
        {
          key: 'user-456/report.xlsx',
          size: 2048,
          lastModified: new Date('2024-01-16')
        }
      ]

      vi.mocked(s3Service.listFiles).mockResolvedValue(mockFiles)
      vi.mocked(s3Service.deleteFile).mockResolvedValue(undefined)

      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(true)

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByText('report.xlsx')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /Delete/ })
      fireEvent.click(deleteButton)

      // Verify that the user prefix is NOT in the confirmation message
      expect(confirmSpy).not.toHaveBeenCalledWith(expect.stringContaining('user-456'))
      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete "report.xlsx"?\n\nThis action cannot be undone.')

      confirmSpy.mockRestore()
    })

    it('should proceed with deletion when user confirms', async () => {
      const mockFiles = [
        {
          key: 'user-123/document.pdf',
          size: 1024,
          lastModified: new Date('2024-01-15')
        }
      ]

      vi.mocked(s3Service.listFiles).mockResolvedValue(mockFiles)
      vi.mocked(s3Service.deleteFile).mockResolvedValue(undefined)

      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(true)

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /Delete/ })
      fireEvent.click(deleteButton)

      // Verify that deletion proceeds when confirmed
      await waitFor(() => {
        expect(s3Service.deleteFile).toHaveBeenCalledWith('user-123/document.pdf')
      })

      confirmSpy.mockRestore()
    })

    it('should not proceed with deletion when user cancels', async () => {
      const mockFiles = [
        {
          key: 'user-123/document.pdf',
          size: 1024,
          lastModified: new Date('2024-01-15')
        }
      ]

      vi.mocked(s3Service.listFiles).mockResolvedValue(mockFiles)
      vi.mocked(s3Service.deleteFile).mockResolvedValue(undefined)

      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false)

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /Delete/ })
      fireEvent.click(deleteButton)

      // Verify that deletion does NOT proceed when cancelled
      expect(s3Service.deleteFile).not.toHaveBeenCalled()

      confirmSpy.mockRestore()
    })

    it('should display user-friendly confirmation text', async () => {
      const mockFiles = [
        {
          key: 'user-789/presentation.pptx',
          size: 4096,
          lastModified: new Date('2024-01-17')
        }
      ]

      vi.mocked(s3Service.listFiles).mockResolvedValue(mockFiles)

      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false)

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByText('presentation.pptx')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /Delete/ })
      fireEvent.click(deleteButton)

      // Verify the confirmation message is clear and user-friendly
      const confirmMessage = confirmSpy.mock.calls[0][0]
      expect(confirmMessage).toContain('Are you sure')
      expect(confirmMessage).toContain('presentation.pptx')
      expect(confirmMessage).toContain('cannot be undone')

      confirmSpy.mockRestore()
    })
  })

  describe('file operations', () => {
    it('should use full S3 key for download operations', async () => {
      const mockFiles = [
        {
          key: 'user-123/document.pdf',
          size: 1024,
          lastModified: new Date('2024-01-15')
        }
      ]

      vi.mocked(s3Service.listFiles).mockResolvedValue(mockFiles)
      vi.mocked(s3Service.downloadFile).mockResolvedValue(undefined)

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument()
      })

      const downloadButton = screen.getByRole('button', { name: /Download/ })
      fireEvent.click(downloadButton)

      // Verify that the full key is used for the download operation
      expect(s3Service.downloadFile).toHaveBeenCalledWith('user-123/document.pdf')
    })

    it('should use full S3 key for delete operations', async () => {
      const mockFiles = [
        {
          key: 'user-123/document.pdf',
          size: 1024,
          lastModified: new Date('2024-01-15')
        }
      ]

      vi.mocked(s3Service.listFiles).mockResolvedValue(mockFiles)
      vi.mocked(s3Service.deleteFile).mockResolvedValue(undefined)

      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(true)

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /Delete/ })
      fireEvent.click(deleteButton)

      // Verify that the full key is used for the delete operation
      expect(s3Service.deleteFile).toHaveBeenCalledWith('user-123/document.pdf')

      confirmSpy.mockRestore()
    })
  })

  describe('loading and error states', () => {
    it('should display loading message while fetching files', () => {
      vi.mocked(s3Service.listFiles).mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      )

      render(<FileList refreshTrigger={0} />)

      expect(screen.getByText('Loading files...')).toBeInTheDocument()
    })

    it('should display error message on load failure', async () => {
      vi.mocked(s3Service.listFiles).mockRejectedValueOnce(
        new Error('Failed to load files')
      )

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load files')).toBeInTheDocument()
      })
    })

    it('should display empty state when no files exist', async () => {
      vi.mocked(s3Service.listFiles).mockResolvedValue([])

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByText('No files uploaded yet')).toBeInTheDocument()
      })
    })
  })

  describe('file list refresh', () => {
    it('should reload files when refreshTrigger changes', async () => {
      const mockFiles1 = [
        {
          key: 'user-123/file1.txt',
          size: 1024,
          lastModified: new Date('2024-01-15')
        }
      ]

      const mockFiles2 = [
        {
          key: 'user-123/file1.txt',
          size: 1024,
          lastModified: new Date('2024-01-15')
        },
        {
          key: 'user-123/file2.txt',
          size: 2048,
          lastModified: new Date('2024-01-16')
        }
      ]

      vi.mocked(s3Service.listFiles)
        .mockResolvedValueOnce(mockFiles1)
        .mockResolvedValueOnce(mockFiles2)

      const { rerender } = render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByText('file1.txt')).toBeInTheDocument()
      })

      expect(screen.queryByText('file2.txt')).not.toBeInTheDocument()

      // Trigger refresh
      rerender(<FileList refreshTrigger={1} />)

      await waitFor(() => {
        expect(screen.getByText('file2.txt')).toBeInTheDocument()
      })

      expect(s3Service.listFiles).toHaveBeenCalledTimes(2)
    })
  })

  describe('Retry Button Functionality', () => {
    it('should display retry button when list loading fails', async () => {
      vi.mocked(s3Service.listFiles).mockRejectedValue(
        new Error('Failed to load files')
      )

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load files')).toBeInTheDocument()
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    it('should retry loading files when retry button is clicked after list failure', async () => {
      const mockFiles = [
        {
          key: 'user-123/document.pdf',
          size: 1024,
          lastModified: new Date('2024-01-15')
        }
      ]

      vi.mocked(s3Service.listFiles)
        .mockRejectedValueOnce(new Error('Failed to load files'))
        .mockResolvedValueOnce(mockFiles)

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load files')).toBeInTheDocument()
      })

      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument()
      })

      expect(s3Service.listFiles).toHaveBeenCalledTimes(2)
    })

    it('should display retry button when download fails', async () => {
      const mockFiles = [
        {
          key: 'user-123/document.pdf',
          size: 1024,
          lastModified: new Date('2024-01-15')
        }
      ]

      vi.mocked(s3Service.listFiles).mockResolvedValue(mockFiles)
      vi.mocked(s3Service.downloadFile).mockRejectedValue(
        new Error('Download failed')
      )

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument()
      })

      const downloadButton = screen.getByRole('button', { name: /Download/ })
      fireEvent.click(downloadButton)

      await waitFor(() => {
        expect(screen.getByText('Download failed')).toBeInTheDocument()
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    it('should retry download when retry button is clicked after download failure', async () => {
      const mockFiles = [
        {
          key: 'user-123/document.pdf',
          size: 1024,
          lastModified: new Date('2024-01-15')
        }
      ]

      vi.mocked(s3Service.listFiles).mockResolvedValue(mockFiles)
      vi.mocked(s3Service.downloadFile)
        .mockRejectedValueOnce(new Error('Download failed'))
        .mockResolvedValueOnce(undefined)

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument()
      })

      const downloadButton = screen.getByRole('button', { name: /Download/ })
      fireEvent.click(downloadButton)

      await waitFor(() => {
        expect(screen.getByText('Download failed')).toBeInTheDocument()
      })

      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.queryByText('Download failed')).not.toBeInTheDocument()
      })

      expect(s3Service.downloadFile).toHaveBeenCalledTimes(2)
      expect(s3Service.downloadFile).toHaveBeenCalledWith('user-123/document.pdf')
    })

    it('should display retry button when delete fails', async () => {
      const mockFiles = [
        {
          key: 'user-123/document.pdf',
          size: 1024,
          lastModified: new Date('2024-01-15')
        }
      ]

      vi.mocked(s3Service.listFiles).mockResolvedValue(mockFiles)
      vi.mocked(s3Service.deleteFile).mockRejectedValue(
        new Error('Delete failed')
      )

      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /Delete/ })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeInTheDocument()
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })

      confirmSpy.mockRestore()
    })

    it('should retry delete when retry button is clicked after delete failure', async () => {
      const mockFiles = [
        {
          key: 'user-123/document.pdf',
          size: 1024,
          lastModified: new Date('2024-01-15')
        }
      ]

      vi.mocked(s3Service.listFiles).mockResolvedValue(mockFiles)
      vi.mocked(s3Service.deleteFile)
        .mockRejectedValueOnce(new Error('Delete failed'))
        .mockResolvedValueOnce(undefined)

      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /Delete/ })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeInTheDocument()
      })

      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)

      // Should show confirmation dialog again
      expect(confirmSpy).toHaveBeenCalledTimes(2)

      await waitFor(() => {
        expect(s3Service.deleteFile).toHaveBeenCalledTimes(2)
      })

      confirmSpy.mockRestore()
    })

    it('should have retry-button class for styling', async () => {
      vi.mocked(s3Service.listFiles).mockRejectedValue(
        new Error('Failed to load files')
      )

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        const retryButton = screen.getByText('Retry')
        expect(retryButton).toHaveClass('retry-button')
      })
    })

    it('should clear error when retry succeeds', async () => {
      const mockFiles = [
        {
          key: 'user-123/document.pdf',
          size: 1024,
          lastModified: new Date('2024-01-15')
        }
      ]

      vi.mocked(s3Service.listFiles)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockFiles)

      render(<FileList refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })

      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.queryByText('Network error')).not.toBeInTheDocument()
        expect(screen.getByText('document.pdf')).toBeInTheDocument()
      })
    })
  })
})
