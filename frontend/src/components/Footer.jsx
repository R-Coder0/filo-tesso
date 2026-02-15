import React from "react";
import { Facebook, Instagram, Youtube, Twitter } from "lucide-react";
import { Link } from "react-router-dom"; // or 'react-router-dom' if using React Router

export default function Footer() {
  return (
    <footer className="w-full bg-black text-gray-300 text-[14px]">
      <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 px-6 py-10 border-b border-gray-700">
        {/* About */}
        <div>
          <h3 className="text-gray-400 text-[13px] font-semibold uppercase mb-3 tracking-wide">
            About
          </h3>
          <ul className="space-y-2">
            <li><Link to="/contact" className="hover:underline font-medium text-white">Contact Us</Link></li>
            <li><Link to="https://wa.me/916307694248?text=Hello%20I%20need%20Help" className="hover:underline font-medium text-white">Help Center</Link></li>
            <li><Link to="/collabration" className="hover:underline font-medium text-white">Collabration</Link></li>
          </ul>
        </div>

        {/* Help */}
        <div>
          <h3 className="text-gray-400 text-[13px] font-semibold uppercase mb-3 tracking-wide">
            Help
          </h3>
          <ul className="space-y-2">
            <li><Link to="/help/payments" className="hover:underline font-medium text-white">Payments</Link></li>
            <li><Link to="/help/shipping" className="hover:underline font-medium text-white">Shipping</Link></li>
            <li><Link to="/help/cancellation-and-returns" className="hover:underline font-medium text-white">Cancellation & Returns</Link></li>
            <li><Link to="/help/faqs" className="hover:underline font-medium text-white">FAQ</Link></li>
          </ul>
        </div>

        {/* Policy */}
        <div>
          <h3 className="text-gray-400 text-[13px] font-semibold uppercase mb-3 tracking-wide">
            Consumer Policy
          </h3>
          <ul className="space-y-2">
            {/* <li><Link to="#" className="hover:underline font-medium text-white">Cancellation & Returns</Link></li> */}
            <li><Link to="/consumer-policies/terms-and-conditions" className="hover:underline font-medium text-white">Terms Of Use</Link></li>
            <li><Link to="/consumer-policies/security" className="hover:underline font-medium text-white">Security</Link></li>
            <li><Link to="/consumer-policies/privacy" className="hover:underline font-medium text-white">Privacy</Link></li>
            <li><Link to="/consumer-policies/return-and-refund" className="hover:underline font-medium text-white">Returns & Refund</Link></li>
          </ul>
        </div>

        {/* Mail Us */}
        <div className="lg:pl-6 border-l border-gray-700 hidden lg:block">
          <h3 className="text-gray-400 text-[13px] font-semibold uppercase mb-2 tracking-wide">
            Mail Us
          </h3>
          <Link to="mailto:filoteso.rk@gmail.com">filoteso.rk@gmail.com</Link>
          <h3 className="text-gray-400 text-[13px] font-semibold uppercase mt-3 mb-2 tracking-wide">
            Contact Us
          </h3>
          {/* <Link to="tel:+916307694248">  +91 6307694248</Link> */}

          <div className="mt-4">
            {/* <h4 className="text-gray-400 text-[13px] font-semibold mb-2">Warehouse:</h4> */}
            
          </div>
          <div className="mt-4">
            <h4 className="text-gray-400 text-[13px] font-semibold mb-2">Social:</h4>
            <div className="flex items-center space-x-4 text-gray-300">
              <Link to="https://www.instagram.com/filoteso.co.in?igsh=MTZweGhoOGxxemtuZw%3D%3D&utm_source=qr  " aria-label="Instagram" className="hover:text-white"><Instagram size={18} /></Link>
            </div>
          </div>
        </div>

        {/* Office Address */}
        <div className="hidden lg:block">
          <h3 className="text-gray-400 text-[13px] font-semibold uppercase mb-3 tracking-wide">
            Registered Office Address
          </h3>
          {/* <p className="text-gray-300 leading-relaxed text-[13px]">
            Mechkart Private Limited,
            <br /> Pankaj Palace Shop No.7
            <br />  Near City Palace Mall Burhanpur
            <br /> Madhya Pradesh, 450331, India
          
            <br />
            Telephone:{" "}
            <Link
              to="tel:+916307694248"
              className="text-[#0077B6] hover:underline"
            >
              +91 6307694248
            </Link>
          </p> */}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="container mx-auto border-t border-gray-700 px-6 py-3 ">
        <div className="flex flex-col md:flex-row items-center justify-between text-[13px] text-gray-400 gap-3">
        <div className="flex flex-wrap items-center justify-center gap-6">
          <p className="text-gray-400">
            © 2026 <span className="text-white font-medium">Filo-Tesso</span>
          </p>
        </div>

        <div className="text-center md:text-right">
          <div className="flex items-center justify-center md:justify-end gap-2 mt-2">
            <img src="/payment.svg" alt="payments" className="h-5" />
          </div>
        </div>
        </div>
      </div>
    </footer>
  );
}