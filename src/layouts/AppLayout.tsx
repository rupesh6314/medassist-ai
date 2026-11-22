import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/shared/Sidebar'
import { Topbar } from '@/components/shared/Topbar'
import { FloatingActionButton } from '@/components/shared/FloatingActionButton'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAuth } from '@/context/AuthContext'

export function AppLayout() {
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const userKey = `${user?.role || 'guest'}-${user?.id || 'anon'}`

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-mist-50">
        <div className="hidden lg:block">
          <Sidebar key={`sidebar-${userKey}`} />
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
            <div className="relative h-full w-64 animate-in slide-in-from-left duration-200">
              <Sidebar key={`mobile-sidebar-${userKey}`} onClose={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <Topbar key={`topbar-${userKey}`} onMenuClick={() => setMobileOpen(true)} />
          <main key={`main-${userKey}`} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
        <FloatingActionButton />
      </div>
    </TooltipProvider>
  )
}

