// Bluetooth printer support using Web Bluetooth API
export interface BluetoothPrinterDevice {
  device: BluetoothDevice
  server?: BluetoothRemoteGATTServer
  service?: BluetoothRemoteGATTService
  characteristic?: BluetoothRemoteGATTCharacteristic
}

// ESC/POS commands
const ESC = '\x1B'
const GS = '\x1D'

export const ESC_POS_COMMANDS = {
  INIT: ESC + '@',
  ALIGN_LEFT: ESC + 'a' + '\x00',
  ALIGN_CENTER: ESC + 'a' + '\x01',
  ALIGN_RIGHT: ESC + 'a' + '\x02',
  BOLD_ON: ESC + 'E' + '\x01',
  BOLD_OFF: ESC + 'E' + '\x00',
  UNDERLINE_ON: ESC + '-' + '\x01',
  UNDERLINE_OFF: ESC + '-' + '\x00',
  FONT_SIZE_NORMAL: GS + '!' + '\x00',
  FONT_SIZE_DOUBLE: GS + '!' + '\x11',
  FONT_SIZE_LARGE: GS + '!' + '\x22',
  LINE_FEED: '\n',
  CUT_PAPER: GS + 'V' + '\x42' + '\x00',
  OPEN_DRAWER: ESC + 'p' + '\x00' + '\x19' + '\xFA',
}

// Request Bluetooth printer
export async function requestBluetoothPrinter(): Promise<BluetoothPrinterDevice> {
  if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
    throw new Error('Web Bluetooth API not supported in this browser')
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Generic printer service
      ],
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
    })

    return { device }
  } catch (error) {
    console.error('Failed to request Bluetooth device:', error)
    throw error
  }
}

// Connect to Bluetooth printer
export async function connectBluetoothPrinter(
  printerDevice: BluetoothPrinterDevice
): Promise<BluetoothPrinterDevice> {
  try {
    const server = await printerDevice.device.gatt?.connect()
    if (!server) {
      throw new Error('Failed to connect to GATT server')
    }

    const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb')
    const characteristic = await service.getCharacteristic(
      '00002af1-0000-1000-8000-00805f9b34fb'
    )

    return {
      ...printerDevice,
      server,
      service,
      characteristic,
    }
  } catch (error) {
    console.error('Failed to connect to Bluetooth printer:', error)
    throw error
  }
}

// Disconnect from Bluetooth printer
export function disconnectBluetoothPrinter(
  printerDevice: BluetoothPrinterDevice
): void {
  if (printerDevice.server?.connected) {
    printerDevice.server.disconnect()
  }
}

