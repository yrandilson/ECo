import { useState, useMemo, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import type { LatLngExpression, LeafletMouseEvent } from "leaflet";

interface InteractiveMapInputProps {
  center: LatLngExpression;
  onLocationChange: (location: { lat: number; lng: number }) => void;
}

function LocationMarker({ onLocationChange, initialPosition }: { onLocationChange: (location: { lat: number; lng: number }) => void; initialPosition: LatLngExpression }) {
  const [position, setPosition] = useState<LatLngExpression>(initialPosition);
  const map = useMap();

  // Atualizar posição quando o pai muda (ex: busca por estado/município)
  useEffect(() => {
    setPosition(initialPosition);
    map.flyTo(initialPosition, 13);
  }, [initialPosition, map]);

  useMapEvents({
    click(e: LeafletMouseEvent) {
      const newPos = e.latlng;
      setPosition(newPos);
      onLocationChange(newPos);
      map.flyTo(newPos, map.getZoom());
    },
    locationfound(e) {
      const newPos = e.latlng;
      setPosition(newPos);
      onLocationChange(newPos);
      map.flyTo(newPos, map.getZoom());
    },
  });

  const markerEventHandlers = useMemo(
    () => ({
      dragend(e: any) {
        const newPos = e.target.getLatLng();
        setPosition(newPos);
        onLocationChange(newPos);
      },
    }),
    [onLocationChange]
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={markerEventHandlers}
      position={position}
    ></Marker>
  );
}

export default function InteractiveMapInput({ center, onLocationChange }: InteractiveMapInputProps) {

  const handleLocationChange = useCallback((location: { lat: number; lng: number }) => {
    onLocationChange(location);
  }, [onLocationChange]);

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-700">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onLocationChange={handleLocationChange} initialPosition={center} />
      </MapContainer>
    </div>
  );
}
