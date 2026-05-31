import { describe, it, expect } from 'vitest'
import { stripUserPrefix } from '../index'

describe('stripUserPrefix', () => {
  it('should strip user prefix from a valid S3 key', () => {
    const key = 'user-123/document.pdf'
    const result = stripUserPrefix(key)
    expect(result).toBe('document.pdf')
  })

  it('should handle filenames with multiple slashes', () => {
    const key = 'user-456/folder/subfolder/file.txt'
    const result = stripUserPrefix(key)
    expect(result).toBe('folder/subfolder/file.txt')
  })

  it('should handle filenames with dots', () => {
    const key = 'user-789/my.document.v2.pdf'
    const result = stripUserPrefix(key)
    expect(result).toBe('my.document.v2.pdf')
  })

  it('should handle filenames with special characters', () => {
    const key = 'user-abc/file-name_2024 (1).txt'
    const result = stripUserPrefix(key)
    expect(result).toBe('file-name_2024 (1).txt')
  })

  it('should throw error for empty key', () => {
    expect(() => stripUserPrefix('')).toThrow('Key cannot be empty')
  })

  it('should throw error for key without slash', () => {
    const key = 'user-123'
    expect(() => stripUserPrefix(key)).toThrow('Invalid S3 key format: expected "{userId}/{filename}"')
  })

  it('should throw error for key with only slash', () => {
    const key = 'user-123/'
    const result = stripUserPrefix(key)
    expect(result).toBe('')
  })

  it('should handle numeric user IDs', () => {
    const key = '12345/report.xlsx'
    const result = stripUserPrefix(key)
    expect(result).toBe('report.xlsx')
  })

  it('should handle UUID-like user IDs', () => {
    const key = '550e8400-e29b-41d4-a716-446655440000/data.json'
    const result = stripUserPrefix(key)
    expect(result).toBe('data.json')
  })

  it('should handle filenames with spaces', () => {
    const key = 'user-xyz/My Important Document.docx'
    const result = stripUserPrefix(key)
    expect(result).toBe('My Important Document.docx')
  })
})
