import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import QuickStart from './components/QuickStart';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-800">
      <Header />
      <main>
        <Hero />
        <Features />
        <QuickStart />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

export default App;