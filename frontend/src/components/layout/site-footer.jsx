import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/logo'

const link = 'text-[12px] text-[#9aa8b7] hover:text-white sm:text-[13px]'
const heading = 'mb-1 text-[11px] font-bold tracking-[0.12em] text-[#d7dee5]'
const label = 'text-[10px] font-bold tracking-[0.12em] text-[#718091]'

/** Public-site footer, shared by the home and contact pages. Section links work from any page (/#how etc.). */
export function SiteFooter() {
  return (
    <footer className="relative bg-[#101820] px-5 py-6 text-white sm:px-8 sm:py-7 lg:px-[7%]">
      {/* Top section */}
      <div className="grid grid-cols-2 gap-x-5 gap-y-5 border-b border-white/10 pb-6 lg:grid-cols-[1.65fr_1fr_1fr_1.35fr] lg:gap-10">
        <div className="col-span-2 max-w-[400px] lg:col-span-1">
          <Logo inverse />
          <p className="mt-1.5 text-[12px] leading-5 text-[#9aa8b7] sm:text-[13px]">
            India&apos;s B2B scrap marketplace for verified sellers and recyclers, with mediated
            transactions and compliance-focused workflows.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2.5">
          <b className={heading}>PLATFORM</b>
          <Link to="/marketplace" className={link}>Browse Lots</Link>
          <Link to="/#how" className={link}>How It Works</Link>
        </div>

        <div className="flex flex-col items-start gap-2.5">
          <b className={heading}>COMPANY</b>
          <Link to="/#trust" className={link}>About Us</Link>
          <Link to="/contact" className={link}>Contact Us</Link>
          <a href="https://www.eprnexuss.com" target="_blank" rel="noopener noreferrer" className={link}>Main Website ↗</a>
        </div>

        <div className="col-span-2 flex flex-col items-start gap-2.5 lg:col-span-1">
          <b className={heading}>SUPPORT</b>
          <a href="tel:+919220386699" className={link}>Call +91 9220386699</a>
          <a href="mailto:info@eprnexuss.com" className={`break-all ${link}`}>Email- info@eprnexuss.com</a>
          <span className="text-[12px] text-[#9aa8b7] sm:text-[13px]">Mon–Sat · 10am–6pm</span>
        </div>
      </div>

      {/* Contact details */}
      <div className="grid grid-cols-1 gap-4 border-b border-white/10 py-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        <div className="flex flex-col gap-1">
          <b className={label}>EMAIL</b>
          <a href="mailto:info@eprnexuss.com" className={link}>info@eprnexuss.com</a>
        </div>
        <div className="flex flex-col gap-1">
          <b className={label}>PHONE</b>
          <div className="flex flex-wrap gap-x-1 text-[12px] text-[#9aa8b7] sm:text-[13px]">
            <a href="tel:+919220386699" className="hover:text-white">+91 9220386699</a>
            <span>·</span>
            <a href="tel:01204605014" className="hover:text-white">0120-4605014</a>
          </div>
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
          <b className={label}>OFFICE</b>
          <p className="text-[12px] leading-5 text-[#9aa8b7] sm:text-[13px]">
            H 161, Office, BSI Business Park, 09, Sector 63 Rd, H Block, Sector 63, Noida, Uttar Pradesh 201301
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="flex flex-col items-start justify-between gap-1.5 pt-4 text-[11px] leading-5 text-[#718091] sm:flex-row sm:items-center sm:text-[12px]">
        <span>© 2026 EPR Nexuss. All rights reserved.</span>
        <span>Made in India · Compliance-focused B2B marketplace</span>
      </div>
    </footer>
  )
}
