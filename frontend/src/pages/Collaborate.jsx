import React, { useState } from "react";
import { FaHandshake, FaPaperPlane } from "react-icons/fa";
import { toast } from "react-hot-toast"; // Agar toast notification use krte ho, warna alert use kr lena

const Collaborate = () => {
  // Apni Google Apps Script URL yahan paste karein
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz_UGLUGrJdOmFYjjm_ZL895Blc7e5c-63bb6hEs8lNUlHwL4JjqpSo-QRNLYApQtqCWg/exec"; 

  const [formData, setFormData] = useState({
    name: "",
    brandName: "",
    email: "",
    phone: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Google Apps Script ko request bhejna
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        // Cors mode 'no-cors' zaroori hai Google Scripts ke liye client side se
        mode: "no-cors", 
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      // Kyunki 'no-cors' mode hai, hum response read nahi kar sakte directly,
      // par agar error nahi aaya to assume karenge success hai.
      
      // Reset form
      setFormData({
        name: "",
        brandName: "",
        email: "",
        phone: "",
        message: "",
      });
      
      // Success Message (Alert ya Toast)
      alert("Thanks for contacting! We will get back to you soon.");
      // toast.success("Request sent successfully!"); 

    } catch (error) {
      console.error("Error!", error.message);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center mt-[45px]">
      <div className="max-w-4xl w-full space-y-8 bg-white p-8 sm:p-12 rounded-2xl shadow-xl border border-gray-100">
        
        {/* Header Section */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-black text-white rounded-full flex items-center justify-center text-3xl mb-4">
            <FaHandshake />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Let's Collaborate
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Join hands with <span className="font-bold text-black">Filo Teso</span>. Fill the form below and let's create magic together.
          </p>
        </div>

        {/* Form Section */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-black focus:border-black transition-colors"
                placeholder="John Doe"
              />
            </div>

            {/* Brand Name */}
            <div>
              <label htmlFor="brandName" className="block text-sm font-medium text-gray-700">
                Brand / Instagram Handle
              </label>
              <input
                id="brandName"
                name="brandName"
                type="text"
                required
                value={formData.brandName}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-black focus:border-black transition-colors"
                placeholder="@yourbrand"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-black focus:border-black transition-colors"
                placeholder="you@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-black focus:border-black transition-colors"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Collaboration Proposal / Message
            </label>
            <textarea
              id="message"
              name="message"
              rows="4"
              required
              value={formData.message}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-black focus:border-black transition-colors resize-none"
              placeholder="Tell us how you want to collaborate..."
            ></textarea>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                <span className="flex items-center">
                   Submit Proposal <FaPaperPlane className="ml-2"/>
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Collaborate;