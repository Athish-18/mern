import { getCoordinates } from './utils/geocode.js'

async function test() {
  try {
    const coords = await getCoordinates('BTM Layout, Bangalore, Karnataka, India')
    console.log('Coords:', coords)
  } catch (err) {
    console.error('Error:', err.message)
  }
}

test()
