import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons broken by webpack/vite bundling
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom icon factory
function createIcon(color = 'blue', size = [25, 41]) {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: size,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })
}

const defaultIcon = createIcon('blue')
const activeIcon = createIcon('red', [30, 49])

// ── Auto-fit all markers into view ──────────────────────────────────────────
function FitBounds({ validListings }) {
  const map = useMap()
  useEffect(() => {
    if (validListings.length === 0) return
    const bounds = L.latLngBounds(
      validListings.map((l) => [l.latitude, l.longitude])
    )
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
  }, [map, validListings])
  return null
}

// ── Open popup when activeId changes ────────────────────────────────────────
function OpenActivePopup({ activeId, markerRefs }) {
  const map = useMap()
  useEffect(() => {
    if (!activeId) return
    const marker = markerRefs.current[activeId]
    if (marker) {
      marker.openPopup()
      map.panTo(marker.getLatLng(), { animate: true })
    }
  }, [activeId, map, markerRefs])
  return null
}

// ── Main component ───────────────────────────────────────────────────────────
export default function SearchMap({ listings, activeId, onMarkerClick }) {
  const markerRefs = useRef({})

  const validListings = listings
    ? listings.filter((l) => l.latitude && l.longitude)
    : []

  if (validListings.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100 rounded-xl border border-slate-200 min-h-[400px]">
        <div className="text-center">
          <p className="text-4xl mb-2">🗺️</p>
          <p className="text-slate-500 font-semibold">No map locations available</p>
          <p className="text-slate-400 text-sm mt-1">
            Add coordinates to listings to see them here
          </p>
        </div>
      </div>
    )
  }

  const center = [validListings[0].latitude, validListings[0].longitude]

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: '100%', width: '100%', minHeight: '480px' }}
      className="rounded-xl shadow-md z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {/* Auto-fit bounds to all markers */}
      <FitBounds validListings={validListings} />

      {/* Pan-to + open popup when a card is hovered/clicked */}
      <OpenActivePopup activeId={activeId} markerRefs={markerRefs} />

      {validListings.map((listing) => (
        <Marker
          key={listing._id}
          position={[listing.latitude, listing.longitude]}
          icon={activeId === listing._id ? activeIcon : defaultIcon}
          ref={(ref) => {
            if (ref) markerRefs.current[listing._id] = ref
          }}
          eventHandlers={{
            click: () => onMarkerClick && onMarkerClick(listing._id),
          }}
        >
          <Popup maxWidth={200}>
            <Link
              to={`/listing/${listing._id}`}
              className="block no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={listing.imageUrls?.[0]}
                alt={listing.name}
                className="w-48 h-28 object-cover rounded mb-2"
                style={{ display: 'block' }}
              />
              <p
                className="font-bold text-slate-800 text-sm mb-0.5 truncate"
                style={{ maxWidth: '190px' }}
              >
                {listing.name}
              </p>
              <p className="text-green-700 font-semibold text-sm">
                ₹
                {listing.offer
                  ? listing.discountPrice?.toLocaleString('en-IN')
                  : listing.regularPrice?.toLocaleString('en-IN')}
                {listing.type === 'rent' && (
                  <span className="text-slate-500 font-normal"> / month</span>
                )}
              </p>
              <p className="text-xs text-blue-600 mt-1 hover:underline">
                View listing →
              </p>
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
