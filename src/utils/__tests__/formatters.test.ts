import { describe, it, expect } from 'vitest'
import { formatFileSize } from '../formatters'

describe('formatFileSize', () => {
  describe('KB formatting (< 1MB)', () => {
    it('should format 0 bytes as 0.00 KB', () => {
      expect(formatFileSize(0)).toBe('0.00 KB')
    })

    it('should format 1 byte as 0.00 KB', () => {
      expect(formatFileSize(1)).toBe('0.00 KB')
    })

    it('should format 512 bytes as 0.50 KB', () => {
      expect(formatFileSize(512)).toBe('0.50 KB')
    })

    it('should format 1 KB (1024 bytes) as 1.00 KB', () => {
      expect(formatFileSize(1024)).toBe('1.00 KB')
    })

    it('should format 10 KB as 10.00 KB', () => {
      expect(formatFileSize(10 * 1024)).toBe('10.00 KB')
    })

    it('should format 500 KB as 500.00 KB', () => {
      expect(formatFileSize(500 * 1024)).toBe('500.00 KB')
    })

    it('should format 1023 KB as 1023.00 KB (just under 1MB)', () => {
      expect(formatFileSize(1023 * 1024)).toBe('1023.00 KB')
    })
  })

  describe('MB formatting (1MB - 1GB)', () => {
    it('should format 1 MB as 1.00 MB', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB')
    })

    it('should format 1.5 MB as 1.50 MB', () => {
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.50 MB')
    })

    it('should format 10 MB as 10.00 MB', () => {
      expect(formatFileSize(10 * 1024 * 1024)).toBe('10.00 MB')
    })

    it('should format 100 MB as 100.00 MB', () => {
      expect(formatFileSize(100 * 1024 * 1024)).toBe('100.00 MB')
    })

    it('should format 500 MB as 500.00 MB', () => {
      expect(formatFileSize(500 * 1024 * 1024)).toBe('500.00 MB')
    })

    it('should format 1023 MB as 1023.00 MB (just under 1GB)', () => {
      expect(formatFileSize(1023 * 1024 * 1024)).toBe('1023.00 MB')
    })
  })

  describe('GB formatting (> 1GB)', () => {
    it('should format 1 GB as 1.00 GB', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB')
    })

    it('should format 1.5 GB as 1.50 GB', () => {
      expect(formatFileSize(1.5 * 1024 * 1024 * 1024)).toBe('1.50 GB')
    })

    it('should format 10 GB as 10.00 GB', () => {
      expect(formatFileSize(10 * 1024 * 1024 * 1024)).toBe('10.00 GB')
    })

    it('should format 100 GB as 100.00 GB', () => {
      expect(formatFileSize(100 * 1024 * 1024 * 1024)).toBe('100.00 GB')
    })

    it('should format 1000 GB as 1000.00 GB', () => {
      expect(formatFileSize(1000 * 1024 * 1024 * 1024)).toBe('1000.00 GB')
    })
  })

  describe('decimal precision', () => {
    it('should round to 2 decimal places for KB', () => {
      expect(formatFileSize(1536)).toBe('1.50 KB') // 1.5 KB
    })

    it('should round to 2 decimal places for MB', () => {
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.50 MB')
    })

    it('should round to 2 decimal places for GB', () => {
      expect(formatFileSize(1.5 * 1024 * 1024 * 1024)).toBe('1.50 GB')
    })

    it('should handle rounding up for KB', () => {
      expect(formatFileSize(1536.5)).toBe('1.50 KB')
    })

    it('should handle rounding down for KB', () => {
      expect(formatFileSize(1536.4)).toBe('1.50 KB')
    })
  })

  describe('boundary cases', () => {
    it('should format exactly 1MB boundary as MB', () => {
      const oneMB = 1024 * 1024
      expect(formatFileSize(oneMB)).toBe('1.00 MB')
    })

    it('should format exactly 1GB boundary as GB', () => {
      const oneGB = 1024 * 1024 * 1024
      expect(formatFileSize(oneGB)).toBe('1.00 GB')
    })

    it('should format 1 byte less than 1MB as KB', () => {
      const justUnderMB = 1024 * 1024 - 1
      expect(formatFileSize(justUnderMB)).toBe('1024.00 KB')
    })

    it('should format 1 byte less than 1GB as MB', () => {
      const justUnderGB = 1024 * 1024 * 1024 - 1
      expect(formatFileSize(justUnderGB)).toBe('1024.00 MB')
    })
  })
})
