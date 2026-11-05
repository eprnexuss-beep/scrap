import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { GuestOnly, RequireRole } from '@/components/layout/route-guards'
import NotFound from '@/pages/not-found'
import { ScrollToHash } from '@/components/layout/scroll-to-hash'
import { WhatsAppButton } from '@/components/shared/whatsapp-button'
import AdminOffers from '@/pages/admin-dashboard/offers'
import Page0 from '@/pages/admin-dashboard/audit'
import Page1 from '@/pages/admin-dashboard/listings/by-id'
import Page2 from '@/pages/admin-dashboard/listings'
import Page3 from '@/pages/admin-dashboard/margins'
import Page5 from '@/pages/admin-dashboard'
import Page6 from '@/pages/admin-dashboard/payments'
import Page7 from '@/pages/admin-dashboard/reports'
import Page8 from '@/pages/admin-dashboard/settings'
import Page9 from '@/pages/admin-dashboard/users'
import Page10 from '@/pages/admin-dashboard/verifications'
import Page11 from '@/pages/buyer/deals'
import Page12 from '@/pages/buyer/documents'
import Page14 from '@/pages/buyer/offers/by-id'
import Page15 from '@/pages/buyer/offers'
import Page16 from '@/pages/buyer'
import Page17 from '@/pages/buyer/saved'
import Page18 from '@/pages/buyer/settings'
import Page19 from '@/pages/deal/by-id'
import Page20 from '@/pages/deal'
import Page21 from '@/pages/login'
import Page22 from '@/pages/marketplace/by-id'
import Page23 from '@/pages/marketplace'
import Page24 from '@/pages/home'
import Page25 from '@/pages/register'
import Page26 from '@/pages/reset-password'
import Page27 from '@/pages/seller/deals'
import Page28 from '@/pages/seller/documents'
import Page29 from '@/pages/seller/enquiries'
import Page30 from '@/pages/seller/listings/by-id/edit'
import Page31 from '@/pages/seller/listings/by-id'
import Page32 from '@/pages/seller/listings/new'
import Page33 from '@/pages/seller/listings'
import Page35 from '@/pages/seller'
import Page36 from '@/pages/seller/settings'
import Page37 from '@/pages/seller/settlements'
import ContactPage from '@/pages/contact'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToHash />
      <Routes>
        <Route path="/admin-dashboard/audit" element={<RequireRole role="admin"><Page0 /></RequireRole>} />
        <Route path="/admin-dashboard/listings/:id" element={<RequireRole role="admin"><Page1 /></RequireRole>} />
        <Route path="/admin-dashboard/listings" element={<RequireRole role="admin"><Page2 /></RequireRole>} />
        <Route path="/admin-dashboard/margins" element={<RequireRole role="admin"><Page3 /></RequireRole>} />
        <Route path="/admin-dashboard" element={<RequireRole role="admin"><Page5 /></RequireRole>} />
        <Route path="/admin-dashboard/payments" element={<RequireRole role="admin"><Page6 /></RequireRole>} />
        <Route path="/admin-dashboard/reports" element={<RequireRole role="admin"><Page7 /></RequireRole>} />
        <Route path="/admin-dashboard/settings" element={<RequireRole role="admin"><Page8 /></RequireRole>} />
        <Route path="/admin-dashboard/users" element={<RequireRole role="admin"><Page9 /></RequireRole>} />
        <Route path="/admin-dashboard/verifications" element={<RequireRole role="admin"><Page10 /></RequireRole>} />
        <Route path="/buyer/deals" element={<RequireRole role="buyer"><Page11 /></RequireRole>} />
        <Route path="/buyer/documents" element={<RequireRole role="buyer"><Page12 /></RequireRole>} />
        <Route path="/buyer/offers/:id" element={<RequireRole role="buyer"><Page14 /></RequireRole>} />
        <Route path="/buyer/offers" element={<RequireRole role="buyer"><Page15 /></RequireRole>} />
        <Route path="/buyer" element={<RequireRole role="buyer"><Page16 /></RequireRole>} />
        <Route path="/buyer/saved" element={<RequireRole role="buyer"><Page17 /></RequireRole>} />
        <Route path="/buyer/settings" element={<RequireRole role="buyer"><Page18 /></RequireRole>} />
        <Route path="/deal/:id" element={<RequireRole role="admin"><Page19 /></RequireRole>} />
        <Route path="/deal" element={<RequireRole role="admin"><Page20 /></RequireRole>} />
        <Route path="/login" element={<GuestOnly><Page21 /></GuestOnly>} />
        <Route path="/marketplace/:id" element={<RequireRole role="buyer"><Page22 /></RequireRole>} />
        <Route path="/marketplace" element={<RequireRole role="buyer"><Page23 /></RequireRole>} />
        <Route path="/" element={<Page24 />} />
        <Route path="/register" element={<GuestOnly><Page25 /></GuestOnly>} />
        <Route path="/reset-password" element={<Page26 />} />
        <Route path="/seller/deals" element={<RequireRole role="seller"><Page27 /></RequireRole>} />
        <Route path="/seller/documents" element={<RequireRole role="seller"><Page28 /></RequireRole>} />
        <Route path="/seller/enquiries" element={<RequireRole role="seller"><Page29 /></RequireRole>} />
        <Route path="/seller/listings/:id/edit" element={<RequireRole role="seller"><Page30 /></RequireRole>} />
        <Route path="/seller/listings/:id" element={<RequireRole role="seller"><Page31 /></RequireRole>} />
        <Route path="/seller/listings/new" element={<RequireRole role="seller"><Page32 /></RequireRole>} />
        <Route path="/seller/listings" element={<RequireRole role="seller"><Page33 /></RequireRole>} />
        <Route path="/seller" element={<RequireRole role="seller"><Page35 /></RequireRole>} />
        <Route path="/seller/settings" element={<RequireRole role="seller"><Page36 /></RequireRole>} />
        <Route path="/seller/settlements" element={<RequireRole role="seller"><Page37 /></RequireRole>} />
        <Route path="/admin-dashboard/offers" element={<RequireRole role="admin"><AdminOffers /></RequireRole>} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <WhatsAppButton />
    </BrowserRouter>
  )
}
