import React from 'react'
import Hero from '../section/Hero'
import Bestsellers from '../components/Bestseller'
import CategoriesSection from '../components/Categoriessection'
import LatestProducts from '../components/LatestProducts'
import HomeProducts from '../components/HomeProducts'
import OversizeTshirtProducts from '../components/OversizeTshirtProducts'
import OurStory from '../components/OurStory'
import TestimonialSection from '../components/TestimonialSection'
import { ShoppingExperience } from '../components/ShoppingExperience'
import TrustStrip from '../section/TrustStrip'

const Home = () => {
  return (
    <div>
<Hero/>
<CategoriesSection/>
<TrustStrip/>
<LatestProducts/>
<Bestsellers/>
<OversizeTshirtProducts/>
<HomeProducts/>
 <OurStory/>
 <ShoppingExperience/>
 {/* <TestimonialSection/> */}
    </div>
  )
}

export default Home
