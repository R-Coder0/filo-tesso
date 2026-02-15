import React from "react";
import Marquee from "react-fast-marquee";
import { FaTshirt } from "react-icons/fa";
import { GiShoppingBag } from "react-icons/gi";
import { BsStars } from "react-icons/bs";

const MarqueeOffers = () => {
  return (
    <div className="w-full bg-gradient-to-r from-gray-900 via-black to-gray-900 fixed top-0 text-white py-3 z-1000 ">
      <Marquee speed={60} pauseOnHover gradient={false}>
        <div className="flex items-center space-x-2 mx-10 text-lg font-medium">
          <FaTshirt className="text-pink-400" />
          <span>
            Welcome to <span className="text-pink-400 font-semibold">FILO-TESSO</span> — Style that Speaks Confidence!
          </span>
        </div>

        <div className="flex items-center space-x-2 mx-10 text-lg font-medium">
          <GiShoppingBag className="text-yellow-400" />
          <span>
            Orders over ₹1399 get <span className="text-yellow-400 font-bold">10% OFF</span>
          </span>
        </div>

        <div className="flex items-center space-x-2 mx-10 text-lg font-medium">
          <GiShoppingBag className="text-green-400" />
          <span>
            Above ₹1999 get <span className="text-green-400 font-bold">15% OFF</span>
          </span>
        </div>

        <div className="flex items-center space-x-2 mx-10 text-lg font-medium">
          <GiShoppingBag className="text-blue-400" />
          <span>
            Over ₹2999 get <span className="text-blue-400 font-bold">20% OFF</span>
          </span>
        </div>

        <div className="flex items-center space-x-2 mx-10 text-lg font-medium">
          <BsStars className="text-pink-400" />
          <span>
            ✨ Elevate your vibe — Fashion that Defines You. Only at{" "}
            <span className="text-pink-400 font-semibold">FILO-TESSO</span> ✨
          </span>
        </div>
      </Marquee>
    </div>
  );
};

export default MarqueeOffers;
