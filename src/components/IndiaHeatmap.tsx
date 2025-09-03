import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

// 1. Static city-to-coordinates mapping
const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  mumbai: { lat: 19.076, lng: 72.8777 },
  bombay: { lat: 19.076, lng: 72.8777 },
  'mumbai city': { lat: 19.076, lng: 72.8777 },
  delhi: { lat: 28.6139, lng: 77.209 },
  'new delhi': { lat: 28.6139, lng: 77.209 },
  meerut: { lat: 28.9845, lng: 77.7064 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  pune: { lat: 18.5204, lng: 73.8567 },
  // ...add more as needed
};

const INDIA_BOUNDS = [
  [6, 68],   // Southwest
  [37, 97],  // Northeast
];

// Helper to get color based on count (simple gradient)
function getColor(count: number, max: number) {
  const percent = max > 0 ? count / max : 0;
  if (percent > 0.8) return '#d73027'; // red
  if (percent > 0.6) return '#fc8d59'; // orange
  if (percent > 0.4) return '#fee08b'; // yellow
  if (percent > 0.2) return '#91cf60'; // green
  return '#4575b4'; // blue
}

function normalizeLocation(loc: string) {
  return loc.trim().toLowerCase();
}

const IndiaHeatmap: React.FC = () => {
  const [heatmapPoints, setHeatmapPoints] = useState<{ lat: number; lng: number; count: number; label: string }[]>([]);
  const mapRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'Reports'), (snapshot) => {
      const pointMap: Record<string, { lat: number; lng: number; count: number; label: string }> = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        let lat = data.locationLat;
        let lng = data.locationLng;
        let rawLabel = data.Location || data.hospitalName || data.city || '';
        let label = rawLabel;
        // Fallback to static mapping if no coordinates
        if ((typeof lat !== 'number' || typeof lng !== 'number') && rawLabel) {
          const norm = normalizeLocation(rawLabel);
          if (cityCoordinates[norm]) {
            lat = cityCoordinates[norm].lat;
            lng = cityCoordinates[norm].lng;
            label = rawLabel; // keep original for tooltip
          }
        }
        if (typeof lat === 'number' && typeof lng === 'number') {
          const key = `${lat},${lng}`;
          if (!pointMap[key]) {
            pointMap[key] = { lat, lng, count: 0, label };
          }
          pointMap[key].count += 1;
        }
      });
      setHeatmapPoints(Object.values(pointMap));
    });
    return () => unsubscribe();
  }, []);

  // Custom component to add Leaflet circles
  const CirclesLayer = () => {
    const map = useMap();
    useEffect(() => {
      // Remove old circles
      map.eachLayer(layer => {
        if (layer instanceof L.Circle) {
          map.removeLayer(layer);
        }
      });
      // Add new circles
      const maxCount = Math.max(...heatmapPoints.map(p => p.count), 1);
      heatmapPoints.forEach(({ lat, lng, label, count }) => {
        const circle = L.circle([lat, lng], {
          radius: 20000 + (count / maxCount) * 40000, // adjust as needed
          color: getColor(count, maxCount),
          fillColor: getColor(count, maxCount),
          fillOpacity: 0.7,
          weight: 1,
        }).addTo(map);
        circle.bindTooltip(`<div><strong>${label}</strong><br/>Activity: ${count}</div>`, { direction: 'top' });
      });
    }, [heatmapPoints, map]);
    return null;
  };

  return (
    <MapContainer
      bounds={INDIA_BOUNDS}
      style={{ height: '70vh', width: '100%', background: '#fff' }}
    >
      <TileLayer
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png"
      />
      <CirclesLayer />
    </MapContainer>
  );
};

export default IndiaHeatmap; 