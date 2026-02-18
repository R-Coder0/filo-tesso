import React from 'react';
import { FaWallet, FaMedal } from "react-icons/fa";
import { GiClothes, GiTShirt } from "react-icons/gi";
import { RiTShirt2Line } from "react-icons/ri";

// Example image imports - replace with your own
import img1 from '../assets/storyimage/4.jpg';
import img2 from '../assets/storyimage/5.jpg';
import img3 from '../assets/storyimage/9.jpg';
import img4 from '../assets/storyimage/10.jpg';

export default function OurStory() {
  return (
    <section className="w-full bg-white py-2">
      <div className="mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-start">

          {/* Left panel */}
          <div className="w-full lg:w-1/2 bg-white text-gray-800 p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm tracking-widest uppercase text-gray-800">
                 Filoteso — Our Philosophy
              </h3>


              <p className="mt-6 text-sm md:text-base leading-relaxed text-gray-800 max-w-xl">
                Filoteso believes style is personal but confidence is universal. For men, we focus on structure, strength, and effortless sharpness. For women, we focus on grace, confidence, and freedom of movement. Every collection is thoughtfully designed — not copy-paste fashion, but independently created pieces crafted with attention to fit, comfort, and real-world wear.

                We combine high-quality fabrics, clean stitching, and durable construction to deliver everyday premium fashion without luxury-level pricing. Our designs move easily between office, casual outings, travel, and street style — adapting to your lifestyle effortlessly. No over-branding. No fake hype. Just honest fashion made to last.
              </p>
              <p className="mt-6 text-lg font-serif italic text-gray-900">
  “Confidence isn’t worn. It’s carried.”
</p>
            </div>

            <div className="mt-8">
              <div className="grid grid-cols-5 gap-4 items-center text-center">
                <Feature icon={<FaWallet size={24} />} label="Pocket Friendly" />
                <Feature icon={<GiClothes size={24} />} label="Street Wear" />
                <Feature icon={<RiTShirt2Line size={24} />} label="New Designs" />
                <Feature icon={<FaMedal size={24} />} label="Quality Assured" />
                <Feature icon={<GiTShirt size={24} />} label="Daily Comfort" />
              </div>
            </div>
          </div>

          {/* Right gallery */}
          <div className="w-full lg:w-1/2 relative">
            <div className="flex h-full">
              <div className="flex-1 grid grid-cols-4 pt-2 md:p-4 items-stretch">
                <img src={img1} alt="model 1" className="object-cover w-full h-[15rem] md:h-[20rem] rounded-sm shadow-md" />
                <img src={img2} alt="model 2" className="object-cover w-full h-[15rem] md:h-[20rem] rounded-sm shadow-md" />
                <img src={img3} alt="model 3" className="object-cover w-full h-[15rem] md:h-[20rem] rounded-sm shadow-md" />
                <img src={img4} alt="model 4" className="object-cover w-full h-[15rem] md:h-[20rem] rounded-sm shadow-md" />
              </div>
            </div>

            {/* Bottom banner */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center">
              <div className="bg-black/60 text-white text-sm md:text-base uppercase tracking-widest px-6 py-3 rounded-t-lg backdrop-blur-lg">
                Perfect for all occasions
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function Feature({ icon, label }) {
  return (
    <div className="flex flex-col items-center text-black">
      <div className="bg-white/10 rounded-full p-3 w-12 h-12 flex items-center justify-center">
        {icon}
      </div>
      <span className="mt-2 text-xs md:text-sm text-black">{label}</span>
    </div>
  );
}