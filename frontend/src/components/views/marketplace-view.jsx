import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '@/lib/router'
import { Filter, Search } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { PageState, EmptyState } from '@/components/shared/state'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { LotCard } from '@/components/ui/lot-card'
import { useFetch } from '@/hooks/use-fetch'

export function MarketplaceView() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [place, setPlace] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const path = useMemo(() => {
    const p = new URLSearchParams({ sort })
    if (debounced.trim()) p.set('q', debounced.trim())
    if (category) p.set('category', category)
    if (place.trim()) p.set('place', place.trim())
    if (Number(maxPrice) > 0) p.set('maxPrice', maxPrice)
    return `/api/buyer/listings?${p}`
  }, [debounced, category, sort, place, maxPrice])
  const { data, error, loading } = useFetch(path)
  const filtering = !!(debounced || category || place || maxPrice)

  return (
    <DashboardShell role="buyer" title="Available lots" subtitle="Approved scrap lots matched to your verified authorizations." active="Available Lots">
      <div className="market-toolbar card">
        <label className="market-search">
          <Search size={19} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by material, grade or category..." />
        </label>
        <Button variant="secondary" onClick={() => setShowFilters((s) => !s)}>
          <Filter size={16} /> Filters
        </Button>
        <label className="sort-select">
          <span>Sort:</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="quantity">Quantity</option>
          </select>
        </label>
      </div>
      {showFilters && (
        <div className="card filter-panel">
          <Field label="City or state" placeholder="e.g. Delhi NCR" value={place} onChange={setPlace} />
          <Field label="Max asking price (₹ per unit)" placeholder="e.g. 50000" inputMode="numeric" value={maxPrice} onChange={setMaxPrice} />
          <Button variant="ghost" onClick={() => { setPlace(''); setMaxPrice('') }}>Clear filters</Button>
        </div>
      )}
      {data && !data.locked && (
        <div className="filter-chips">
          <button className={!category ? 'active' : ''} onClick={() => setCategory('')}>All approved lots</button>
          {data.categories.map((c) => (
            <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
      )}
      <PageState loading={loading && !data} error={error}>
        {data?.locked ? (
          <section className="card">
            <EmptyState title="Marketplace unlocks after verification" text="Once EPR Nexuss approves your documents, lots in your authorised categories will appear here." />
          </section>
        ) : (
          <div className="market-results">
            <div className="results-heading">
              <p>
                <b>{data?.listings.length ?? 0} matching lots</b>
                <span>Only listings eligible for your verified account are shown.</span>
              </p>
            </div>
            {data?.listings.length === 0 ? (
              <EmptyState title={filtering ? 'No lots match your filters' : 'No approved lots right now'} text={filtering ? 'Try clearing a filter.' : 'New lots appear here as soon as they are approved.'} />
            ) : (
              <div className="lot-grid lot-grid--market">
                {data?.listings.map((lot) => (
                  <LotCard lot={lot} key={lot.id} onView={() => router.push(`/marketplace/${lot.id}`)} />
                ))}
              </div>
            )}
          </div>
        )}
      </PageState>
    </DashboardShell>
  )
}
