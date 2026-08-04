import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { THEME } from './theme';
import { useMousePosition } from './hooks';
import GlobalStyles from './components/GlobalStyles';
import NavBar from './components/NavBar';
import LandingPage from './pages/LandingPage';
import AnalysisPage from './pages/AnalysisPage';
import ReportPage from './pages/ReportPage';
import CodedNatureBackground from './components/CodedNatureBackground';

export default function App() {
  const [images, setImages] = useState({ before: null, after: null });
  const mousePos = useMousePosition();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [location.pathname]);

  return (
    <div style={{ color: THEME.text, backgroundColor: THEME.bg }} className="min-h-screen font-sans overflow-x-hidden selection:bg-orange-500/30 relative">
      <GlobalStyles />
      
      {location.pathname !== '/' && <CodedNatureBackground />}

      {/* Subtle warm cursor spotlight */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
        style={{ 
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(234, 88, 12, 0.05), transparent 40%)`,
          opacity: mousePos.x ? 1 : 0 
        }} 
      />

      {/* Subtle dot grid background for dark mode */}
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      {location.pathname !== '/' && <NavBar onHome={() => navigate('/')} onBack={() => navigate(-1)} />}
      
      <Routes>
        <Route path="/" element={
          <main className="relative z-10">
            <LandingPage onStart={() => navigate('/analysis')} />
          </main>
        } />
        <Route path="/analysis" element={
          <main className="max-w-7xl mx-auto px-6 py-12 pt-28 relative z-10">
            <AnalysisPage images={images} setImages={setImages} />
          </main>
        } />
        <Route path="/report" element={
          <main className="max-w-7xl mx-auto px-6 py-12 pt-28 relative z-10">
            <ReportPage onReset={() => { setImages({ before: null, after: null }); navigate('/analysis'); }} />
          </main>
        } />
      </Routes>
    </div>
  );
}