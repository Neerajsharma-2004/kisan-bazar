import React, { useEffect, useState } from 'react';
import { db } from '../firebase.js';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import Checkout from './Checkout.jsx';

export default function Market({ user }){
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(()=>{
    const q = query(collection(db, 'products'), orderBy('createdAt','desc'));
    const unsub = onSnapshot(q, snap => {
      setProducts(snap.docs.map(d=>({ id: d.id, ...d.data() })));
    }, err => { console.warn('products listener', err); });
    return ()=>unsub();
  },[]);

  function addToCart(p){
    setCart(prev=>{
      const idx = prev.findIndex(i=>i.id===p.id);
      if(idx!==-1){ const copy=[...prev]; copy[idx].qty=(copy[idx].qty||1)+1; return copy; }
      return [...prev, {...p, qty:1}];
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Market</h2>
        <div className="flex gap-2 items-center">
          <button className="px-3 py-2 rounded border" onClick={()=>setShowCheckout(true)}>Cart • ₹{cart.reduce((s,i)=>s + (i.price*(i.qty||1)),0)}</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map(p=>(
          <div key={p.id} className="card bg-white p-4">
            <img src={p.img} alt={p.name} className="h-48 w-full object-cover rounded-md mb-3" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{p.name}</h3>
              <div className="text-sm text-gray-500">₹{p.price}/{p.unit}</div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{p.tags && p.tags.join(', ')}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={()=>addToCart(p)} className="px-3 py-2 rounded bg-gradient-to-r from-teal-600 to-emerald-500 text-white">Add</button>
            </div>
          </div>
        ))}
      </div>

      {showCheckout && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-2xl"><Checkout user={user} cart={cart} onClose={()=>setShowCheckout(false)} /></div>
      </div>}
    </div>
  );
}
