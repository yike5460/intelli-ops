import React from 'react';

const PricingTier = ({ name, price, features, recommended }) => (
  <div className={`bg-white p-8 rounded-lg shadow-md ${recommended ? 'border-2 border-blue-600' : ''} transform hover:scale-105 transition duration-300`}>
    {recommended && <div className="bg-blue-600 text-white text-center py-2 px-4 rounded-t-lg -mt-8 mb-6">Recommended</div>}
    <h3 className="text-2xl font-bold mb-4 text-gray-800">{name}</h3>
    <p className="text-4xl font-bold mb-6 text-gray-800">${price}<span className="text-xl text-gray-600">/mo</span></p>
    <ul className="mb-8">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center mb-2 text-gray-600">
          <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          {feature}
        </li>
      ))}
    </ul>
    <button className={`w-full py-2 px-4 rounded-md ${recommended ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-blue-700 transition duration-300`}>
      Choose Plan
    </button>
  </div>
);

const Pricing = () => {
  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold mb-12 text-center text-gray-800">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <PricingTier
            name="Basic"
            price={9.99}
            features={[
              "PR Content Generation",
              "Basic Code Review",
              "5 repositories",
              "Email support"
            ]}
          />
          <PricingTier
            name="Pro"
            price={29.99}
            features={[
              "All Basic features",
              "Advanced Code Review",
              "Unit Test Generation",
              "20 repositories",
              "Priority email support"
            ]}
            recommended={true}
          />
          <PricingTier
            name="Enterprise"
            price={99.99}
            features={[
              "All Pro features",
              "Custom integrations",
              "Unlimited repositories",
              "24/7 phone & email support",
              "Dedicated account manager"
            ]}
          />
        </div>
      </div>
    </section>
  );
};

export default Pricing;
