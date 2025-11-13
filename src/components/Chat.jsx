// src/components/Chat.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  serverTimestamp
} from "firebase/firestore";

/**
 * Instagram-style DM (with avatars/initials).
 * Left: conversations list (with avatars)
 * Right: message thread for selected conversation
 *
 * Usage: <Chat user={user} />
 */

function Avatar({ user }) {
  // user may have .avatar or .photoURL, otherwise show initials
  if (!user) {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
        ?
      </div>
    );
  }
  if (user.avatar || user.photoURL) {
    return (
      <img
        src={user.avatar || user.photoURL}
        alt={user.name || "avatar"}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }
  const initials = (user.name || user.email || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  // Generate a deterministic background color using char codes
  let colorSeed = 0;
  for (let i = 0; i < initials.length; i++) colorSeed += initials.charCodeAt(i);
  const bgColors = ["bg-amber-200", "bg-emerald-200", "bg-sky-200", "bg-pink-200", "bg-lime-200"];
  const bg = bgColors[colorSeed % bgColors.length];

  return (
    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${bg} text-gray-800`}>
      {initials}
    </div>
  );
}

export default function Chat({ user }) {
  const [conversations, setConversations] = useState([]); // { id, participants, otherUid, otherUser }
  const [selectedConv, setSelectedConv] = useState(null); // { id, otherUid, otherUser }
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [allFarmers, setAllFarmers] = useState([]); // used for buyer to start new conv
  const messagesRefCache = useRef(null);

  // listen to conversations where current user is a participant
  useEffect(() => {
    if (!user || !user.uid) return;
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, async (snap) => {
      const docs = snap.docs;
      // map, enrich other participant info
      const convs = await Promise.all(
        docs.map(async (d) => {
          const data = d.data();
          const id = d.id;
          const participants = data.participants || [];
          const otherUid = participants.find((p) => p !== user.uid) || participants[0] || null;
          let otherUser = null;
          try {
            if (otherUid) {
              const ud = await getDoc(doc(db, "users", otherUid));
              otherUser = ud.exists() ? { uid: ud.id, ...ud.data() } : { uid: otherUid, name: otherUid };
            }
          } catch (e) {
            otherUser = { uid: otherUid, name: otherUid };
          }
          return { id, participants, otherUid, otherUser, lastUpdated: data.createdAt || data.updatedAt || 0 };
        })
      );
      setConversations(convs);
      // auto-select first conv if none selected
      if (!selectedConv && convs.length > 0) {
        setSelectedConv(convs[0]);
      } else {
        // if conversation currently selected, refresh it from convs list so fields update
        if (selectedConv) {
          const found = convs.find((c) => c.id === selectedConv.id);
          if (found) setSelectedConv(found);
        }
      }
    }, (err) => {
      console.warn("conversations listener error", err);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // load messages for selected conversation
  useEffect(() => {
    // cleanup previous subscription
    if (messagesRefCache.current) {
      messagesRefCache.current(); // unsubscribe
      messagesRefCache.current = null;
    }
    setMessages([]);
    if (!selectedConv) return;
    const chatId = selectedConv.id;
    // listen messages subcollection
    const msgsCol = collection(db, "chats", chatId, "messages");
    const q = query(msgsCol, orderBy("ts", "asc"));
    const unsubMsgs = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      // scroll to bottom handled by DOM after render
    }, (err) => {
      console.warn("messages listener error", err);
    });
    messagesRefCache.current = unsubMsgs;
    return () => {
      if (messagesRefCache.current) {
        messagesRefCache.current();
        messagesRefCache.current = null;
      }
    };
  }, [selectedConv]);

  // load farmers list (for buyers to start new convs)
  useEffect(() => {
    const loadFarmers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const arr = snap.docs.map(d => ({ uid: d.id, ...d.data() })).filter(u => u.role === "farmer");
        setAllFarmers(arr);
      } catch (e) {
        console.warn("failed to load farmers", e);
      }
    };
    loadFarmers();
  }, []);

  // helper to compute chatId (deterministic)
  function computeChatId(a, b) {
    const arr = [a, b].filter(Boolean).slice(0, 2).sort();
    return arr.join("_");
  }

  // start or open a conversation with otherUid
  async function openConversationWith(otherUid) {
    if (!user || !user.uid || !otherUid) return;
    const chatId = computeChatId(user.uid, otherUid);
    const chatRef = doc(db, "chats", chatId);
    // ensure chat doc exists with participants array
    try {
      await setDoc(chatRef, { chatId: chatId, participants: [user.uid, otherUid], createdAt: Date.now() }, { merge: true });
      // load other user's profile
      let otherUser = null;
      try {
        const ud = await getDoc(doc(db, "users", otherUid));
        otherUser = ud.exists() ? { uid: ud.id, ...ud.data() } : { uid: otherUid, name: otherUid };
      } catch (e) {
        otherUser = { uid: otherUid, name: otherUid };
      }
      const conv = { id: chatId, participants: [user.uid, otherUid], otherUid, otherUser };
      setSelectedConv(conv);
    } catch (e) {
      console.error("openConversation error", e);
    }
  }

  // send message into selected conversation
  async function sendMessage() {
    if (!selectedConv || !text.trim()) return;
    const chatId = selectedConv.id;
    const msgsCol = collection(db, "chats", chatId, "messages");
    try {
      await addDoc(msgsCol, { from: user.uid, text: text.trim(), ts: Date.now() });
      setText("");
    } catch (e) {
      console.error("sendMessage failed", e);
      alert("Failed to send message: " + (e.message || e));
    }
  }

  // utility to show formatted time
  function fmtTime(ts) {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  }

  // render left conversation item
  function ConvItem({ conv, active }) {
    return (
      <button
        onClick={() => setSelectedConv(conv)}
        className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded ${active ? "bg-gray-100" : "hover:bg-gray-50"}`}
      >
        <Avatar user={conv.otherUser} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="font-medium text-sm">{conv.otherUser?.name || conv.otherUid}</div>
            <div className="text-xs text-gray-400">{conv.lastUpdated ? "" : ""}</div>
          </div>
          <div className="text-xs text-gray-500 mt-1 truncate">
            {/* optionally show last message snippet if desired */}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Left: inbox / conversations */}
      <div className="col-span-1 card bg-white p-3 h-[70vh] overflow-auto">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex-1">
            <input
              placeholder="Search"
              className="w-full border rounded px-3 py-2 text-sm"
              onChange={(e) => {
                // optional: implement search if you want (quick filter client-side)
                const q = e.target.value.toLowerCase();
                if (!q) {
                  // reload conversations — we rely on onSnapshot so it's already correct
                } else {
                  setConversations((prev) => prev.filter(c => (c.otherUser?.name || c.otherUid || "").toLowerCase().includes(q)));
                }
              }}
            />
          </div>
          <div>
            <button
              className="text-sm px-3 py-1 border rounded"
              onClick={() => {
                // refresh conversation list by reloading (force by toggling state)
                setConversations((c) => [...c]);
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* If user is a farmer: show conversations list (chats). If none, a small hint */}
        {user?.role === "farmer" ? (
          <>
            <div className="text-xs text-gray-500 mb-2">Your messages</div>
            <div className="space-y-2">
              {conversations.length === 0 && (
                <div className="text-sm text-gray-500">No conversations yet. Buyers will appear here when they message you.</div>
              )}
              {conversations.map((c) => (
                <ConvItem key={c.id} conv={c} active={selectedConv && selectedConv.id === c.id} />
              ))}
            </div>
          </>
        ) : (
          // Buyer: show conversation list plus farmer quick-start list
          <>
            <div className="text-xs text-gray-500 mb-2">Conversations</div>
            <div className="space-y-2 mb-4">
              {conversations.map((c) => (
                <ConvItem key={c.id} conv={c} active={selectedConv && selectedConv.id === c.id} />
              ))}
              {conversations.length === 0 && <div className="text-sm text-gray-500">No chats yet. Start by contacting a farmer below.</div>}
            </div>

            <div className="text-xs text-gray-500 mb-2">Farmers</div>
            <div className="space-y-2">
              {allFarmers.map((f) => (
                <button
                  key={f.uid}
                  onClick={() => openConversationWith(f.uid)}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50"
                >
                  <Avatar user={f} />
                  <div>
                    <div className="font-medium text-sm">{f.name || f.email}</div>
                    <div className="text-xs text-gray-500">Farmer</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right: messages area */}
      <div className="md:col-span-2 card bg-white p-4 h-[70vh] flex flex-col">
        {selectedConv ? (
          <>
            <div className="flex items-center gap-3 border-b pb-3 mb-3">
              <Avatar user={selectedConv.otherUser} />
              <div>
                <div className="font-semibold">{selectedConv.otherUser?.name || selectedConv.otherUid}</div>
                <div className="text-xs text-gray-500">Conversation</div>
              </div>
            </div>

            <div id="messages-scroll" className="flex-1 overflow-auto space-y-3 p-2 bg-gray-50 rounded">
              {messages.length === 0 && <div className="text-sm text-gray-500">No messages yet. Say hi 👋</div>}
              {messages.map((m) => {
                const mine = m.from === user.uid;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`${mine ? "bg-teal-600 text-white" : "bg-white text-gray-800"} max-w-[75%] p-2 rounded-lg shadow-sm`}>
                      <div className="text-sm break-words">{m.text}</div>
                      <div className="text-xs text-gray-300 mt-1 text-right">{fmtTime(m.ts)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3">
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Message..."
                  className="flex-1 border rounded px-3 py-2"
                />
                <button onClick={sendMessage} className="px-4 py-2 rounded bg-teal-600 text-white">Send</button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">Select a conversation to start chatting.</div>
        )}
      </div>
    </div>
  );
}
