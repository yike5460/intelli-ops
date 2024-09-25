import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">Intelli-Ops</h1>
        <nav>
          <ul className="flex space-x-6">
            <li><a href="#features" className="text-gray-600 hover:text-blue-600 transition duration-300">Features</a></li>
            <li><a href="#quickstart" className="text-gray-600 hover:text-blue-600 transition duration-300">Quick Start</a></li>
            <li><a href="#pricing" className="text-gray-600 hover:text-blue-600 transition duration-300">Pricing</a></li>
            <li><a href="#faq" className="text-gray-600 hover:text-blue-600 transition duration-300">FAQ</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;