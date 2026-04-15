"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/app/store/chatStore";
import { Pencil, Trash } from "lucide-react";
import { useTheme } from "next-themes";


type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
 
  const { theme, setTheme } = useTheme();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

 const {
  chats,
  currentChatId,
  addMessage,
  clearMessages,
  createChat,
  switchChat,
   renameChat,
  deleteChat,
   setTyping, 
} = useChatStore();

const currentChat = chats.find((chat) => chat.id === currentChatId);

const messages = currentChat?.messages || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const clearChat = () => {
    clearMessages();
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    // 👇 auto title generate (first message pe)
if (messages.length === 0) {
  const shortTitle = input.slice(0, 20); // first 20 chars
  renameChat(currentChatId, shortTitle);
}

    const newMessages = [
  ...messages.map((m) => ({
    role: m.role,
    content: m.content,
  })),
  { role: "user", content: input },
];
    addMessage({ role: "user", content: input, timestamp: Date.now() });
    setTyping(currentChatId, true); 
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: newMessages }),
    });

    // 👇 stream read karenge
    const reader = res.body?.getReader();
    const decoder = new TextDecoder("utf-8");

    let done = false;
    let aiMessage = "";
   let assistantIndex = messages.length + 1;

    // 👇 empty assistant message add
    addMessage({ role: "assistant", content: "", timestamp: Date.now() });

    while (!done) {
      const { value, done: doneReading } = await reader!.read();
      done = doneReading;

      const chunkValue = decoder.decode(value);
      aiMessage += chunkValue;

      await new Promise((resolve) => setTimeout(resolve, 50));

useChatStore.setState((state) => {
  const updatedChats = state.chats.map((chat) => {
    if (chat.id === state.currentChatId) {

      const updatedMessages = [...chat.messages];

      if (updatedMessages[assistantIndex]) {
        updatedMessages[assistantIndex] = {
          ...updatedMessages[assistantIndex],
          content: aiMessage,
        };
      }

      return { ...chat, messages: updatedMessages };
    }
    return chat;
  });

  return { chats: updatedChats };
});
    }

    setLoading(false);
    setTyping(currentChatId, false);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 text-black dark:text-white">
  
  {/* 🔥 Sidebar */}
<div className="w-64 border-r p-4 bg-gray-50 dark:bg-gray-800">
    <Button className="w-full mb-4" onClick={createChat}>
      + New Chat
    </Button>

    <div className="flex flex-col gap-2">
    {chats.map((chat) => (
  <div
    key={chat.id}
    className={`p-2 rounded-xl flex justify-between items-center hover:bg-gray-300 transition ${
  chat.id === currentChatId
    ? "bg-blue-500 text-white"
    : "bg-gray-200"
}`}
  >
    {/* Chat title */}
    <span
      className="cursor-pointer flex-1"
      onClick={() => switchChat(chat.id)}
    >
     <div className="flex flex-col">
  <span>{chat.title}</span>
 <span className="text-xs text-gray-500 truncate">
  {[...chat.messages]
    .reverse()
    .find((m) => m.role === "user")?.content || "No messages"}
</span>
  {chat.isTyping && (
    <span className="text-xs text-green-500">Typing...</span>
  )}
</div>
    </span>

    {/* Actions */}
    <div className="flex gap-2 ml-2">
      
      {/* Rename */}
      <Pencil
        size={16}
        className="cursor-pointer"
        onClick={() => {
          const newName = prompt("Enter new name:");
          if (newName) renameChat(chat.id, newName);
        }}
      />

      {/* Delete */}
      <Trash
        size={16}
        className="cursor-pointer text-red-500"
        onClick={() => deleteChat(chat.id)}
      />
    </div>
  </div>
))}
    </div>
  </div>

  {/* 🔥 Main Chat */}
  <div className="flex flex-col flex-1 p-4">
    
    {/* Header */}
    
    <div className="flex justify-between items-center mb-2">
      
    <h1 className="text-xl font-bold tracking-wide">
  💬 AI Chat
</h1>

<div>

      <Button variant="destructive" onClick={clearMessages}>
        Clear
      </Button>
      <Button
  variant="outline"
  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
>
  {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
</Button>
  </div>
    </div>

    {/* Messages */}
    <ScrollArea className="flex-1 border rounded-xl p-4 mb-4 bg-white dark:bg-gray-900">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`mb-2 p-2 rounded max-w-[80%] ${
           msg.role === "user"
  ? "bg-blue-500 text-white ml-280"
  : "bg-gray-100 dark:bg-gray-700 text-black dark:text-white mr-280"
          }`}
        >
         <div className="flex flex-col gap-1">
  <span>{msg.content}</span>
  <span className="text-[10px] opacity-70 self-end">
    {new Date(msg.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}
  </span>
</div>
        </div>
      ))}

      {loading && (
        <div className="text-gray-500 italic">AI is typing...</div>
      )}

      <div ref={bottomRef}></div>
    </ScrollArea>

    {/* Input */}
   <div className="flex gap-2 bg-white dark:bg-gray-800 p-2 rounded-xl shadow">
      <Input
      className="rounded-xl"
        placeholder="Type your message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") sendMessage();
        }}
      />
      <Button className="rounded-xl px-6" onClick={sendMessage}>Send</Button>
    </div> 
  </div>
</div>
  );
}
