'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: string
}

const ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '◉' },
  { href: '/library',   label: 'Library',   icon: '◫' },
  { href: '/tags',      label: 'Tags',      icon: '#' },
  { href: '/tasks',     label: 'Tasks',     icon: '◳' },
  { href: '/review',    label: 'Review',    icon: '◐' },
  { href: '/stats',     label: 'Stats',     icon: '⊞' },
  { href: '/settings',  label: 'Settings',  icon: '⚙' },
]

export function Sidebar({ signOut }: { signOut: () => void }) {
  const pathname = usePathname()

  return (
    <aside
      className="app-sidebar"
      style={{
        width: 220,
        minHeight: '100dvh',
        borderRight: '1px solid var(--border)',
        padding: '24px 16px',
        flexDirection: 'column',
        background: 'var(--card)',
        position: 'sticky',
        top: 0,
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 12px 24px',
        fontSize: 17,
        fontWeight: 800,
        letterSpacing: '-0.02em',
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 8,
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          fontSize: 14,
        }}>
          ✦
        </span>
        monk
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {ITEMS.map(item => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
                background: active ? 'var(--muted)' : 'transparent',
                textDecoration: 'none',
                transition: 'background 0.12s, color 0.12s',
              }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <form action={signOut} style={{ padding: '0 4px' }}>
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '9px 12px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--muted-foreground)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          Sign out
        </button>
      </form>
    </aside>
  )
}

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="app-bottomnav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--card)',
        borderTop: '1px solid var(--border)',
        justifyContent: 'space-around',
        padding: '8px 4px max(8px, env(safe-area-inset-bottom)) 4px',
        zIndex: 40,
      }}
    >
      {ITEMS.map(item => {
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '6px 4px',
              borderRadius: 8,
              fontSize: 10,
              fontWeight: active ? 700 : 500,
              color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
              textDecoration: 'none',
              minWidth: 0,
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(href + '/')
}
