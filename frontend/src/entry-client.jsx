import './index.css'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async'; // ✅ ADD THIS

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { UIProvider } from './context/UIContext';
import { WishlistProvider } from './context/WishlistContext';

import App from './App';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <HelmetProvider> {/* ✅ YE ADD KARNA HAI */}
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
    </HelmetProvider>
  </StrictMode>
);