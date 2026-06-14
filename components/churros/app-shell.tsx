"use client"

import { StoreProvider, useStore } from "./store"
import { HomeScreen } from "./home-screen"
import { CartScreen } from "./cart-screen"
import { CheckoutScreen } from "./checkout-screen"
import { SuccessScreen } from "./success-screen"
import { FloatingCart } from "./floating-cart"

function Screens() {
  const { screen } = useStore()
  return (
    <>
      {screen === "home" && <HomeScreen />}
      {screen === "cart" && <CartScreen />}
      {screen === "checkout" && <CheckoutScreen />}
      {screen === "success" && <SuccessScreen />}
      <FloatingCart />
    </>
  )
}

export function AppShell() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-background shadow-xl shadow-primary/5">
      <StoreProvider>
        <Screens />
      </StoreProvider>
    </main>
  )
}
