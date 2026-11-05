import { Router } from 'express'
import { route, ApiError, assertObjectId, HANDLED } from '../../../lib/http.js'
import { canAccessFile, openDownload } from '../../../lib/files.js'
import { FileAsset } from '../../../models/FileAsset.js'

const GET = route(async ({ req, res, user, params }) => {
  assertObjectId(params.id, 'file id')
  const asset = await FileAsset.findById(params.id)
  // Same 404 for "missing" and "not yours" so file ids can't be probed.
  if (!asset || !(await canAccessFile(user, asset))) throw new ApiError(404, 'File not found.')

  const download = req.query.download === '1'
  res.set({
    'Content-Type': asset.mime,
    'Content-Length': String(asset.size),
    'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${asset.filename.replace(/"/g, '')}"`,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, max-age=300',
  })
  const stream = openDownload(asset)
  stream.on('error', () => res.destroy())
  stream.pipe(res)
  return HANDLED
})

const router = Router({ mergeParams: true })
router.get('/', GET)
export default router
