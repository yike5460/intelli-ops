import React from 'react';

const Header = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Intelli-Ops</h1>
        <nav>
          <ul className="flex space-x-4">
            <li><a href="#features" className="text-gray-600 hover:text-gray-900">Features</a></li>
            <li><a href="#quickstart" className="text-gray-600 hover:text-gray-900">Quick Start</a></li>
            <li><a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a></li>
            <li><a href="#faq" className="text-gray-600 hover:text-gray-900">FAQ</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;