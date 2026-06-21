import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { UIProvider } from './context/UIContext';
import { WishlistProvider } from './context/WishlistContext';
import { SsrDataProvider } from './context/SsrDataContext';

import App from './App';

const rootElement = document.getElementById('root');

hydrateRoot(
  rootElement,
  <StrictMode>
    <SsrDataProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <UIProvider>
              <WishlistProvider>
                <App />
              </WishlistProvider>
            </UIProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </SsrDataProvider>
  </StrictMode>
);
