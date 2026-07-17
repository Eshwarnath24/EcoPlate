import React, { useState, useEffect } from 'react';
import { THEME } from './theme';
import { useMousePosition } from './hooks';
import GlobalStyles from './components/GlobalStyles';
import NavBar from './components/NavBar';
import LandingPage from './pages/LandingPage';
import AnalysisPage from './pages/AnalysisPage';
import ReportPage from './pages/ReportPage';
import CodedNatureBackground from './components/CodedNatureBackground';

export default function App() {
  const [appState, setAppState] = useState('landing');
  const [images, setImages] = useState({ before: null, after: null });
  const mousePos = useMousePosition();

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [appState]);

  return (
    <div style={{ color: THEME.text }} className="min-h-screen font-sans overflow-x-hidden selection:bg-green-200 relative bg-transparent">
      <GlobalStyles />
      
      {appState !== 'landing' && <CodedNatureBackground />}

      {/* Subtle warm cursor spotlight */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
        style={{ 
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(31,77,58,0.04), transparent 40%)`,
          opacity: mousePos.x ? 1 : 0 
        }} 
      />

      {/* Subtle dot grid background */}
      <div className="fixed inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

      {appState !== 'landing' && <NavBar onHome={() => setAppState('landing')} />}
      
      {appState === 'landing' ? (
        <main className="relative z-10">
          <LandingPage onStart={() => setAppState('upload')} />
        </main>
      ) : (
        <main className="max-w-7xl mx-auto px-6 py-12 pt-28 relative z-10">
          {(appState === 'upload' || appState === 'analyzing') && (
            <AnalysisPage images={images} setImages={setImages} appState={appState} setAppState={setAppState} />
          )}
          {appState === 'results' && (
            <ReportPage onReset={() => { setImages({ before: null, after: null }); setAppState('upload'); }} />
          )}
        </main>
      )}
    </div>
  );
}