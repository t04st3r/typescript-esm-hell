import { Example } from './example.js'
import { expect } from 'chai';

describe('Example', () => {
  it('should initialize with the provided name', () => {
    const example = new Example('test')
    expect(example.name).to.equal('test')
  })

  it('should update name via setter', () => {
    const example = new Example('initial')
    example.name = 'updated'
    expect(example.name).to.equal('updated')
  })

  it('should handle empty string', () => {
    const example = new Example('')
    expect(example.name).to.equal('')
  })
})
