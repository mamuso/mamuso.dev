'use client'

import dynamic from 'next/dynamic'

const CartridgeStageDynamic = dynamic(() => import('./CartridgeStage'), {
  ssr: false,
  loading: () => (
    <div
      className="relative left-1/2 right-1/2 -mx-[50vw] w-screen h-[420px] lg:h-[640px]"
      aria-hidden="true"
    />
  ),
})

export default CartridgeStageDynamic
