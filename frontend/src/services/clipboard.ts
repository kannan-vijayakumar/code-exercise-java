export async function copyText(text: string): Promise<void> {
  if (!navigator.clipboard) {
    throw new Error('Copying is not supported by this browser')
  }

  await navigator.clipboard.writeText(text)
}
