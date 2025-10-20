/**
 * Barcode Scanner Integration
 * Supports USB barcode scanners and Web Serial API
 */

import { useEffect } from "react"

export interface BarcodeScannerConfig {
  mode: "keyboard" | "serial"
  prefix?: string
  suffix?: string
}

export type BarcodeCallback = (barcode: string) => void

export class BarcodeScanner {
  private config: BarcodeScannerConfig
  private callback: BarcodeCallback | null = null
  private buffer: string = ""
  private timeout: NodeJS.Timeout | null = null

  constructor(config: BarcodeScannerConfig = { mode: "keyboard" }) {
    this.config = config
  }

  /**
   * Start listening for barcode scans
   */
  start(callback: BarcodeCallback): void {
    this.callback = callback

    if (this.config.mode === "keyboard") {
      this.startKeyboardMode()
    } else if (this.config.mode === "serial") {
      this.startSerialMode()
    }
  }

  /**
   * Stop listening for barcode scans
   */
  stop(): void {
    if (this.config.mode === "keyboard") {
      this.stopKeyboardMode()
    }
    this.callback = null
  }

  /**
   * Keyboard mode: Detect rapid key presses (typical of barcode scanners)
   */
  private startKeyboardMode(): void {
    document.addEventListener("keypress", this.handleKeyPress)
  }

  private stopKeyboardMode(): void {
    document.removeEventListener("keypress", this.handleKeyPress)
  }

  private handleKeyPress = (event: KeyboardEvent): void => {
    // Clear timeout
    if (this.timeout) {
      clearTimeout(this.timeout)
    }

    // Enter key typically signals end of barcode
    if (event.key === "Enter") {
      if (this.buffer.length > 0) {
        let barcode = this.buffer.trim()

        // Remove prefix/suffix if configured
        if (this.config.prefix && barcode.startsWith(this.config.prefix)) {
          barcode = barcode.substring(this.config.prefix.length)
        }
        if (this.config.suffix && barcode.endsWith(this.config.suffix)) {
          barcode = barcode.substring(0, barcode.length - this.config.suffix.length)
        }

        // Call callback with barcode
        if (this.callback && barcode.length > 0) {
          this.callback(barcode)
        }

        this.buffer = ""
      }
      return
    }

    // Add character to buffer
    if (event.key.length === 1) {
      this.buffer += event.key
    }

    // Set timeout to clear buffer (in case it's not a barcode scan)
    this.timeout = setTimeout(() => {
      this.buffer = ""
    }, 100)
  }

  /**
   * Serial mode: Use Web Serial API for dedicated barcode scanners
   */
  private async startSerialMode(): Promise<void> {
    if (!("serial" in navigator)) {
      console.error("Web Serial API not supported")
      return
    }

    try {
      // Request port access
      const port = await (navigator as any).serial.requestPort()
      await port.open({ baudRate: 9600 })

      const reader = port.readable.getReader()

      // Read data from serial port
      while (true) {
        const { value, done } = await reader.read()
        if (done) {
          reader.releaseLock()
          break
        }

        // Convert bytes to string
        const text = new TextDecoder().decode(value)
        
        // Process barcode
        const barcode = text.trim()
        if (this.callback && barcode.length > 0) {
          this.callback(barcode)
        }
      }
    } catch (error) {
      console.error("Error accessing serial port:", error)
    }
  }

  /**
   * Manually trigger barcode scan (for testing)
   */
  simulateScan(barcode: string): void {
    if (this.callback) {
      this.callback(barcode)
    }
  }
}

/**
 * Create barcode scanner instance
 */
export function createBarcodeScanner(
  config?: BarcodeScannerConfig
): BarcodeScanner {
  return new BarcodeScanner(config)
}

/**
 * React hook for barcode scanning
 */
export function useBarcodeScan(
  callback: BarcodeCallback,
  config?: BarcodeScannerConfig
): void {
  useEffect(() => {
    if (typeof window === "undefined") return

    const scanner = new BarcodeScanner(config)

    // Start scanning on mount
    scanner.start(callback)

    // Cleanup on unmount
    return () => {
      scanner.stop()
    }
  }, [callback, config])
}

