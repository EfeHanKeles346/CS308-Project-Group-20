import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext'; // useAuth eklendi!
import { CartProvider } from './context/CartContext';
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
import PaymentPage from './pages/PaymentPage';
import UserPage from './pages/UserPage';

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
      <Header onOpenModal={openModal} onSearch={handleSearch} selectedCategory={selectedCategory} onCategorySelect={handleCategorySelect} />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<HomePage searchQuery={searchQuery} selectedCategory={selectedCategory} onCategorySelect={handleCategorySelect} />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<PaymentPage />} />
          <Route path="/account" element={<UserPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
        </Routes>
      </main>
      <Footer onOpenModal={openModal} />
      <AuthModal isOpen={modalOpen} initialTab={modalTab} onClose={closeModal} />
      <Toast />
    </>
  );
}

// YENİ EKLENEN KÖPRÜ BİLEŞEN: Kullanıcıyı alıp Cart'a fırlatır
function CartAndWishlistProviders({ children }) {
  const { user } = useAuth(); // AuthProvider'dan kullanıcıyı çekiyoruz

  return (
    <CartProvider user={user}> {/* user bilgisini CartProvider'a aktarıyoruz */}
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
            {/* Orijinal CartProvider yerine yeni köprümüzü koyduk */}
            <CartAndWishlistProviders>
              <AppContent />
            </CartAndWishlistProviders>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
