import mongoose from 'mongoose'
import { ApiError } from './http.js'
import { MAX_FILE_BYTES, MAX_FILE_MB } from '../config/constants.js'
import { FileAsset } from '../models/FileAsset.js'
import { Listing } from '../models/Listing.js'

const BUCKET = 'uploads'

function bucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET })
}

/** Detect the real file type from magic bytes — never trust the browser-supplied MIME type or extension. */
export function sniff(buf) {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg', type: 'image' }
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { mime: 'image/png', ext: 'png', type: 'image' }
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP')
    return { mime: 'image/webp', ext: 'webp', type: 'image' }
  if (buf.subarray(0, 5).toString('latin1') === '%PDF-') return { mime: 'application/pdf', ext: 'pdf', type: 'pdf' }
  return null
}

function cleanName(name, ext) {
  const base = String(name || 'file')
    .replace(/\.[^.]*$/, '')
    .replace(/[^\w\- ]+/g, '')
    .trim()
    .slice(0, 80)
  return `${base || 'file'}.${ext}`
}

/**
 * Pull File objects for `field` out of a multipart FormData, validate each one and return
 * [{ buffer, info, originalName }]. Nothing is stored yet, so a bad file rejects the whole request cleanly.
 * allow: ['image'] | ['pdf'] | ['image','pdf']
 */
export async function collectUploads(formData, field, { allow = ['image', 'pdf'], max = 10 } = {}) {
  const files = formData.getAll(field).filter((f) => typeof f === 'object' && f && 'arrayBuffer' in f && f.size > 0)
  if (files.length > max) throw new ApiError(400, `You can upload at most ${max} files here.`)

  const out = []
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      throw new ApiError(413, `"${file.name}" is larger than ${MAX_FILE_MB} MB.`)
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    const info = sniff(buffer)
    if (!info || !allow.includes(info.type)) {
      const label = allow.map((a) => (a === 'pdf' ? 'PDF' : 'JPG / PNG / WEBP')).join(' or ')
      throw new ApiError(400, `"${file.name}" is not a valid file. Allowed: ${label}.`)
    }
    out.push({ buffer, info, originalName: file.name })
  }
  return out
}

/** Write validated uploads to GridFS and create FileAsset records. */
export async function storeUploads(uploads, { kind, owner, listing = null, deal = null, label = '', buyerVisible = false }) {
  const saved = []
  try {
    for (const { buffer, info, originalName } of uploads) {
      const filename = cleanName(originalName, info.ext)
      const stream = bucket().openUploadStream(filename, { contentType: info.mime })
      await new Promise((resolve, reject) => {
        stream.on('error', reject)
        stream.on('finish', resolve)
        stream.end(buffer)
      })
      const asset = await FileAsset.create({
        gridfsId: stream.id,
        filename,
        mime: info.mime,
        size: buffer.length,
        kind,
        label,
        owner,
        listing,
        deal,
        buyerVisible,
      })
      saved.push(asset)
    }
    return saved
  } catch (error) {
    await Promise.all(saved.map((a) => deleteAsset(a)))
    throw error
  }
}

export async function deleteAsset(asset) {
  if (!asset) return
  try {
    await bucket().delete(asset.gridfsId)
  } catch {}
  await FileAsset.deleteOne({ _id: asset._id })
}

export function openDownload(asset) {
  return bucket().openDownloadStream(asset.gridfsId)
}

/**
 * Who may read a file?
 *  - admin: everything
 *  - owner: their own files
 *  - buyer: listing photos / buyer-approved documents of an ACTIVE listing in a category they are verified for
 *  - deal documents: uploader + admin only
 */
export async function canAccessFile(user, asset) {
  if (user.role === 'admin') return true
  if (String(asset.owner) === String(user._id)) return true

  if (asset.kind === 'kyc') return false

  // Deal documents (payment proofs, weighment slips) are only for the uploader and admins, so one party
  // can never see another party's paperwork.
  if (asset.kind === 'deal-document') return false

  if (user.role === 'buyer' && asset.listing && user.verificationStatus === 'approved') {
    const listing = await Listing.findById(asset.listing).select('status category images documents').lean()
    if (!listing || !['active', 'negotiation'].includes(listing.status)) return false
    if (!user.categories.includes(listing.category)) return false
    if (asset.kind === 'listing-image') return listing.images.some((id) => String(id) === String(asset._id))
    if (asset.kind === 'listing-document')
      return asset.buyerVisible && listing.documents.some((id) => String(id) === String(asset._id))
  }
  return false
}
