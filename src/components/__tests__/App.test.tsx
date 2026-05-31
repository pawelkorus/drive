import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import React from 'react'
import { App } from '../App'
import { loadConfig } from '../../config/awsConfig'
import { authService } from '../../services/authService'

// Mock the config loader
vi.mock('../../config/awsConfig', () => ({
  loadConfig: vi.fn(),
}))

// Mock the authService
vi.mock('../../services/authService', () => ({
  authService: {
    clearCredentials: vi.fn(),
  },
}))

// Mock child components
vi.mock('../Login', () => ({
  Login: ({ onLoginSuccess }: { onLoginSuccess: () => void }) => (
    <div data-testid="login-component">
      <button onClick={onLoginSuccess}>Mock Login Success</button>
    </div>
  ),
}))

vi.mock('../FileUpload', () => ({
  FileUpload: ({ onUploadSuccess }: { onUploadSuccess: () => void }) => (
    <div data-testid="file-upload-component">
      <button onClick={onUploadSuccess}>Mock Upload Success</button>
    </div>
  ),
}))

vi.mock('../FileList', () => ({
  FileList: () => <div data-testid="file-list-component">Mock File List</div>,
}))

describe('App Component - Loading Animation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  describe('Loading State Display', () => {
    it('should display loading spinner while configuration is loading', async () => {
      // Mock loadConfig to delay resolution
      vi.mocked(loadConfig).mockImplementation(() => new Promise(() => {}))

      const { container } = render(React.createElement(App))

      // Spinner should be visible
      const spinner = container.querySelector('.spinner')
      expect(spinner).toBeInTheDocument()
    })

    it('should display loading message while configuration is loading', async () => {
      // Mock loadConfig to delay resolution
      vi.mocked(loadConfig).mockImplementation(() => new Promise(() => {}))

      render(React.createElement(App))

      // Loading message should be visible
      const loadingMessage = screen.getByText('Loading configuration...')
      expect(loadingMessage).toBeInTheDocument()
    })

    it('should display loading message with correct styling', async () => {
      // Mock loadConfig to delay resolution
      vi.mocked(loadConfig).mockImplementation(() => new Promise(() => {}))

      const { container } = render(React.createElement(App))

      // Loading message should have correct class
      const loadingMessage = container.querySelector('.loading-message')
      expect(loadingMessage).toBeInTheDocument()
      expect(loadingMessage).toHaveTextContent('Loading configuration...')
    })

    it('should display loading container with spinner and message', async () => {
      // Mock loadConfig to delay resolution
      vi.mocked(loadConfig).mockImplementation(() => new Promise(() => {}))

      const { container } = render(React.createElement(App))

      // Loading container should be visible
      const loadingContainer = container.querySelector('.loading-container')
      expect(loadingContainer).toBeInTheDocument()

      // Should contain spinner
      const spinner = container.querySelector('.spinner')
      expect(spinner).toBeInTheDocument()

      // Should contain loading message
      const loadingMessage = container.querySelector('.loading-message')
      expect(loadingMessage).toBeInTheDocument()
    })
  })

  describe('Loading Animation Completion', () => {
    it('should hide loading animation when configuration loads successfully', async () => {
      // Mock loadConfig to resolve immediately
      vi.mocked(loadConfig).mockResolvedValue(undefined)

      const { container } = render(React.createElement(App))

      // Wait for config to load
      await waitFor(() => {
        expect(screen.getByTestId('login-component')).toBeInTheDocument()
      })

      // Loading spinner should not be visible
      const spinner = container.querySelector('.spinner')
      expect(spinner).not.toBeInTheDocument()

      // Loading message should not be visible
      const loadingMessage = screen.queryByText('Loading configuration...')
      expect(loadingMessage).not.toBeInTheDocument()
    })

    it('should hide loading animation when configuration fails', async () => {
      // Mock loadConfig to reject
      vi.mocked(loadConfig).mockRejectedValue(new Error('Config error'))

      const { container } = render(React.createElement(App))

      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getByText('Configuration Error')).toBeInTheDocument()
      })

      // Loading spinner should not be visible
      const spinner = container.querySelector('.spinner')
      expect(spinner).not.toBeInTheDocument()

      // Loading message should not be visible
      const loadingMessage = screen.queryByText('Loading configuration...')
      expect(loadingMessage).not.toBeInTheDocument()
    })
  })

  describe('Loading Animation Styling', () => {
    it('should have spinner with correct CSS class', async () => {
      // Mock loadConfig to delay resolution
      vi.mocked(loadConfig).mockImplementation(() => new Promise(() => {}))

      const { container } = render(React.createElement(App))

      // Spinner should have correct class
      const spinner = container.querySelector('.spinner')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('spinner')
    })

    it('should have loading container with correct CSS class', async () => {
      // Mock loadConfig to delay resolution
      vi.mocked(loadConfig).mockImplementation(() => new Promise(() => {}))

      const { container } = render(React.createElement(App))

      // Loading container should have correct class
      const loadingContainer = container.querySelector('.loading-container')
      expect(loadingContainer).toBeInTheDocument()
      expect(loadingContainer).toHaveClass('loading-container')
    })
  })
})

