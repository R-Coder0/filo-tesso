import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { CartProvider } from './context/CartContext'; // Import CartProvider
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
import { UIProvider } from './context/UIContext'; // Import UIProvider
import { WishlistProvider } from './context/WishlistContext';

import App from './App';

export function render(url, options) {
  return renderToPipeableStream(
    <StrictMode>
      <StaticRouter location={url}>
        <CartProvider>  {/* Wrap with CartProvider */}
          <AuthProvider>
            <UIProvider>
              <WishlistProvider> 
              <App />
              </WishlistProvider> 
            </UIProvider>
          </AuthProvider>
        </CartProvider>
      </StaticRouter>
    </StrictMode>,
    options
  );
}
