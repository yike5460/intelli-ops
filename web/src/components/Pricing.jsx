import React from 'react';

const PricingTier = ({ name, price, features, recommended }) => (
  <div className={`bg-white p-8 rounded-lg shadow-md ${recommended ? 'border-2 border-blue-600' : ''}`}>
    <h3 className="text-2xl font-bold mb-4">{name}</h3>
    <p className="text-4xl font-bold mb-6">${price}<span className="text-xl text-gray-600">/mo</span></p>
    <ul className="mb-8">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center mb-2">
          <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          {feature}
        </li>
      ))}
    </ul>
    <button className={`w-full py-2 px-4 rounded-md ${recommended ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
      Choose Plan
    </button>
  </div>
);

const Pricing = () => {
  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Pricing Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <PricingTier
            name="Basic"
            price={9}
            features={['Feature 1', 'Feature 2', 'Feature 3']}
          />
          <PricingTier
            name="Pro"
            price={29}
            features={['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4', 'Feature 5']}
            recommended={true}
          />
          <PricingTier
            name="Enterprise"
            price={99}
            features={['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4', 'Feature 5', 'Feature 6', 'Feature 7']}
          />
        </div>
      </div>
    </section>
  );
};

export default Pricing;
