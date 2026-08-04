import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyText } from './clipboard'

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')

describe('copyText', () => {
  afterEach(() => {
    if (originalClipboard === undefined) {
      Reflect.deleteProperty(navigator, 'clipboard')
    } else {
      Object.defineProperty(navigator, 'clipboard', originalClipboard)
    }
  })

  it('writes text through the browser clipboard API', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    await copyText('http://localhost:8080/example')

    expect(writeText).toHaveBeenCalledWith('http://localhost:8080/example')
  })

  it('reports when the browser does not support clipboard access', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    })

    await expect(copyText('example')).rejects.toThrow(
      'Copying is not supported by this browser',
    )
  })
})
