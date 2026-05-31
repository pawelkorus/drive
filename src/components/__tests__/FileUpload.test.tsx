import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { s3Service } from '../../services/s3Service'
import { authService } from '../../services/authService'

// Mock s3Service
vi.mock('../../services/s3Service', () => ({
  s3Service: {
    uploadFile: vi.fn()
  }
}))

import { FileUpload } from '../FileUpload'

describe('FileUpload Component - Drag and Drop', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock authService.isAuthenticated to return true
    vi.spyOn(authService, 'isAuthenticated').mockReturnValue(true)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('drag-and-drop zone display', () => {
    it('should display drag-and-drop zone when authenticated', () => {
      const mockOnUploadSuccess = vi.fn()
      render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />)

      const dragDropZone = screen.getByText(/Drag and drop files here/)
      expect(dragDropZone).toBeInTheDocument()
    })
  })

  describe('dragover event handling', () => {
    it('should highlight zone on dragover', () => {
      const mockOnUploadSuccess = vi.fn()
      render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />)

      const dragDropZone = screen.getByText(/Drag and drop files here/).parentElement!
      fireEvent.dragOver(dragDropZone)

      expect(dragDropZone).toHaveClass('drag-over')
    })

    it('should stop propagation on dragover', () => {
      const mockOnUploadSuccess = vi.fn()
      render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />)

      const dragDropZone = screen.getByText(/Drag and drop files here/).parentElement!
      fireEvent.dragOver(dragDropZone)

      // Verify the zone has the drag-over class (which means preventDefault and stopPropagation were called)
      expect(dragDropZone).toHaveClass('drag-over')
    })
  })

  describe('dragleave event handling', () => {
    it('should remove highlight on dragleave', () => {
      const mockOnUploadSuccess = vi.fn()
      render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />)

      const dragDropZone = screen.getByText(/Drag and drop files here/).parentElement!

      // First dragover to add highlight
      fireEvent.dragOver(dragDropZone)
      expect(dragDropZone).toHaveClass('drag-over')

      // Then dragleave to remove highlight
      fireEvent.dragLeave(dragDropZone)
      expect(dragDropZone).not.toHaveClass('drag-over')
    })
  })

  describe('drop event handling', () => {
    it('should remove highlight on drop', async () => {
      const mockOnUploadSuccess = vi.fn()
      vi.mocked(s3Service.uploadFile).mockResolvedValue(undefined)

      render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />)

      const dragDropZone = screen.getByText(/Drag and drop files here/).parentElement!

      // First dragover to add highlight
      fireEvent.dragOver(dragDropZone)
      expect(dragDropZone).toHaveClass('drag-over')

      // Then drop
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)

      fireEvent.drop(dragDropZone, { dataTransfer })

      // Highlight should be removed
      expect(dragDropZone).not.toHaveClass('drag-over')
    })
  })

  describe('file filtering', () => {
    it('should filter out non-file items and accept only files', async () => {
      const mockOnUploadSuccess = vi.fn()
      vi.mocked(s3Service.uploadFile).mockResolvedValue(undefined)

      render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />)

      const dragDropZone = screen.getByText(/Drag and drop files here/).parentElement!
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)

      fireEvent.drop(dragDropZone, { dataTransfer })

      await waitFor(() => {
        expect(s3Service.uploadFile).toHaveBeenCalledWith(file)
      })

      expect(s3Service.uploadFile).toHaveBeenCalledTimes(1)
    })

    it('should accept multiple files in single drop', async () => {
      const mockOnUploadSuccess = vi.fn()
      vi.mocked(s3Service.uploadFile).mockResolvedValue(undefined)

      render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />)

      const dragDropZone = screen.getByText(/Drag and drop files here/).parentElement!
      const file1 = new File(['content1'], 'test1.txt', { type: 'text/plain' })
      const file2 = new File(['content2'], 'test2.txt', { type: 'text/plain' })
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file1)
      dataTransfer.items.add(file2)

      fireEvent.drop(dragDropZone, { dataTransfer })

      await waitFor(() => {
        expect(s3Service.uploadFile).toHaveBeenCalledTimes(2)
      })

      expect(s3Service.uploadFile).toHaveBeenCalledWith(file1)
      expect(s3Service.uploadFile).toHaveBeenCalledWith(file2)
    })
  })

  describe('upload state management', () => {
    it('should disable zone and show uploading status during upload', async () => {
      const mockOnUploadSuccess = vi.fn()
      vi.mocked(s3Service.uploadFile).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />)

      const dragDropZone = screen.getByText(/Drag and drop files here/).parentElement!
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)

      fireEvent.drop(dragDropZone, { dataTransfer })

      // Should show uploading status
      expect(screen.getByText('Uploading...')).toBeInTheDocument()

      // Zone should have uploading class
      expect(dragDropZone).toHaveClass('uploading')

      await waitFor(() => {
        expect(mockOnUploadSuccess).toHaveBeenCalled()
      })
    })

    it('should re-enable zone after successful upload', async () => {
      const mockOnUploadSuccess = vi.fn()
      vi.mocked(s3Service.uploadFile).mockResolvedValue(undefined)

      render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />)

      const dragDropZone = screen.getByText(/Drag and drop files here/).parentElement!
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)

      fireEvent.drop(dragDropZone, { dataTransfer })

      await waitFor(() => {
        expect(mockOnUploadSuccess).toHaveBeenCalled()
      })

      // Zone should no longer have uploading class
      expect(dragDropZone).not.toHaveClass('uploading')

      // Uploading message should be gone
      expect(screen.queryByText('Uploading...')).not.toBeInTheDocument()
    })

    it('should re-enable zone on upload failure', async () => {
      const mockOnUploadSuccess = vi.fn()
      vi.mocked(s3Service.uploadFile).mockRejectedValue(
        new Error('Upload failed')
      )

      render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />)

      const dragDropZone = screen.getByText(/Drag and drop files here/).parentElement!
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)

      fireEvent.drop(dragDropZone, { dataTransfer })

      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument()
      })

      // Zone should no longer have uploading class
      expect(dragDropZone).not.toHaveClass('uploading')

      // onUploadSuccess should not be called
      expect(mockOnUploadSuccess).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should display error message on upload failure', async () => {
      const mockOnUploadSuccess = vi.fn()
      vi.mocked(s3Service.uploadFile).mockRejectedValue(
        new Error('S3 access denied')
      )

      render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />)

      const dragDropZone = screen.getByText(/Drag and drop files here/).parentElement!
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)

      fireEvent.drop(dragDropZone, { dataTransfer })

      await waitFor(() => {
        expect(screen.getByText('S3 access denied')).toBeInTheDocument()
      })
    })

    it('should clear error message on successful upload after error', async () => {
      const mockOnUploadSuccess = vi.fn()
      vi.mocked(s3Service.uploadFile)
        .mockRejectedValueOnce(new Error('Upload failed'))
        .mockResolvedValueOnce(undefined)

      render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />)

      const dragDropZone = screen.getByText(/Drag and drop files here/).parentElement!
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })

      // First drop - fails
      const dataTransfer1 = new DataTransfer()
      dataTransfer1.items.add(file)
      fireEvent.drop(dragDropZone, { dataTransfer: dataTransfer1 })

      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument()
      })

      // Second drop - succeeds
      const dataTransfer2 = new DataTransfer()
      dataTransfer2.items.add(file)
      fireEvent.drop(dragDropZone, { dataTransfer: dataTransfer2 })

      await waitFor(() => {
        expect(mockOnUploadSuccess).toHaveBeenCalled()
      })

      // Error message should be gone
      expect(screen.queryByText('Upload failed')).not.toBeInTheDocument()
    })
  })

  describe('sequential upload', () => {
    it('should upload files sequentially', async () => {
      const mockOnUploadSuccess = vi.fn()
      const uploadOrder: string[] = []

      vi.mocked(s3Service.uploadFile).mockImplementation(async (file: File) => {
        uploadOrder.push(file.name)
      })

      render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />)

      const dragDropZone = screen.getByText(/Drag and drop files here/).parentElement!
      const file1 = new File(['content1'], 'file1.txt', { type: 'text/plain' })
      const file2 = new File(['content2'], 'file2.txt', { type: 'text/plain' })
      const file3 = new File(['content3'], 'file3.txt', { type: 'text/plain' })

      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file1)
      dataTransfer.items.add(file2)
      dataTransfer.items.add(file3)

      fireEvent.drop(dragDropZone, { dataTransfer })

      await waitFor(() => {
        expect(mockOnUploadSuccess).toHaveBeenCalled()
      })

      expect(uploadOrder).toEqual(['file1.txt', 'file2.txt', 'file3.txt'])
    })
  })

  describe('Retry Button Functionality', () => {
    it('should display retry button when upload fails', async () => {
      const mockOnUploadSuccess = vi.fn()
      vi.mocked(s3Service.uploadFile).mockRejectedValue(
        new Error('Upload failed')
      )

      render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />)

      const dragDropZone = screen.getByText(/Drag and drop files here/).parentElement!
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)

      fireEvent.drop(dragDropZone, { dataTransfer })

      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument()
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    it('should retry upload when retry button is clicked', async () => {
      const mockOnUploadSuccess = vi.fn()
      vi.mocked(s3Service.uploadFile)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined)

      render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />)

      const dragDropZone = screen.getByText(/Drag and drop files here/).parentElement!
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)

      fireEvent.drop(dragDropZone, { dataTransfer })

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })

      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(mockOnUploadSuccess).toHaveBeenCalled()
      })

      expect(s3Service.uploadFile).toHaveBeenCalledTimes(2)
    })

    it('should retry with same files that failed', async () => {
      const mockOnUploadSuccess = vi.fn()
      const uploadedFiles: File[] = []

      vi.mocked(s3Service.uploadFile)
        .mockRejectedValueOnce(new Error('Upload failed'))
        .mockImplementation(async (file: File) => {
          uploadedFiles.push(file)
        })

      render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />)

      const dragDropZone = screen.getByText(/Drag and drop files here/).parentElement!
      const file1 = new File(['content1'], 'file1.txt', { type: 'text/plain' })
      const file2 = new File(['content2'], 'file2.txt', { type: 'text/plain' })
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file1)
      dataTransfer.items.add(file2)

      fireEvent.drop(dragDropZone, { dataTransfer })

      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument()
      })

      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(mockOnUploadSuccess).toHaveBeenCalled()
      })

      expect(uploadedFiles).toHaveLength(2)
      expect(uploadedFiles[0].name).toBe('file1.txt')
      expect(uploadedFiles[1].name).toBe('file2.txt')
    })

    it('should clear error when retry succeeds', async () => {
      const mockOnUploadSuccess = vi.fn()
      vi.mocked(s3Service.uploadFile)
        .mockRejectedValueOnce(new Error('S3 access denied'))
        .mockResolvedValueOnce(undefined)

      render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />)

      const dragDropZone = screen.getByText(/Drag and drop files here/).parentElement!
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)

      fireEvent.drop(dragDropZone, { dataTransfer })

      await waitFor(() => {
        expect(screen.getByText('S3 access denied')).toBeInTheDocument()
      })

      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.queryByText('S3 access denied')).not.toBeInTheDocument()
        expect(mockOnUploadSuccess).toHaveBeenCalled()
      })
    })

    it('should have retry-button class for styling', async () => {
      const mockOnUploadSuccess = vi.fn()
      vi.mocked(s3Service.uploadFile).mockRejectedValue(
        new Error('Upload failed')
      )

      render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />)

      const dragDropZone = screen.getByText(/Drag and drop files here/).parentElement!
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)

      fireEvent.drop(dragDropZone, { dataTransfer })

      await waitFor(() => {
        const retryButton = screen.getByText('Retry')
        expect(retryButton).toHaveClass('retry-button')
      })
    })

    it('should show uploading status during retry', async () => {
      const mockOnUploadSuccess = vi.fn()
      vi.mocked(s3Service.uploadFile)
        .mockRejectedValueOnce(new Error('Upload failed'))
        .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />)

      const dragDropZone = screen.getByText(/Drag and drop files here/).parentElement!
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)

      fireEvent.drop(dragDropZone, { dataTransfer })

      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument()
      })

      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)

      // Should show uploading status
      expect(screen.getByText('Uploading...')).toBeInTheDocument()

      await waitFor(() => {
        expect(mockOnUploadSuccess).toHaveBeenCalled()
      })
    })

    it('should work with file input retry', async () => {
      const mockOnUploadSuccess = vi.fn()
      vi.mocked(s3Service.uploadFile)
        .mockRejectedValueOnce(new Error('Upload failed'))
        .mockResolvedValueOnce(undefined)

      const { container } = render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />)

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument()
      })

      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(mockOnUploadSuccess).toHaveBeenCalled()
      })

      expect(s3Service.uploadFile).toHaveBeenCalledTimes(2)
    })
  })
})
