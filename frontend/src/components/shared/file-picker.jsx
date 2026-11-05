import { useRef, useState } from 'react'
import { FileText, ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MAX_FILE_BYTES, MAX_FILE_MB } from '@/lib/constants'
import { formatBytes } from '@/lib/format'

const ACCEPT = {
  docs: '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png',
  images: '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp',
  pdf: '.pdf,application/pdf',
}
const OK_TYPES = {
  docs: ['application/pdf', 'image/jpeg', 'image/png'],
  images: ['image/jpeg', 'image/png', 'image/webp'],
  pdf: ['application/pdf'],
}

/**
 * Controlled multi-file picker.  files = File[]  ·  onChange(File[])
 * mode: 'docs' (PDF/JPG/PNG) | 'images' (JPG/PNG/WEBP) | 'pdf'
 */
export function FilePicker({ files, onChange, mode = 'docs', max = 8, buttonLabel = 'Select files', children }) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')

  const add = (picked) => {
    setError('')
    const next = [...files]
    for (const file of picked) {
      if (!OK_TYPES[mode].includes(file.type)) {
        setError(`"${file.name}" is not an allowed file type.`)
        continue
      }
      if (file.size > MAX_FILE_BYTES) {
        setError(`"${file.name}" is larger than ${MAX_FILE_MB} MB.`)
        continue
      }
      if (next.length >= max) {
        setError(`You can attach at most ${max} files.`)
        break
      }
      if (!next.some((f) => f.name === file.name && f.size === file.size)) next.push(file)
    }
    onChange(next)
  }

  return (
    <div className="file-picker">
      {children}
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept={ACCEPT[mode]}
        onChange={(event) => {
          add(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />
      <Button variant="secondary" onClick={() => inputRef.current?.click()}>
        {buttonLabel}
      </Button>
      {error && <p className="file-picker__error">{error}</p>}
      {files.length > 0 && (
        <ul className="file-list">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.size}`}>
              {file.type === 'application/pdf' ? <FileText size={16} /> : <ImageIcon size={16} />}
              <span>{file.name}</span>
              <small>{formatBytes(file.size)}</small>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
