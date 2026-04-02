export const getCoordinates = async (address) => {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    address,
  )}&format=json`

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'DwellBase/1.0 (contact@dwellbase.com)',
    },
  })
  const data = await response.json()

  if (!data || data.length === 0) {
    throw new Error('Location not found')
  }

  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
  }
}
