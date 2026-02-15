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
        <div className="flex flex-col lg:flex-row items-stretch">

          {/* Left panel */}
          <div className="w-full lg:w-1/2 bg-black text-white p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm tracking-widest uppercase text-gray-200">
                Filo Teso - Brand Manifesto
              </h3>

              <p className="mt-6 text-xs md:text-sm leading-relaxed text-gray-200 max-w-xl">
                We believe restraint is a strength.
                That true style is built, not announced.
                Filo Teso is guided by intention-where every thread has a role, every cut a reason. Our designs balance structure and ease, tradition and modernity, precision and comfort. We create clothing that endures beyond seasons, defined not by excess but by clarity.
                This is fashion held in tension:
                disciplined, refined, and quietly confident.
                Because what is made with purpose lasts.
                <br/>
                <br/>
                <span className='font-extralight italic text-lg font-serif'>Filo Teso — Held together by purpose. Defined by precision.</span>
              </p>
            </div>

            <div className="mt-0">
              <div className="grid grid-cols-5 gap-4 items-center text-center">
                <Feature icon={<FaWallet size={24} />} label="Pocket Friendly" />
                <Feature icon={<GiClothes size={24} />} label="Street wear" />
                <Feature icon={<RiTShirt2Line size={24} />} label="New designs" />
                <Feature icon={<FaMedal size={24} />} label="Quality Assured" />
                <Feature icon={<GiTShirt size={24} />} label="Daily comfort" />
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
    <div className="flex flex-col items-center text-gray-100">
      <div className="bg-white/10 rounded-full p-3 w-12 h-12 flex items-center justify-center">
        {icon}
      </div>
      <span className="mt-2 text-xs md:text-sm text-gray-100">{label}</span>
    </div>
  );
}