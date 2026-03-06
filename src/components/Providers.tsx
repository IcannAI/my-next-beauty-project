'use client';

import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/components/cart/CartContext';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
