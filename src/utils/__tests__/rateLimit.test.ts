import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { debounce, throttle, preventRapidClicks } from '../rateLimit'

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should delay function execution until after wait time', () => {
    const func = vi.fn()
    const debounced = debounce(func, 100)

    debounced()
    expect(func).not.toHaveBeenCalled()

    vi.advanceTimersByTime(99)
    expect(func).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(func).toHaveBeenCalledTimes(1)
  })

  it('should reset timer on subsequent calls', () => {
    const func = vi.fn()
    const debounced = debounce(func, 100)

    debounced()
    vi.advanceTimersByTime(50)
    debounced()
    vi.advanceTimersByTime(50)
    expect(func).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)
    expect(func).toHaveBeenCalledTimes(1)
  })

  it('should pass arguments to the debounced function', () => {
    const func = vi.fn()
    const debounced = debounce(func, 100)

    debounced('arg1', 'arg2')
    vi.advanceTimersByTime(100)

    expect(func).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('should only execute once for multiple rapid calls', () => {
    const func = vi.fn()
    const debounced = debounce(func, 100)

    debounced()
    debounced()
    debounced()
    debounced()

    vi.advanceTimersByTime(100)
    expect(func).toHaveBeenCalledTimes(1)
  })

  it('should use the last call arguments', () => {
    const func = vi.fn()
    const debounced = debounce(func, 100)

    debounced('first')
    debounced('second')
    debounced('third')

    vi.advanceTimersByTime(100)
    expect(func).toHaveBeenCalledWith('third')
  })

  it('should handle zero wait time', () => {
    const func = vi.fn()
    const debounced = debounce(func, 0)

    debounced()
    vi.advanceTimersByTime(0)

    expect(func).toHaveBeenCalledTimes(1)
  })
})

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should execute immediately on first call', () => {
    const func = vi.fn()
    const throttled = throttle(func, 100)

    throttled()
    expect(func).toHaveBeenCalledTimes(1)
  })

  it('should not execute again within wait period', () => {
    const func = vi.fn()
    const throttled = throttle(func, 100)

    throttled()
    throttled()
    throttled()

    expect(func).toHaveBeenCalledTimes(1)
  })

  it('should execute again after wait period', () => {
    const func = vi.fn()
    const throttled = throttle(func, 100)

    throttled()
    expect(func).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)
    throttled()
    expect(func).toHaveBeenCalledTimes(2)
  })

  it('should schedule delayed execution for calls within wait period', () => {
    const func = vi.fn()
    const throttled = throttle(func, 100)

    throttled()
    expect(func).toHaveBeenCalledTimes(1)

    throttled() // This should be scheduled
    expect(func).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)
    expect(func).toHaveBeenCalledTimes(2)
  })

  it('should pass arguments to the throttled function', () => {
    const func = vi.fn()
    const throttled = throttle(func, 100)

    throttled('arg1', 'arg2')
    expect(func).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('should handle multiple calls with different arguments', () => {
    const func = vi.fn()
    const throttled = throttle(func, 100)

    throttled('first')
    expect(func).toHaveBeenCalledWith('first')

    throttled('second') // Scheduled
    vi.advanceTimersByTime(100)
    expect(func).toHaveBeenCalledWith('second')
  })

  it('should handle zero wait time', () => {
    const func = vi.fn()
    const throttled = throttle(func, 0)

    throttled()
    throttled()
    throttled()

    expect(func).toHaveBeenCalledTimes(3)
  })
})

describe('preventRapidClicks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should execute callback on first click', async () => {
    const callback = vi.fn().mockResolvedValue(undefined)
    const handler = preventRapidClicks(callback, 1000)

    await handler()
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should prevent execution during cooldown period', async () => {
    const callback = vi.fn().mockResolvedValue(undefined)
    const handler = preventRapidClicks(callback, 1000)

    await handler()
    await handler()
    await handler()

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should allow execution after cooldown period', async () => {
    const callback = vi.fn().mockResolvedValue(undefined)
    const handler = preventRapidClicks(callback, 1000)

    await handler()
    expect(callback).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1000)

    await handler()
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('should pass arguments to the callback', async () => {
    const callback = vi.fn().mockResolvedValue(undefined)
    const handler = preventRapidClicks(callback, 1000)

    await handler('arg1', 'arg2')
    expect(callback).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('should handle callback errors and still apply cooldown', async () => {
    const callback = vi.fn().mockRejectedValue(new Error('Test error'))
    const handler = preventRapidClicks(callback, 1000)

    await expect(handler()).rejects.toThrow('Test error')
    expect(callback).toHaveBeenCalledTimes(1)

    // Should still be in cooldown
    await handler()
    expect(callback).toHaveBeenCalledTimes(1)

    // After cooldown, should work again
    vi.advanceTimersByTime(1000)
    await expect(handler()).rejects.toThrow('Test error')
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('should use default cooldown of 1000ms', async () => {
    const callback = vi.fn().mockResolvedValue(undefined)
    const handler = preventRapidClicks(callback)

    await handler()
    expect(callback).toHaveBeenCalledTimes(1)

    await handler()
    expect(callback).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1000)
    await handler()
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('should handle custom cooldown periods', async () => {
    const callback = vi.fn().mockResolvedValue(undefined)
    const handler = preventRapidClicks(callback, 500)

    await handler()
    expect(callback).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(500)
    await handler()
    expect(callback).toHaveBeenCalledTimes(2)
  })
})
