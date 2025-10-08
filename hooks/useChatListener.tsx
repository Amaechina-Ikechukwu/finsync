import { auth, database } from "@/firebase";
import { limitToLast, off, onChildAdded, orderByChild, query, ref } from "firebase/database";
import { useEffect, useState } from "react";

type ChatMessage = {
  id: string;
  text: string;
  from: "user" | "agent";
  timestamp: number;
};

export function useChatListener() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const messagesRef = ref(database, `messages/${uid}`);
    const messagesQuery = query(messagesRef, orderByChild("createdAt"), limitToLast(100));

    // Realtime listener
    const unsubscribe = onChildAdded(messagesQuery, (snapshot) => {
      const val = snapshot.val();
      if (!val) return;

      const msg: ChatMessage = {
        id: val.id || snapshot.key!,
        text: val.text || "",
        from: val.from === "agent" || val.from === "admin" ? "agent" : "user",
        timestamp: typeof val.createdAt === "number" ? val.createdAt : Date.now(),
      };
  

      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev; // avoid duplicates
        const next = [...prev, msg];
        next.sort((a, b) => a.timestamp - b.timestamp);
        return next;
      });
    });

    return () => off(messagesQuery, "child_added", unsubscribe);
  }, []);

  return messages;
}
