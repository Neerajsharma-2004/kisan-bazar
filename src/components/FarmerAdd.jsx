import React, { useState } from 'react';
import { db } from '../firebase.js';
import { collection, addDoc } from 'firebase/firestore';

export default function FarmerAdd({ user }){
  const [form,setForm] = useState({ name:'', price:'', unit:'kg', imgFile:null, tags:'' });
  const [busy,setBusy] = useState(false);

  async function submit(e){
    e.preventDefault();
    setBusy(true);
    let img = '/images/produce.svg';
    if(form.imgFile){
      const r = new FileReader();
      img = await new Promise(res=>{ r.onload=()=>res(r.result); r.readAsDataURL(form.imgFile); });
    }
    const payload = { name: form.name, price: Number(form.price)||0, unit: form.unit, img, tags: form.tags?form.tags.split(',').map(t=>t.trim()):[], owner: user.uid, ownerRole:'farmer', createdAt: Date.now() };
    try{ await addDoc(collection(db, 'products'), payload); alert('Added'); setForm({ name:'', price:'', unit:'kg', imgFile:null, tags:'' }); } catch(e){ console.error(e); alert('Failed'); }
    setBusy(false);
  }

  return (
    <div className="max-w-lg mx-auto card p-4 bg-white">
      <h3 className="font-semibold mb-3">Add Listing</h3>
      <form onSubmit={submit} className="grid gap-3">
        <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Name" className="border p-2 rounded" />
        <input required value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="Price" className="border p-2 rounded" />
        <select value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} className="border p-2 rounded">
          <option>kg</option><option>litre</option><option>unit</option>
        </select>
        <input type="file" accept="image/*" onChange={e=>setForm({...form,imgFile:e.target.files[0]})} />
        <input value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} placeholder="tags (comma)" className="border p-2 rounded" />
        <div className="flex justify-end"><button disabled={busy} className="px-4 py-2 rounded bg-teal-600 text-white">{busy?'Adding...':'Add Listing'}</button></div>
      </form>
    </div>
  );
}
