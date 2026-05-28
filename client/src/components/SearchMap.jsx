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
      <div className="flex items-center justify-center h-full bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl dark:shadow-black/20 min-h-[400px]">
        <div className="text-center">
          <p className="text-4xl mb-2">🗺️</p>
          <p className="text-slate-500 dark:text-gray-300 font-semibold">No map locations available</p>
          <p className="text-slate-400 dark:text-gray-400 text-sm mt-1">
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
      className="rounded-3xl shadow-xl dark:shadow-black/20 border border-gray-200 dark:border-white/10 z-0 overflow-hidden"
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
          <Popup maxWidth={220} className="rounded-xl">
            <Link
              to={`/listing/${listing._id}`}
              className="block no-underline group"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="overflow-hidden rounded-lg mb-2 relative">
                <img
                  src={listing.imageUrls?.[0]}
                  alt={listing.name}
                  className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-500"
                  style={{ display: 'block' }}
                />
              </div>
              <p
                className="font-bold text-slate-800 text-base mb-1 truncate group-hover:text-emerald-600 transition-colors"
                style={{ maxWidth: '200px' }}
              >
                {listing.name}
              </p>
              <p className="text-emerald-600 font-extrabold text-sm mb-1">
                ₹
                {listing.offer
                  ? listing.discountPrice?.toLocaleString('en-IN')
                  : listing.regularPrice?.toLocaleString('en-IN')}
                {listing.type === 'rent' && (
                  <span className="text-slate-500 font-medium text-xs"> / mo</span>
                )}
              </p>
              <p className="text-xs font-semibold text-indigo-500 mt-1 hover:text-indigo-600 transition-colors flex items-center gap-1">
                View details <span className="text-lg leading-none">›</span>
              </p>
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
