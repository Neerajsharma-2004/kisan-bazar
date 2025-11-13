/* seed_firestore_admin.cjs
Run locally:
1) npm i firebase-admin
2) place serviceAccountKey.json in project root
3) node seed_firestore_admin.cjs
This script will create Auth users and Firestore documents (products, chats).
*/
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const keyPath = path.join(__dirname, 'serviceAccountKey.json');
if(!fs.existsSync(keyPath)){ console.error('serviceAccountKey.json missing'); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });
const db = admin.firestore();
(async ()=>{
  try{
    const accounts = [
      { uid: 'u_farmer_ravi', email: 'ravi@example.com', password: 'Ravi@1234', displayName: 'Ravi Patil', role: 'farmer', location: { lat: 19.9975, lng: 73.7898 } },
      { uid: 'u_farmer_sarita', email: 'sarita@example.com', password: 'Sarita@1234', displayName: 'Sarita Devi', role: 'farmer', location: { lat: 26.0706, lng: 83.1859 } },
      { uid: 'u_buyer_neeraj', email: 'neeraj@example.com', password: 'Neeraj@1234', displayName: 'Neeraj Sharma', role: 'buyer', location: { lat: 28.6139, lng: 77.2090 } }
    ];
    for(const a of accounts){
      try{
        let u = null;
        try{ u = await admin.auth().getUserByEmail(a.email); } catch(e){}
        if(!u){ u = await admin.auth().createUser({ uid: a.uid, email: a.email, password: a.password, displayName: a.displayName }); console.log('created', a.email); }
        await admin.auth().setCustomUserClaims(a.uid, { role: a.role });
        await db.collection('users').doc(a.uid).set({ name: a.displayName, email: a.email, role: a.role, location: a.location, createdAt: Date.now() }, { merge:true });
        console.log('seeded user doc', a.uid);
      }catch(e){ console.error('user seed failed', e); }
    }
    const products = [
      { id:'p1', name:'Tomatoes', price:20, unit:'kg', img:'/images/tomatoes.jpg', owner:'u_farmer_ravi', ownerRole:'farmer', location:{lat:19.9975,lng:73.7898}, createdAt:Date.now() },
      { id:'p2', name:'Mangoes', price:50, unit:'kg', img:'/images/mangoes.jpg', owner:'u_farmer_ravi', ownerRole:'farmer', location:{lat:19.9975,lng:73.7898}, createdAt:Date.now() },
      { id:'p3', name:'Turmeric', price:180, unit:'kg', img:'/images/turmeric.jpg', owner:'u_farmer_sarita', ownerRole:'farmer', location:{lat:26.0706,lng:83.1859}, createdAt:Date.now() }
    ];
    for(const p of products){ await db.collection('products').doc(p.id).set(p); console.log('product', p.id); }
    const chatRef = db.collection('chats').doc('chat_neeraj_ravi');
    await chatRef.set({ chatId:'chat_neeraj_ravi', participants:['u_buyer_neeraj','u_farmer_ravi'], createdAt:Date.now() });
    await chatRef.collection('messages').add({ from:'u_buyer_neeraj', text: 'Hi Ravi, do you have tomatoes today?', ts: Date.now() });
    console.log('chat seeded');
    console.log('done'); process.exit(0);
  }catch(e){ console.error(e); process.exit(1); }
})();