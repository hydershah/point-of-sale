"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type AccordionType = "single" | "multiple"

interface AccordionContextValue {
  type: AccordionType
  open: Set<string>
  toggle: (value: string) => void
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null)

export function Accordion({
  type = "single",
  className,
  children,
}: {
  type?: AccordionType
  className?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState<Set<string>>(new Set())

  const toggle = (value: string) => {
    setOpen((prev) => {
      const next = new Set(prev)
      const isOpen = next.has(value)
      if (type === "single") {
        next.clear()
        if (!isOpen) next.add(value)
      } else {
        if (isOpen) next.delete(value)
        else next.add(value)
      }
      return next
    })
  }

  return (
    <AccordionContext.Provider value={{ type, open, toggle }}>
      <div className={cn(className)}>{children}</div>
    </AccordionContext.Provider>
  )
}

const ItemContext = React.createContext<string | null>(null)

export function AccordionItem({
  value,
  className,
  children,
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <ItemContext.Provider value={value}>
      <div className={cn(className)}>{children}</div>
    </ItemContext.Provider>
  )
}

export function AccordionTrigger({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const ctx = React.useContext(AccordionContext)
  const value = React.useContext(ItemContext)
  if (!ctx || !value) return null
  const isOpen = ctx.open.has(value)
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-between py-3 text-left font-medium",
        className
      )}
      onClick={() => ctx.toggle(value)}
      aria-expanded={isOpen}
      aria-controls={`accordion-content-${value}`}
    >
      <span>{children}</span>
      <svg
        className={cn(
          "h-4 w-4 transition-transform",
          isOpen ? "rotate-180" : "rotate-0"
        )}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  )
}

export function AccordionContent({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const ctx = React.useContext(AccordionContext)
  const value = React.useContext(ItemContext)
  if (!ctx || !value) return null
  const isOpen = ctx.open.has(value)
  return (
    <div
      id={`accordion-content-${value}`}
      hidden={!isOpen}
      className={cn(isOpen ? "block" : "hidden", className)}
    >
      {children}
    </div>
  )
}

