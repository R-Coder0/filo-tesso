import React from 'react'
import ClientHelmet from '../components/ClientHelmet'
import Hero from '../section/Hero'
import HomeDiscountBanner from '../components/HomeDiscountBanner'
import TshirtCategoryStrip from '../components/TshirtCategoryStrip'
import HomeNewPopular from '../components/HomeNewPopular'
import InstagramCarousel from '../components/InstagramCarousel'

const Home = () => {
  return (
    <div>
      <ClientHelmet>
        <title>Filo Teso | Premium Streetwear Clothing Brand in India</title>
        <meta
          name="title"
          content="Filo Teso | Premium Streetwear Clothing Brand in India"
        />
        <meta
          name="description"
          content="Shop Filo Teso for premium streetwear, graphic tees, oversized fits, and everyday styles made for comfort, quality, and self-expression."
        />
        <meta
          name="keywords"
          content="streetwear clothing brand india, premium streetwear brand india, graphic streetwear clothing, streetwear fashion india, premium graphic t shirts india, urban streetwear brand india, modern streetwear clothing, graphic tees india, premium fashion brand india, filo teso"
        />
      </ClientHelmet>
      <Hero />
      <HomeDiscountBanner />
      <TshirtCategoryStrip />
      <HomeNewPopular />
      <InstagramCarousel />
    </div>
  )
}

export default Home
