import React from 'react'
import Hero from '../section/Hero'
import HomeDiscountBanner from '../components/HomeDiscountBanner'
import TshirtCategoryStrip from '../components/TshirtCategoryStrip'
import HomeNewPopular from '../components/HomeNewPopular'
import InstagramCarousel from '../components/InstagramCarousel'

const Home = () => {
  return (
    <div>
      <Hero />
      <HomeDiscountBanner />
      <TshirtCategoryStrip />
      <HomeNewPopular />
      <InstagramCarousel />
    </div>
  )
}

export default Home
