'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  description: string
  action: () => void
}

// POS-specific keyboard shortcuts
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find((shortcut) => {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
        const altMatches = shortcut.altKey ? event.altKey : !event.altKey
        const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey

        return keyMatches && ctrlMatches && altMatches && shiftMatches
      })

      if (matchingShortcut) {
        event.preventDefault()
        matchingShortcut.action()
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

// Default POS shortcuts
export function usePOSShortcuts({
  onNewOrder,
  onPayment,
  onSearch,
  onClearCart,
  onQuickCash,
  onQuickCard,
}: {
  onNewOrder?: () => void
  onPayment?: () => void
  onSearch?: () => void
  onClearCart?: () => void
  onQuickCash?: () => void
  onQuickCard?: () => void
}) {
  const router = useRouter()

  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    {
      key: 'p',
      ctrlKey: true,
      description: 'Go to POS',
      action: () => router.push('/pos'),
    },
    {
      key: 'd',
      ctrlKey: true,
      description: 'Go to Dashboard',
      action: () => router.push('/dashboard'),
    },
    {
      key: 'o',
      ctrlKey: true,
      description: 'Go to Orders',
      action: () => router.push('/orders'),
    },
    {
      key: 'i',
      ctrlKey: true,
      description: 'Go to Inventory',
      action: () => router.push('/inventory'),
    },

    // POS operations
    {
      key: 'n',
      ctrlKey: true,
      description: 'New Order',
      action: () => onNewOrder?.(),
    },
    {
      key: 'Enter',
      ctrlKey: true,
      description: 'Process Payment',
      action: () => onPayment?.(),
    },
    {
      key: 'f',
      ctrlKey: true,
      description: 'Search Products',
      action: () => onSearch?.(),
    },
    {
      key: 'Escape',
      description: 'Clear Cart',
      action: () => onClearCart?.(),
    },

    // Quick payment
    {
      key: 'c',
      altKey: true,
      description: 'Quick Cash Payment',
      action: () => onQuickCash?.(),
    },
    {
      key: 'k',
      altKey: true,
      description: 'Quick Card Payment',
      action: () => onQuickCard?.(),
    },

    // Number pad shortcuts for quantities
    ...Array.from({ length: 9 }, (_, i) => ({
      key: `${i + 1}`,
      altKey: true,
      description: `Quick quantity ${i + 1}`,
      action: () => console.log(`Set quantity to ${i + 1}`),
    })),
  ]

  useKeyboardShortcuts(shortcuts.filter((s) => s.action))

  return shortcuts
}

// Hook to show keyboard shortcuts help
export function useShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && event.shiftKey) {
        event.preventDefault()
        setIsOpen((prev) => !prev)
      }

      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return { isOpen, setIsOpen }
}
