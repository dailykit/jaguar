const random = async products => {
   try {
      let currentIndex = products.length,
         temp,
         randomIndex

      while (currentIndex !== 0) {
         randomIndex = Math.floor(Math.random() * currentIndex)
         currentIndex -= 1

         temp = products[currentIndex]
         products[currentIndex] = products[randomIndex]
         products[randomIndex] = temp
      }
      return products
   } catch (error) {
      console.log(error)
   }
}

export default random
