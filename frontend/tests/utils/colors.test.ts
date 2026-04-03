import { describe, it, expect } from 'vitest'
import { getContrastColor } from '../src/utils/colors'

describe('getContrastColor', () => {
  it('should return dark color for light backgrounds', () => {
    expect(getContrastColor('#ffffff')).toBe('#1f2937')
    expect(getContrastColor('#f0f0f0')).toBe('#1f2937')
    expect(getContrastColor('#e5e7eb')).toBe('#1f2937')
  })

  it('should return light color for dark backgrounds', () => {
    expect(getContrastColor('#000000')).toBe('#ffffff')
    expect(getContrastColor('#1f2937')).toBe('#ffffff')
    expect(getContrastColor('#111827')).toBe('#ffffff')
  })

  it('should handle hex without hash', () => {
    expect(getContrastColor('ffffff')).toBe('#1f2937')
    expect(getContrastColor('000000')).toBe('#ffffff')
  })

  it('should handle mixed case', () => {
    expect(getContrastColor('#AbC123')).toBe('#1f2937')
  })
})