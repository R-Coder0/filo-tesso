import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { CartProvider } from './context/CartContext'; // Import CartProvider
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
import { UIProvider } from './context/UIContext'; // Import UIProvider
import { WishlistProvider } from './context/WishlistContext';
import { SsrDataProvider } from './context/SsrDataContext';

import App from './App';

export function render(url, options, ssrData = {}) {
  return renderToPipeableStream(
    <StrictMode>
      <SsrDataProvider data={ssrData}>
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
      </SsrDataProvider>
    </StrictMode>,
    options
  );
}