describe('App Component - Logout Confirmation Dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(loadConfig).mockResolvedValue(undefined)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  const setupAuthenticatedApp = async () => {
    // Wait for config to load and login component to appear
    await waitFor(() => {
      expect(screen.getByTestId('login-component')).toBeInTheDocument()
    })

    // Trigger login
    const loginButton = screen.getByText('Mock Login Success')
    fireEvent.click(loginButton)

    // Wait for authenticated state (file upload component visible)
    await waitFor(() => {
      expect(screen.getByTestId('file-upload-component')).toBeInTheDocument()
    })
  }

  describe('Dialog Display', () => {
    it('should not display logout confirmation dialog initially', async () => {
      render(React.createElement(App))
      await setupAuthenticatedApp()

      // Dialog should not be visible
      const dialog = screen.queryByText('Are you sure you want to log out?')
      expect(dialog).not.toBeInTheDocument()
    })

    it('should display logout confirmation dialog when logout button is clicked', async () => {
      render(React.createElement(App))
      await setupAuthenticatedApp()

      // Click logout button
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)

      // Dialog should be visible
      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument()
      })
    })

    it('should display confirmation dialog with correct message', async () => {
      render(React.createElement(App))
      await setupAuthenticatedApp()

      // Click logout button
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)

      // Check dialog content
      await waitFor(() => {
        expect(screen.getByText('Confirm Logout')).toBeInTheDocument()
        expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument()
      })
    })

    it('should display Cancel and Logout buttons in dialog', async () => {
      render(React.createElement(App))
      await setupAuthenticatedApp()

      // Click logout button
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)

      // Check for buttons
      await waitFor(() => {
        const buttons = screen.getAllByText('Cancel')
        const logoutButtons = screen.getAllByText('Logout')
        expect(buttons.length).toBeGreaterThan(0)
        expect(logoutButtons.length).toBeGreaterThan(1) // Header logout + dialog logout
      })
    })
  })

  describe('Cancel Button', () => {
    it('should close dialog when Cancel button is clicked', async () => {
      render(React.createElement(App))
      await setupAuthenticatedApp()

      // Click logout button
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument()
      })

      // Click Cancel button
      const cancelButtons = screen.getAllByText('Cancel')
      fireEvent.click(cancelButtons[0])

      // Dialog should be closed
      await waitFor(() => {
        expect(screen.queryByText('Are you sure you want to log out?')).not.toBeInTheDocument()
      })
    })

    it('should not clear credentials when Cancel button is clicked', async () => {
      render(React.createElement(App))
      await setupAuthenticatedApp()

      // Click logout button
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument()
      })

      // Click Cancel button
      const cancelButtons = screen.getAllByText('Cancel')
      fireEvent.click(cancelButtons[0])

      // clearCredentials should not have been called
      expect(authService.clearCredentials).not.toHaveBeenCalled()
    })

    it('should keep user authenticated when Cancel button is clicked', async () => {
      render(React.createElement(App))
      await setupAuthenticatedApp()

      // Verify authenticated state (file upload component visible)
      expect(screen.getByTestId('file-upload-component')).toBeInTheDocument()

      // Click logout button
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument()
      })

      // Click Cancel button
      const cancelButtons = screen.getAllByText('Cancel')
      fireEvent.click(cancelButtons[0])

      // User should still be authenticated
      await waitFor(() => {
        expect(screen.getByTestId('file-upload-component')).toBeInTheDocument()
      })
    })
  })

  describe('Logout Button', () => {
    it('should clear credentials when Logout button is clicked', async () => {
      render(React.createElement(App))
      await setupAuthenticatedApp()

      // Click logout button
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument()
      })

      // Click Logout button in dialog
      const logoutButtons = screen.getAllByText('Logout')
      fireEvent.click(logoutButtons[logoutButtons.length - 1]) // Click the dialog logout button

      // clearCredentials should have been called
      expect(authService.clearCredentials).toHaveBeenCalled()
    })

    it('should close dialog when Logout button is clicked', async () => {
      render(React.createElement(App))
      await setupAuthenticatedApp()

      // Click logout button
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument()
      })

      // Click Logout button in dialog
      const logoutButtons = screen.getAllByText('Logout')
      fireEvent.click(logoutButtons[logoutButtons.length - 1])

      // Dialog should be closed
      await waitFor(() => {
        expect(screen.queryByText('Are you sure you want to log out?')).not.toBeInTheDocument()
      })
    })

    it('should redirect to login page when Logout button is clicked', async () => {
      render(React.createElement(App))
      await setupAuthenticatedApp()

      // Verify authenticated state
      expect(screen.getByTestId('file-upload-component')).toBeInTheDocument()

      // Click logout button
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument()
      })

      // Click Logout button in dialog
      const logoutButtons = screen.getAllByText('Logout')
      fireEvent.click(logoutButtons[logoutButtons.length - 1])

      // Should redirect to login page
      await waitFor(() => {
        expect(screen.getByTestId('login-component')).toBeInTheDocument()
        expect(screen.queryByTestId('file-upload-component')).not.toBeInTheDocument()
      })
    })
  })

  describe('Modal Overlay', () => {
    it('should close dialog when clicking on modal overlay', async () => {
      const { container } = render(React.createElement(App))
      await setupAuthenticatedApp()

      // Click logout button
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument()
      })

      // Click on modal overlay
      const overlay = container.querySelector('.modal-overlay')
      if (overlay) {
        fireEvent.click(overlay)
      }

      // Dialog should be closed
      await waitFor(() => {
        expect(screen.queryByText('Are you sure you want to log out?')).not.toBeInTheDocument()
      })
    })

    it('should not close dialog when clicking on modal content', async () => {
      const { container } = render(React.createElement(App))
      await setupAuthenticatedApp()

      // Click logout button
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument()
      })

      // Click on modal content
      const modalContent = container.querySelector('.modal-content')
      if (modalContent) {
        fireEvent.click(modalContent)
      }

      // Dialog should still be visible
      expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument()
    })
  })

  describe('Logout Performance', () => {
    it('should complete logout within 100ms', async () => {
      render(React.createElement(App))
      await setupAuthenticatedApp()

      // Click logout button
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument()
      })

      // Measure logout time
      const startTime = performance.now()

      // Click Logout button in dialog
      const logoutButtons = screen.getAllByText('Logout')
      fireEvent.click(logoutButtons[logoutButtons.length - 1])

      const endTime = performance.now()
      const duration = endTime - startTime

      // Logout should complete within 100ms
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Dialog Styling', () => {
    it('should have modal-overlay class on overlay', async () => {
      const { container } = render(React.createElement(App))
      await setupAuthenticatedApp()

      // Click logout button
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument()
      })

      // Check for modal-overlay class
      const overlay = container.querySelector('.modal-overlay')
      expect(overlay).toBeInTheDocument()
    })

    it('should have modal-dialog class on dialog', async () => {
      const { container } = render(React.createElement(App))
      await setupAuthenticatedApp()

      // Click logout button
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument()
      })

      // Check for modal-dialog class
      const dialog = container.querySelector('.modal-dialog')
      expect(dialog).toBeInTheDocument()
    })

    it('should have btn-cancel class on Cancel button', async () => {
      const { container } = render(React.createElement(App))
      await setupAuthenticatedApp()

      // Click logout button
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument()
      })

      // Check for btn-cancel class
      const cancelButton = container.querySelector('.btn-cancel')
      expect(cancelButton).toBeInTheDocument()
    })

    it('should have btn-logout class on Logout button', async () => {
      const { container } = render(React.createElement(App))
      await setupAuthenticatedApp()

      // Click logout button
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument()
      })

      // Check for btn-logout class
      const logoutButton2 = container.querySelector('.btn-logout')
      expect(logoutButton2).toBeInTheDocument()
    })
  })
})
