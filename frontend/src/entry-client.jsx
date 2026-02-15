import './index.css'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'; // Use createRoot for React 18
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
import { CartProvider } from './context/CartContext'; // Import CartProvider
import { UIProvider } from './context/UIContext'; // Import UIProvider
import App from './App';
import { WishlistProvider } from './context/WishlistContext';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement); // Initialize React root

root.render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>  {/* Wrap with AuthProvider */}
        <CartProvider> {/* Wrap with CartProvider */}
          <UIProvider> {/* Wrap with UIProvider */}
            <WishlistProvider>  
            <App />
            </WishlistProvider>  
          </UIProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
