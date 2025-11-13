import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.js';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export default function MapView(){
  const [products,setProducts]=useState([]);
  useEffect(()=>{
    const q = query(collection(db, 'products'));
    const unsub = onSnapshot(q, snap=> setProducts(snap.docs.map(d=>({ id:d.id, ...d.data() }))));
    return ()=>unsub();
  },[]);

  return (
    <div className="h-96 rounded overflow-hidden card">
      <MapContainer center={[23.0,77.0]} zoom={5} style={{height:'100%', width:'100%'}}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {products.filter(p=>p.location).map(p=> (
          <Marker key={p.id} position={[p.location.lat, p.location.lng]}>
            <Popup><div className="font-semibold">{p.name}</div><div>₹{p.price}/{p.unit}</div></Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
