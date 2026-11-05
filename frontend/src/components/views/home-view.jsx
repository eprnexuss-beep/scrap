import { publicAsset } from '@/lib/public-asset'
import {
  ArrowRight,
  BatteryCharging,
  Building2,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Factory,
  FileText,
  Gauge,
  Handshake,
  PackageCheck,
  Recycle,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  TrendingUp,
  UserRoundCheck,
  WalletCards,
} from 'lucide-react'
import { useAppNav } from '@/hooks/use-app-nav'
import { useAuth } from '@/components/providers/auth-provider'
import { SiteFooter } from '@/components/layout/site-footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { PublicHeader } from '@/components/layout/public-header'

const categories = [
  ['E-Waste', 'Circuit boards, devices', Gauge],
  ['Plastic Scrap', 'HDPE, PET, PVC', Recycle],
  ['Tyres', 'Commercial & industrial', CircleDollarSign],
  ['Used Oil', 'Industrial lubricants', Factory],
  ['ELV', 'End-of-life vehicles', Trash2],
  ['Batteries', 'Lead acid & lithium', BatteryCharging],
  ['Metals', 'Ferrous & non-ferrous', SlidersHorizontal],
  ['Solar Panels', 'PV modules & parts', Sparkles],
]

const stats = [
  ['1,000+', 'Verified recyclers', UserRoundCheck],
  ['25+', 'Scrap categories', PackageCheck],
  ['5,000+', 'Lots traded', Recycle],
  ['Pan India', 'Industrial network', Building2],
]

const steps = [
  ['01', 'List or discover', 'Sellers publish scrap lots while verified recyclers browse relevant opportunities.', FileText],
  ['02', 'Verify & match', 'Our team verifies documentation, quality and buyer eligibility before matching.', ShieldCheck],
  ['03', 'Negotiate securely', 'Private offers and admin-managed negotiations protect both parties.', Handshake],
  ['04', 'Settle transparently', 'Track fulfilment, documents, payments and settlements in one place.', WalletCards],
]

export function HomeView() {
  const go = useAppNav()
  const { user } = useAuth()
  const dash = user ? user.role === 'buyer' ? 'buyer' : user.role === 'seller' ? 'seller' : 'admin' : null
  const join = () => go(dash ?? 'register') // signed-in visitors go to their dashboard instead of registering

  return (
    <div className="public-page">
      <PublicHeader go={go} />
      <main>
        <section className="hero">
          <div className="hero__copy">
            <Badge tone="green">
              <ShieldCheck size={14} /> India&apos;s verified scrap network
            </Badge>
            <h1>
              Connecting Scrap to a <span>Cleaner Tomorrow</span>
            </h1>
            <p>
              A trusted marketplace connecting industrial scrap suppliers with verified recyclers.
              Discover opportunities, simplify transactions, and support a circular economy.
            </p>
            <div className="hero__actions">
              {user ? (
                <Button onClick={() => go(dash)}>
                  Go to my dashboard <ArrowRight size={17} />
                </Button>
              ) : (
                <>
                  <Button onClick={() => go('register')}>
                    List Your Scrap <ArrowRight size={17} />
                  </Button>
                  <Button variant="secondary" onClick={() => go('register')}>
                    Join as Recycler
                  </Button>
                </>
              )}
            </div>
            <div className="hero__proof">
              <div className="avatar-stack">
                <span>AK</span>
                <span>GM</span>
                <span>RV</span>
              </div>
              <p>
                <b>Trusted by verified businesses</b>
                <br />
                Secure, compliant and transparent
              </p>
            </div>
          </div>
          <div className="hero__visual">
            <img src={publicAsset('assets/recycling-facility.jpg')} alt="Industrial recycling facility" />
            <div className="hero__float hero__float--top">
              <ShieldCheck size={21} />
              <span>
                <b>100% verified</b>
                <small>Recycler network</small>
              </span>
            </div>
            <div className="hero__float hero__float--bottom">
              <TrendingUp size={21} />
              <span>
                <b>Better value</b>
                <small>Transparent pricing</small>
              </span>
            </div>
          </div>
        </section>
        <section className="trust-strip" aria-label="Sample platform statistics">
          <p className="sample-label">Sample marketplace indicators</p>
          {stats.map(([value, label, Icon]) => (
            <div className="trust-stat" key={label}>
              <span>
                <Icon size={21} />
              </span>
              <div>
                <b>{value}</b>
                <small>{label}</small>
              </div>
            </div>
          ))}
        </section>
        <section className="section" id="categories">
          <div className="section-heading">
            <div>
              <Badge>MARKETPLACE</Badge>
              <h2>Explore popular scrap categories</h2>
              <p>Find verified materials from trusted industrial suppliers across India.</p>
            </div>
            <Button variant="ghost" onClick={() => go('marketplace')}>
              View all lots <ArrowRight size={16} />
            </Button>
          </div>
          <div className="category-grid">
            {categories.map(([title, subtitle, Icon], index) => (
              <button className="category-card" key={title} onClick={() => go('marketplace')}>
                <span className={`category-card__icon category-card__icon--${index % 4}`}>
                  <Icon size={23} />
                </span>
                <span>
                  <b>{title}</b>
                  <small>{subtitle}</small>
                </span>
                <ArrowRight size={17} />
              </button>
            ))}
          </div>
        </section>
        <section className="section process-section" id="how">
          <div className="section-heading section-heading--center">
            <div>
              <Badge>HOW IT WORKS</Badge>
              <h2>Trade scrap with confidence</h2>
              <p>From listing to settlement, every step is verified and managed.</p>
            </div>
          </div>
          <div className="steps-grid">
            {steps.map(([num, title, text, Icon]) => (
              <article className="step-card" key={title}>
                <span className="step-card__number">{num}</span>
                <span className="step-card__icon">
                  <Icon size={24} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="section benefit-grid" id="trust">
          <div className="benefit-visual">
            <img src={publicAsset('assets/metal-scrap.jpg')} alt="Sorted industrial metal parts" />
            <Badge>
              <CheckCircle2 size={14} /> Compliance-first marketplace
            </Badge>
          </div>
          <div className="benefit-copy">
            <Badge>WHY EPR NEXUSS</Badge>
            <h2>Built for responsible industrial trade</h2>
            <p>
              We combine verified participants, controlled information sharing and structured deal
              management to make scrap trading safer.
            </p>
            <div className="check-list">
              {[
                'Verified recycler credentials and category authorizations',
                'Private offers with protected business identities',
                'Admin-managed pricing, margin and negotiation controls',
                'Complete document, deal and settlement audit trail',
              ].map((item) => (
                <div key={item}>
                  <Check size={17} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Button onClick={join}>
              {user ? 'Open my dashboard' : 'Start trading securely'} <ArrowRight size={16} />
            </Button>
          </div>
        </section>
        <section className="cta-section">
          <div>
            <Badge tone="green">READY TO START?</Badge>
            <h2>Turn scrap into sustainable value.</h2>
            <p>Join a verified ecosystem built for responsible, efficient B2B trade.</p>
          </div>
          <div>
            <Button onClick={join}>{user ? 'Open my dashboard' : 'Create free account'}</Button>
            <Button variant="secondary" onClick={() => go('marketplace')}>
              Explore marketplace
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter go={go} />


    </div>
  )
}
