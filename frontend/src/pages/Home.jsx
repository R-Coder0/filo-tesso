import React from 'react'
import ProductList from '../components/ProductList'
import Hero from '../section/Hero'
import Bestsellers from '../components/Bestseller'
import CategoriesSection from '../components/Categoriessection'
import LatestProducts from '../components/LatestProducts'
import OurStory from '../components/OurStory'
import TestimonialSection from '../components/TestimonialSection'

const Home = () => {
  return (
    <div>
<Hero/>
<CategoriesSection/>
<LatestProducts/>
<Bestsellers/>
 <ProductList/>
 <OurStory/>
 {/* <TestimonialSection/> */}
    </div>
  )
}

export default Home