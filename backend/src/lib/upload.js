import multer from 'multer'
import { MAX_FILE_BYTES } from '../config/constants.js'

// Files are held in memory just long enough to be validated and written to GridFS.
// The hard cap is a little above the 10 MB rule so collectUploads() can return a friendly per-file message.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES + 2 * 1024 * 1024, files: 20, fields: 80, fieldSize: 1024 * 1024 },
}).any()

/**
 * FormData-style view over a multer request, so handlers can use form.get(name) / form.getAll(name):
 * text fields come back as strings, uploaded files as { name, size, arrayBuffer() }.
 */
export function formData(req) {
  const body = req.body ?? {}
  const files = (req.files ?? []).map((f) => ({
    fieldname: f.fieldname,
    name: f.originalname,
    size: f.size,
    arrayBuffer: async () => f.buffer.buffer.slice(f.buffer.byteOffset, f.buffer.byteOffset + f.buffer.byteLength),
  }))
  const all = (key) => [...files.filter((f) => f.fieldname === key), ...[].concat(body[key] ?? []).map(String)]
  return { get: (key) => all(key)[0] ?? null, getAll: (key) => all(key) }
}
