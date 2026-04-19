import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';
import { WishlistProvider } from './context/WishlistContext';
import CursorGlow from './components/CursorGlow';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import ProductDetail from './pages/ProductDetail';
import WishlistPage from './pages/WishlistPage';

function AppContent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('login');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const openModal = useCallback((tab = 'login') => {
    setModalTab(tab);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (query) setSelectedCategory(null);
  }, []);

  const handleCategorySelect = useCallback((categoryId) => {
    setSelectedCategory((prev) => (prev === categoryId ? null : categoryId));
  }, []);

  return (
    <>
      <ScrollToTop />
      <a href="#main-content" className="skip-to-content">Skip to content</a>
      <CursorGlow />
      <Header
        onOpenModal={openModal}
        onSearch={handleSearch}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />
      <main id="main-content">
        <Routes>
          <Route
            path="/"
            element={(
              <HomePage
                searchQuery={searchQuery}
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
              />
            )}
          />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
        </Routes>
      </main>
      <Footer onOpenModal={openModal} />
      <AuthModal isOpen={modalOpen} initialTab={modalTab} onClose={closeModal} />
      <Toast />
    </>
  );
}

function CartAndWishlistProviders({ children }) {
  const { user } = useAuth();

  return (
    <CartProvider user={user}>
      <WishlistProvider>
        {children}
      </WishlistProvider>
    </CartProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <ProductsProvider>
              <CartAndWishlistProviders>
                <AppContent />
              </CartAndWishlistProviders>
            </ProductsProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
