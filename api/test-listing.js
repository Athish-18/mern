import http from 'http'

http.get('http://localhost:3000/api/listing/get', (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data)
      const id = parsed[0]?._id
      if (id) {
        http.get(`http://localhost:3000/api/listing/get/${id}`, (res2) => {
          let data2 = ''
          res2.on('data', chunk => data2 += chunk)
          res2.on('end', () => console.log('Listing result:', data2.slice(0, 500)))
        })
      } else {
        console.log('No listings found')
      }
    } catch(e) {
      console.log('Error parsing:', e.message, data.slice(0, 200))
    }
  })
}).on('error', err => console.log('Error:', err.message))
