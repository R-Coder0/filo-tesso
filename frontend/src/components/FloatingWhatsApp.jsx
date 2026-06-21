import React from "react";
import { FaWhatsapp } from "react-icons/fa";

const WHATSAPP_URL =
  "https://wa.me/919310966458?text=Hello%20I%20need%20Help";

export default function FloatingWhatsApp() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="whatsapp-float group"
    >
      <span className="whatsapp-float__bubble">Chat with us</span>
      <span className="whatsapp-float__button">
        <FaWhatsapp aria-hidden="true" className="h-8 w-8" />
      </span>
    </a>
  );
}