'use client'

import dynamic from 'next/dynamic'

const CartridgeStageDynamic = dynamic(() => import('./CartridgeStage'), {
  ssr: false,
  loading: () => (
    <div
      className="relative left-1/2 right-1/2 -mx-[50vw] h-[580px] w-screen min-[720px]:h-[760px]"
      aria-hidden="true"
    />
  ),
})

export default CartridgeStageDynamic
