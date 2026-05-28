import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

export default function ListingMap({ listing }) {
  if (!listing.latitude || !listing.longitude)
    return <p className="text-center font-semibold text-slate-500 dark:text-gray-300">Loading map...</p>

  return (
    <MapContainer
      center={[listing.latitude, listing.longitude]}
      zoom={15}
      style={{ height: '400px', width: '100%', zIndex: 10 }}
      className="rounded-lg shadow-md mb-6"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[listing.latitude, listing.longitude]}>
        <Popup>
          <b>{listing.name}</b> <br />
          ₹
          {listing.offer
            ? listing.discountPrice.toLocaleString('en-IN')
            : listing.regularPrice.toLocaleString('en-IN')}
          {listing.type === 'rent' && ' / month'}
        </Popup>
      </Marker>
    </MapContainer>
  )
}
