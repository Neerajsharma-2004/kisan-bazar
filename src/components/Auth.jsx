import React, { useState } from 'react';
import { auth, db } from '../firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function Auth(){
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [role,setRole]=useState('buyer');
  const [error,setError]=useState(null);

  async function register(){
    setError(null);
    try{
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      await setDoc(doc(db, 'users', uid), { name: name||email.split('@')[0], email, role, createdAt: Date.now() });
    }catch(e){ setError(e.message); }
  }

  async function login(){
    setError(null);
    try{
      await signInWithEmailAndPassword(auth, email, password);
    }catch(e){ setError(e.message); }
  }

  return (
    <div className="max-w-md mx-auto card p-6 bg-white">
      <h3 className="text-xl font-semibold mb-3">Sign in / Register</h3>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="w-full border rounded p-2 mb-2" />
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full border rounded p-2 mb-2" />
      <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="w-full border rounded p-2 mb-2" />
      <select value={role} onChange={e=>setRole(e.target.value)} className="w-full border rounded p-2 mb-4">
        <option value="buyer">Buyer</option>
        <option value="farmer">Farmer</option>
      </select>
      <div className="flex gap-2">
        <button onClick={login} className="px-4 py-2 rounded bg-teal-600 text-white">Login</button>
        <button onClick={register} className="px-4 py-2 rounded border">Register</button>
      </div>
    </div>
  );
}
