import { cn } from './utils'

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('base', 'override')).toBe('base override')
  })
  it('handles conditional classes', () => {
    expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
  })
  it('merges Tailwind conflicts (tailwind-merge)', () => {
    expect(cn('p-2 p-4')).toBe('p-4')
  })
})