import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase.js';

export default function Checkout({ user, cart, onClose }){
  const [busy,setBusy]=useState(false);
  const total = cart.reduce((s,i)=> s + (i.price*(i.qty||1)), 0);

  async function place(){
    setBusy(true);
    const payload = { buyerId: user.uid, buyerName: user.name, items: cart, total, status:'pending', createdAt: Date.now() };
    try{ await addDoc(collection(db, 'orders'), payload); alert('Order placed'); onClose(); } catch(e){ console.error(e); alert('Failed'); }
    setBusy(false);
  }

  return (
    <div className="bg-white card p-4">
      <h3 className="font-semibold">Checkout</h3>
      <div className="mt-2">Total: ₹{total}</div>
      <div className="mt-3 flex justify-end">
        <button onClick={place} disabled={busy} className="px-4 py-2 rounded bg-teal-600 text-white">{busy?'Placing...':'Place Order'}</button>
      </div>
    </div>
  );
}
