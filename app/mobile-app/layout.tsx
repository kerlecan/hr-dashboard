// app/mobile-app/layout.tsx - BASİT VERSİYON
import MobileAppNav from '@/components/MobileAppNav'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function MobileAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={['WEB']}>
      {/* Tam koyu arka plan */}
      <div className="min-h-screen w-full bg-slate-950 overflow-x-hidden">
        <MobileAppNav />
        
        {/* Full width container */}
        <main className="w-full pb-20 pt-16">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}