import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { Login } from '../Login'
import { authService } from '../../services/authService'

// Mock the authService
vi.mock('../../services/authService', () => ({
  authService: {
    getLoginUrl: vi.fn(),
    exchangeCodeForToken: vi.fn(),
    setIdToken: vi.fn(),
    validateStateParameter: vi.fn(),
  },
}))

describe('Login Component', () => {
  let mockOnLoginSuccess: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnLoginSuccess = vi.fn()
    vi.clearAllMocks()
    // Reset URL
    window.history.replaceState({}, document.title, window.location.pathname)
  })

  afterEach(() => {
    // Clean up after each test
    window.history.replaceState({}, document.title, window.location.pathname)
  })

  describe('Error Display', () => {
    it('should not display error message initially', () => {
      render(React.createElement(Login, { onLoginSuccess: mockOnLoginSuccess }))
      const errorElement = screen.queryByText(/Invalid authorization state|Failed to exchange|timed out/i)
      expect(errorElement).not.toBeInTheDocument()
    })

    it('should display error message when state validation fails', async () => {
      const errorMessage = 'Invalid authorization state'
      vi.mocked(authService.validateStateParameter).mockImplementation(() => {
        throw new Error(errorMessage)
      })

      // Set up URL with code and state
      window.history.replaceState({}, document.title, '?code=test_code&state=test_state')

      render(React.createElement(Login, { onLoginSuccess: mockOnLoginSuccess }))

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })

    it('should display error message when token exchange fails', async () => {
      const errorMessage = 'Failed to exchange code for token'
      vi.mocked(authService.validateStateParameter).mockImplementation(() => {})
      vi.mocked(authService.exchangeCodeForToken).mockRejectedValue(new Error(errorMessage))

      // Set up URL with code and state
      window.history.replaceState({}, document.title, '?code=test_code&state=test_state')

      render(React.createElement(Login, { onLoginSuccess: mockOnLoginSuccess }))

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })

    it('should display timeout error message', async () => {
      const errorMessage = 'Token exchange request timed out after 10 seconds'
      vi.mocked(authService.validateStateParameter).mockImplementation(() => {})
      vi.mocked(authService.exchangeCodeForToken).mockRejectedValue(new Error(errorMessage))

      // Set up URL with code and state
      window.history.replaceState({}, document.title, '?code=test_code&state=test_state')

      render(React.createElement(Login, { onLoginSuccess: mockOnLoginSuccess }))

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })

    it('should have error-message class for styling', async () => {
      const errorMessage = 'Invalid authorization state'
      vi.mocked(authService.validateStateParameter).mockImplementation(() => {
        throw new Error(errorMessage)
      })

      // Set up URL with code and state
      window.history.replaceState({}, document.title, '?code=test_code&state=test_state')

      render(React.createElement(Login, { onLoginSuccess: mockOnLoginSuccess }))

      await waitFor(() => {
        const errorElement = screen.getByText(errorMessage)
        expect(errorElement).toHaveClass('error-message')
      })
    })
  })

  describe('Error Clearing', () => {
    it('should clear error when login button is clicked', async () => {
      const errorMessage = 'Invalid authorization state'
      vi.mocked(authService.validateStateParameter).mockImplementation(() => {
        throw new Error(errorMessage)
      })

      // Set up URL with code and state to trigger error
      window.history.replaceState({}, document.title, '?code=test_code&state=test_state')

      render(React.createElement(Login, { onLoginSuccess: mockOnLoginSuccess }))

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })

      // Reset URL to remove code/state
      window.history.replaceState({}, document.title, window.location.pathname)

      // Mock successful login URL
      vi.mocked(authService.getLoginUrl).mockReturnValue('https://cognito.example.com/login')

      // Click login button
      const loginButton = screen.getByText('Login with Cognito')
      fireEvent.click(loginButton)

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(errorMessage)).not.toBeInTheDocument()
      })
    })

    it('should clear error on successful login', async () => {
      vi.mocked(authService.validateStateParameter).mockImplementation(() => {})
      vi.mocked(authService.exchangeCodeForToken).mockResolvedValue('test_token')

      // Set up URL with code and state
      window.history.replaceState({}, document.title, '?code=test_code&state=test_state')

      render(React.createElement(Login, { onLoginSuccess: mockOnLoginSuccess }))

      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalled()
        expect(authService.setIdToken).toHaveBeenCalledWith('test_token')
      })
    })
  })

  describe('Login Button Behavior', () => {
    it('should clear error when login button is clicked', async () => {
      const errorMessage = 'Invalid authorization state'
      vi.mocked(authService.validateStateParameter).mockImplementation(() => {
        throw new Error(errorMessage)
      })

      // Set up URL with code and state
      window.history.replaceState({}, document.title, '?code=test_code&state=test_state')

      render(React.createElement(Login, { onLoginSuccess: mockOnLoginSuccess }))

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })

      // Reset URL
      window.history.replaceState({}, document.title, window.location.pathname)

      // Mock getLoginUrl
      vi.mocked(authService.getLoginUrl).mockReturnValue('https://cognito.example.com/login')

      // Click login button
      const loginButton = screen.getByText('Login with Cognito')
      fireEvent.click(loginButton)

      // Error should be cleared before redirect
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument()
    })

    it('should call getLoginUrl when login button is clicked', () => {
      const loginUrl = 'https://cognito.example.com/oauth2/authorize?client_id=test'
      vi.mocked(authService.getLoginUrl).mockReturnValue(loginUrl)

      render(React.createElement(Login, { onLoginSuccess: mockOnLoginSuccess }))

      const loginButton = screen.getByText('Login with Cognito')
      fireEvent.click(loginButton)

      expect(authService.getLoginUrl).toHaveBeenCalled()
    })
  })

  describe('Retry Button Functionality', () => {
    it('should display retry button when error occurs', async () => {
      const errorMessage = 'Invalid authorization state'
      vi.mocked(authService.validateStateParameter).mockImplementation(() => {
        throw new Error(errorMessage)
      })

      // Set up URL with code and state
      window.history.replaceState({}, document.title, '?code=test_code&state=test_state')

      render(React.createElement(Login, { onLoginSuccess: mockOnLoginSuccess }))

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    it('should retry login when retry button is clicked', async () => {
      const errorMessage = 'Failed to exchange code for token'
      vi.mocked(authService.validateStateParameter).mockImplementation(() => {})
      vi.mocked(authService.exchangeCodeForToken).mockRejectedValue(new Error(errorMessage))

      // Set up URL with code and state
      window.history.replaceState({}, document.title, '?code=test_code&state=test_state')

      render(React.createElement(Login, { onLoginSuccess: mockOnLoginSuccess }))

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })

      // Reset URL
      window.history.replaceState({}, document.title, window.location.pathname)

      // Mock getLoginUrl
      const loginUrl = 'https://cognito.example.com/login'
      vi.mocked(authService.getLoginUrl).mockReturnValue(loginUrl)

      // Click retry button
      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)

      // Should call getLoginUrl
      expect(authService.getLoginUrl).toHaveBeenCalled()
    })

    it('should clear error when retry button is clicked', async () => {
      const errorMessage = 'Token exchange request timed out after 10 seconds'
      vi.mocked(authService.validateStateParameter).mockImplementation(() => {})
      vi.mocked(authService.exchangeCodeForToken).mockRejectedValue(new Error(errorMessage))

      // Set up URL with code and state
      window.history.replaceState({}, document.title, '?code=test_code&state=test_state')

      render(React.createElement(Login, { onLoginSuccess: mockOnLoginSuccess }))

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })

      // Reset URL
      window.history.replaceState({}, document.title, window.location.pathname)

      // Mock getLoginUrl
      vi.mocked(authService.getLoginUrl).mockReturnValue('https://cognito.example.com/login')

      // Click retry button
      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)

      // Error should be cleared
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument()
    })

    it('should have retry-button class for styling', async () => {
      const errorMessage = 'Invalid authorization state'
      vi.mocked(authService.validateStateParameter).mockImplementation(() => {
        throw new Error(errorMessage)
      })

      // Set up URL with code and state
      window.history.replaceState({}, document.title, '?code=test_code&state=test_state')

      render(React.createElement(Login, { onLoginSuccess: mockOnLoginSuccess }))

      await waitFor(() => {
        const retryButton = screen.getByText('Retry')
        expect(retryButton).toHaveClass('retry-button')
      })
    })
  })

  describe('UI Elements', () => {
    it('should display login page with title and button', () => {
      render(React.createElement(Login, { onLoginSuccess: mockOnLoginSuccess }))

      expect(screen.getByText('drive')).toBeInTheDocument()
      expect(screen.getByText('Sign in with your AWS Cognito account')).toBeInTheDocument()
      expect(screen.getByText('Login with Cognito')).toBeInTheDocument()
    })

    it('should have proper login container structure', () => {
      const { container } = render(React.createElement(Login, { onLoginSuccess: mockOnLoginSuccess }))

      const loginContainer = container.querySelector('.login-container')
      expect(loginContainer).toBeInTheDocument()

      const loginBox = container.querySelector('.login-box')
      expect(loginBox).toBeInTheDocument()
    })
  })

  describe('Error Message Content', () => {
    it('should display error message with proper styling', async () => {
      const errorMessage = 'Invalid authorization state'
      vi.mocked(authService.validateStateParameter).mockImplementation(() => {
        throw new Error(errorMessage)
      })

      // Set up URL with code and state
      window.history.replaceState({}, document.title, '?code=test_code&state=test_state')

      render(React.createElement(Login, { onLoginSuccess: mockOnLoginSuccess }))

      await waitFor(() => {
        const errorElement = screen.getByText(errorMessage)
        expect(errorElement).toBeInTheDocument()
        expect(errorElement).toHaveClass('error-message')
      })
    })
  })

  describe('Successful Login Flow', () => {
    it('should call onLoginSuccess when token exchange succeeds', async () => {
      vi.mocked(authService.validateStateParameter).mockImplementation(() => {})
      vi.mocked(authService.exchangeCodeForToken).mockResolvedValue('test_token')

      // Set up URL with code and state
      window.history.replaceState({}, document.title, '?code=test_code&state=test_state')

      render(React.createElement(Login, { onLoginSuccess: mockOnLoginSuccess }))

      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalled()
      })
    })

    it('should set ID token when login succeeds', async () => {
      vi.mocked(authService.validateStateParameter).mockImplementation(() => {})
      vi.mocked(authService.exchangeCodeForToken).mockResolvedValue('test_token')

      // Set up URL with code and state
      window.history.replaceState({}, document.title, '?code=test_code&state=test_state')

      render(React.createElement(Login, { onLoginSuccess: mockOnLoginSuccess }))

      await waitFor(() => {
        expect(authService.setIdToken).toHaveBeenCalledWith('test_token')
      })
    })
  })
})
