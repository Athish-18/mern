import http from 'http'

http.get('http://localhost:3000/api/listing/get?limit=20', (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    const listings = JSON.parse(data)
    console.log(`Total listings: ${listings.length}\n`)
    listings.forEach(l => {
      console.log(`Name: ${l.name}`)
      console.log(`Address: ${l.address}`)
      console.log(`Coords: lat=${l.latitude}, lon=${l.longitude}`)
      console.log('---')
    })
  })
})
