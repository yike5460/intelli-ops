import React from 'react';

const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600">AWS Bedrock GitHub Action</div>
        <div className="space-x-4">
          <a href="#features" className="text-gray-600 hover:text-blue-600">Features</a>
          <a href="#pricing" className="text-gray-600 hover:text-blue-600">Pricing</a>
          <a href="#faq" className="text-gray-600 hover:text-blue-600">FAQ</a>
          <a href="https://github.com/yike5460/intelli-ops" target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">GitHub Repo</a>
        </div>
      </nav>
    </header>
  );
};

export default Header;