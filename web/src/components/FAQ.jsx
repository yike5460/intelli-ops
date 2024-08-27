import React from 'react';

const FAQ = () => {
  return (
    <section id="faq" className="py-20 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Question 1?</h3>
            <p>Answer to question 1.</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Question 2?</h3>
            <p>Answer to question 2.</p>
          </div>
          {/* Add more FAQ items */}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