// Send data to Bluetooth printer
async function sendToPrinter(
  printerDevice: BluetoothPrinterDevice,
  data: string
): Promise<void> {
  if (!printerDevice.characteristic) {
    throw new Error('Printer not connected')
  }

  const encoder = new TextEncoder()
  const encoded = encoder.encode(data)

  // Send in chunks if data is large
  const chunkSize = 20
  for (let i = 0; i < encoded.length; i += chunkSize) {
    const chunk = encoded.slice(i, i + chunkSize)
    await printerDevice.characteristic.writeValue(chunk)
    // Small delay between chunks
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}

// Print text via Bluetooth
export async function printTextBluetooth(
  printerDevice: BluetoothPrinterDevice,
  text: string,
  options?: {
    align?: 'left' | 'center' | 'right'
    bold?: boolean
    fontSize?: 'normal' | 'double' | 'large'
  }
): Promise<void> {
  let command = ''

  // Alignment
  if (options?.align === 'center') {
    command += ESC_POS_COMMANDS.ALIGN_CENTER
  } else if (options?.align === 'right') {
    command += ESC_POS_COMMANDS.ALIGN_RIGHT
  } else {
    command += ESC_POS_COMMANDS.ALIGN_LEFT
  }

  // Bold
  if (options?.bold) {
    command += ESC_POS_COMMANDS.BOLD_ON
  }

  // Font size
  if (options?.fontSize === 'double') {
    command += ESC_POS_COMMANDS.FONT_SIZE_DOUBLE
  } else if (options?.fontSize === 'large') {
    command += ESC_POS_COMMANDS.FONT_SIZE_LARGE
  } else {
    command += ESC_POS_COMMANDS.FONT_SIZE_NORMAL
  }

  // Add text
  command += text + ESC_POS_COMMANDS.LINE_FEED

  // Reset formatting
  command += ESC_POS_COMMANDS.BOLD_OFF
  command += ESC_POS_COMMANDS.FONT_SIZE_NORMAL
  command += ESC_POS_COMMANDS.ALIGN_LEFT

  await sendToPrinter(printerDevice, command)
}

// Print receipt via Bluetooth
export async function printReceiptBluetooth(
  printerDevice: BluetoothPrinterDevice,
  receipt: {
    businessName: string
    orderNumber: number
    items: Array<{
      name: string
      quantity: number
      price: number
      subtotal: number
    }>
    subtotal: number
    tax: number
    total: number
    payment: string
  }
): Promise<void> {
  try {
    // Initialize printer
    await sendToPrinter(printerDevice, ESC_POS_COMMANDS.INIT)

    // Header
    await printTextBluetooth(printerDevice, receipt.businessName, {
      align: 'center',
      bold: true,
      fontSize: 'double',
    })

    await printTextBluetooth(printerDevice, '================================', {
      align: 'center',
    })

    await printTextBluetooth(printerDevice, `Order #${receipt.orderNumber}`, {
      align: 'center',
      fontSize: 'large',
    })

    await printTextBluetooth(
      printerDevice,
      new Date().toLocaleString(),
      { align: 'center' }
    )

    await printTextBluetooth(printerDevice, '--------------------------------', {
      align: 'center',
    })

    // Items
    for (const item of receipt.items) {
      await printTextBluetooth(
        printerDevice,
        `${item.quantity}x ${item.name}`
      )
      await printTextBluetooth(
        printerDevice,
        `  $${item.price.toFixed(2)} = $${item.subtotal.toFixed(2)}`,
        { align: 'right' }
      )
    }

    await printTextBluetooth(printerDevice, '--------------------------------', {
      align: 'center',
    })

    // Totals
    await printTextBluetooth(
      printerDevice,
      `Subtotal: $${receipt.subtotal.toFixed(2)}`,
      { align: 'right' }
    )

    await printTextBluetooth(
      printerDevice,
      `Tax: $${receipt.tax.toFixed(2)}`,
      { align: 'right' }
    )

    await printTextBluetooth(
      printerDevice,
      `TOTAL: $${receipt.total.toFixed(2)}`,
      { align: 'right', bold: true, fontSize: 'double' }
    )

    await printTextBluetooth(
      printerDevice,
      `Payment: ${receipt.payment}`,
      { align: 'right' }
    )

    await printTextBluetooth(printerDevice, '================================', {
      align: 'center',
    })

    // Footer
    await printTextBluetooth(printerDevice, 'Thank you for your business!', {
      align: 'center',
    })

    // Feed and cut
    await sendToPrinter(
      printerDevice,
      ESC_POS_COMMANDS.LINE_FEED +
        ESC_POS_COMMANDS.LINE_FEED +
        ESC_POS_COMMANDS.LINE_FEED +
        ESC_POS_COMMANDS.CUT_PAPER
    )
  } catch (error) {
    console.error('Failed to print receipt:', error)
    throw error
  }
}

// Open cash drawer via Bluetooth
export async function openCashDrawerBluetooth(
  printerDevice: BluetoothPrinterDevice
): Promise<void> {
  await sendToPrinter(printerDevice, ESC_POS_COMMANDS.OPEN_DRAWER)
}

// Check if Web Bluetooth is supported
export function isBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator
}

// Get list of paired Bluetooth devices
export async function getPairedBluetoothDevices(): Promise<BluetoothDevice[]> {
  if (!isBluetoothSupported()) {
    return []
  }

  try {
    const devices = await navigator.bluetooth.getDevices()
    return devices
  } catch (error) {
    console.error('Failed to get paired devices:', error)
    return []
  }
}
