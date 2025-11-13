import React, { useEffect, useState } from 'react';
import Auth from './components/Auth.jsx';
import Market from './components/Market.jsx';
import MapView from './components/MapView.jsx';
import Chat from './components/Chat.jsx';
import FarmerAdd from './components/FarmerAdd.jsx';
import Checkout from './components/Checkout.jsx';
import { firebaseApp, auth, db } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function App(){
  const [user, setUser] = useState(null);
  const [view, setView] = useState('auth'); // start at auth
  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (u)=>{
      if(u){
        try{
          const d = await getDoc(doc(db, 'users', u.uid));
          const profile = { uid: u.uid, email: u.email, name: d.exists()?d.data().name||u.email.split('@')[0]:u.email.split('@')[0], role: d.exists()?d.data().role||'buyer':'buyer' };
          setUser(profile);
          setView('market');
        }catch(e){
          setUser({ uid: u.uid, email: u.email, name: u.email.split('@')[0], role: 'buyer' });
          setView('market');
        }
      } else {
        setUser(null);
        setView('auth');
      }
    });
    return () => unsub();
  },[]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="border-b bg-white/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="text-xl font-extrabold" style={{color:'var(--brand)'}}>Kisan <span style={{color:'var(--accent)'}}>Bazar</span></div>
            <div className="text-sm text-gray-500">Premium Marketplace</div>
          </div>
          <nav className="flex items-center gap-3">
            {user ? (
              <>
                <button className="px-3 py-2 rounded-md" onClick={()=>setView('market')}>Market</button>
                {user.role==='farmer' && <button className="px-3 py-2 rounded-md" onClick={()=>setView('add')}>Add</button>}
                <button className="px-3 py-2 rounded-md" onClick={()=>setView('map')}>Map</button>
                <button className="px-3 py-2 rounded-md" onClick={()=>setView('chat')}>Chat</button>
                <button className="px-3 py-2 rounded-md" onClick={()=>{ auth.signOut(); }}>Logout</button>
              </>
            ) : (
              <button className="px-4 py-2 rounded-md bg-gradient-to-r from-teal-600 to-emerald-500 text-white" onClick={()=>setView('auth')}>Login / Register</button>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {!user && view==='auth' && <Auth />}
        {user && view==='market' && <Market user={user} />}
        {user && view==='add' && user.role==='farmer' && <FarmerAdd user={user} />}
        {user && view==='chat' && <Chat user={user} />}
        {user && view==='map' && <MapView />}
      </main>
    </div>
  );
}
