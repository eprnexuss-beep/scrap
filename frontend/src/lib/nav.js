import {
  BarChart3, CircleDollarSign, FileCheck2, FileText, Handshake, Heart, LayoutDashboard,
  MessageSquareText, Plus, Settings, ShoppingBag, Tag, UserRoundCheck, Users, WalletCards,
} from 'lucide-react'

// [label, icon, href]. href === null means the page is not built yet (item is shown but inert).
export const SIDEBAR = {
  seller: [
    ['Dashboard', LayoutDashboard, '/seller'],
    ['My Listings', FileText, '/seller/listings'],
    ['Create Listing', Plus, '/seller/listings/new'],
    ['Enquiries', MessageSquareText, '/seller/enquiries'],
    ['Deals', Handshake, '/seller/deals'],
    ['Settlements', WalletCards, '/seller/settlements'],
    ['Documents', FileCheck2, '/seller/documents'],
    ['Company Settings', Settings, '/seller/settings'],
  ],
  buyer: [
    ['Dashboard', LayoutDashboard, '/buyer'],
    ['Available Lots', ShoppingBag, '/marketplace'],
    ['My Offers', Tag, '/buyer/offers'],
    ['My Deals', Handshake, '/buyer/deals'],
    ['Saved Listings', Heart, '/buyer/saved'],
    ['Documents', FileCheck2, '/buyer/documents'],
    ['Company Settings', Settings, '/buyer/settings'],
  ],
  admin: [
    ['Dashboard', LayoutDashboard, '/admin-dashboard'],
    ['Users', Users, '/admin-dashboard/users'],
    ['Verifications', UserRoundCheck, '/admin-dashboard/verifications'],
    ['Listings', FileText, '/admin-dashboard/listings'],
    ['Offers & Enquiries', MessageSquareText, '/admin-dashboard/offers'],
    ['Deals & Negotiations', Handshake, '/deal'],
    ['Margin Settings', CircleDollarSign, '/admin-dashboard/margins'],
    ['Payments', WalletCards, '/admin-dashboard/payments'],
    ['Reports & Analytics', BarChart3, '/admin-dashboard/reports'],
    ['Audit Log', FileCheck2, '/admin-dashboard/audit'],
    ['Settings', Settings, '/admin-dashboard/settings'],
  ],
}

export const SETTINGS_HREF = {
  seller: '/seller/settings',
  buyer: '/buyer/settings',
  admin: '/admin-dashboard/settings',
}
