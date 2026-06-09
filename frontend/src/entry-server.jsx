import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './context/CartContext'; // Import CartProvider
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
import { UIProvider } from './context/UIContext'; // Import UIProvider
import { WishlistProvider } from './context/WishlistContext';

import App from './App';

export function render(url, options) {
  return renderToPipeableStream(
    <StrictMode>
      <HelmetProvider>
        <StaticRouter location={url}>
          <AuthProvider>
            <CartProvider>
              <UIProvider>
                <WishlistProvider>
                  <App />
                </WishlistProvider>
              </UIProvider>
            </CartProvider>
          </AuthProvider>
        </StaticRouter>
      </HelmetProvider>
    </StrictMode>,
    options
  );
}
