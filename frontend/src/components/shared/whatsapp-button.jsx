import { whatsappUrl } from '@/config/site'

// Official-style WhatsApp glyph (lucide has no brand icons).
const WhatsAppGlyph = () => (
  <svg viewBox="0 0 32 32" width="30" height="30" fill="currentColor" aria-hidden="true">
    <path d="M16.04 3C8.84 3 3 8.8 3 15.95c0 2.28.6 4.5 1.74 6.46L3 29l6.77-1.7a13.1 13.1 0 0 0 6.27 1.6C23.2 28.9 29 23.1 29 15.95S23.2 3 16.04 3zm0 23.7c-1.95 0-3.86-.52-5.53-1.5l-.4-.23-4.02 1 1.07-3.9-.26-.4a10.6 10.6 0 0 1-1.63-5.7c0-5.86 4.8-10.63 10.7-10.63 5.9 0 10.7 4.77 10.7 10.63 0 5.87-4.8 10.73-10.63 10.73zm5.85-7.95c-.32-.16-1.9-.93-2.2-1.04-.3-.1-.5-.16-.72.16-.22.32-.83 1.04-1.02 1.26-.18.22-.37.24-.7.08-.32-.16-1.35-.5-2.58-1.58-.95-.84-1.6-1.88-1.78-2.2-.18-.32-.02-.5.14-.66.15-.14.32-.37.48-.55.16-.18.22-.32.32-.53.1-.22.05-.4-.03-.56-.08-.16-.72-1.72-.98-2.36-.26-.62-.52-.54-.72-.55h-.62c-.22 0-.56.08-.86.4-.3.32-1.12 1.1-1.12 2.68s1.15 3.1 1.3 3.32c.16.22 2.26 3.44 5.46 4.82.76.33 1.36.52 1.82.67.77.24 1.46.2 2.01.12.61-.09 1.9-.78 2.16-1.53.27-.75.27-1.4.19-1.53-.08-.13-.3-.21-.62-.37z" />
  </svg>
)

/** Floating "chat on WhatsApp" button, fixed to the bottom-right corner of every page. */
export function WhatsAppButton() {
  return (
    <a
      className="whatsapp-fab"
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
    >
      <WhatsAppGlyph />
      <span className="whatsapp-fab__label">Chat on WhatsApp</span>
    </a>
  )
}
