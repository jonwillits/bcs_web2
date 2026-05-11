import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

/**
 * Read and validate the encryption key from environment.
 * Must be exactly 32 bytes (64 hex characters).
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.CANVAS_TOKEN_ENCRYPTION_KEY
  if (!keyHex) {
    throw new Error(
      'CANVAS_TOKEN_ENCRYPTION_KEY environment variable is required for Canvas token encryption. ' +
      'Generate one with: openssl rand -hex 32'
    )
  }
  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new Error(
      'CANVAS_TOKEN_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes).'
    )
  }
  return Buffer.from(keyHex, 'hex')
}

/**
 * Encrypt a plaintext Canvas API token.
 * Returns a string in the format: iv_hex:authTag_hex:ciphertext_hex
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * Decrypt an encrypted Canvas API token.
 * Expects the format: iv_hex:authTag_hex:ciphertext_hex
 * Returns null if decryption fails (e.g. key rotation).
 */
export function decrypt(stored: string): string | null {
  try {
    const key = getEncryptionKey()
    const parts = stored.split(':')
    if (parts.length !== 3) return null

    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const ciphertext = Buffer.from(parts[2], 'hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    return decrypted.toString('utf8')
  } catch {
    // Decryption failed — likely key rotation or tampered data
    return null
  }
}
