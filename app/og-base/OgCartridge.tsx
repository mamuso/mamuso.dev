'use client'

import dynamic from 'next/dynamic'
import CartridgeErrorBoundary from '../components/CartridgeErrorBoundary'

const Cartridge = dynamic(() => import('./OgCartridgeScene'), { ssr: false })

export default function OgCartridge() {
  return (
    <CartridgeErrorBoundary fallback={<p>The GitHub cartridge could not be loaded.</p>}>
      <Cartridge />
    </CartridgeErrorBoundary>
  )
}
