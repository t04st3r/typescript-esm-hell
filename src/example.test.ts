import { describe, it, expect } from 'vitest'
import { Example } from './example.ts'

describe('Example', () => {
  it('should initialize with the provided name', () => {
    const example = new Example('test')
    expect(example.name).toBe('test')
  })

  it('should update name via setter', () => {
    const example = new Example('initial')
    example.name = 'updated'
    expect(example.name).toBe('updated')
  })

  it('should handle empty string', () => {
    const example = new Example('')
    expect(example.name).toBe('')
  })
})
