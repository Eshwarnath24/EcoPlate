import React, { useState, useEffect } from 'react';
import { THEME } from './theme';
import { useMousePosition } from './hooks';
import GlobalStyles from './components/GlobalStyles';
import NavBar from './components/NavBar';
import LandingPage from './pages/LandingPage';
import AnalysisPage from './pages/AnalysisPage';
import ReportPage from './pages/ReportPage';

export default function App() {
  const [appState, setAppState] = useState('landing');
  const [images, setImages] = useState({ before: null, after: null });
  const mousePos = useMousePosition();

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [appState]);

  return (
    <div style={{ backgroundColor: THEME.bg, color: THEME.text }} className="min-h-screen font-sans overflow-x-hidden selection:bg-white selection:text-black">
      <GlobalStyles />
      
      {/* Global Cursor Spotlight */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
        style={{ 
          background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.03), transparent 40%)`,
          opacity: mousePos.x ? 1 : 0 
        }} 
      />

      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{ backgroundImage: `linear-gradient(${THEME.border} 1px, transparent 1px), linear-gradient(90deg, ${THEME.border} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      <NavBar onHome={() => setAppState('landing')} />
      
      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        {appState === 'landing' && <LandingPage onStart={() => setAppState('upload')} />}
        {(appState === 'upload' || appState === 'analyzing') && (
          <AnalysisPage images={images} setImages={setImages} appState={appState} setAppState={setAppState} />
        )}
        {appState === 'results' && (
          <ReportPage onReset={() => { setImages({ before: null, after: null }); setAppState('upload'); }} />
        )}
      </main>
    </div>
  );
}