"use client";

import { useState, useEffect } from "react";
import { Send, Bot, User, Loader2, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function FinGPTPage() {
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage("");
    setIsLoading(true);

    // Add user message to chat immediately
    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: userMessage }
    ]);

    try {
      // Prepare conversation history for Gemini API format
      const conversationHistory = chatHistory.slice(-10).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      }));

      // Add system instruction and current user message
      const contents = [
        ...conversationHistory,
        {
          role: "user",
          parts: [{
            text: `You are FinGPT, a helpful AI assistant focused on financial topics. Provide clear, accurate, and helpful financial advice and information. User question: ${userMessage}`
          }]
        }
      ];

      // Make direct call to Google Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyCkApetwCEZuzgMHInDtYuWK_v41jTA-PI`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1000,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText || 'Unknown error'}`);
      }

      const data = await response.json();
      const assistantResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!assistantResponse) {
        throw new Error('No response from the AI model');
      }

      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: assistantResponse }
      ]);
    } catch (error) {
      console.error("FinGPT Error:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error occurred'}. Please try again.`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b z-10">
        <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/home">
            <Button variant="ghost" className="gap-2">
              <Home className="w-5 h-5" />
              Home
            </Button>
          </Link>
          <h1 className="text-xl font-bold">FinGPT</h1>
          <Link href="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="pt-16 pb-32 min-h-screen">
        <div className="max-w-2xl mx-auto px-4">
          <AnimatePresence>
            {chatHistory.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-gray-500 mt-12 px-4"
              >
                <Bot size={48} className="mx-auto mb-4 text-gray-400" />
                <h2 className="text-2xl font-bold mb-2">Welcome to FinGPT</h2>
                <p className="mb-1">Your AI-powered financial assistant</p>
                <p className="text-sm">Ask me about financial markets, investment strategies, or economic trends!</p>
                <p className="text-xs mt-4 text-gray-400">Powered by Google Gemini 2.0 Flash</p>
              </motion.div>
            ) : (
              chatHistory.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`py-6 ${msg.role === "assistant" ? "bg-white rounded-lg my-2 shadow-sm" : ""}`}
                >
                  <div className="flex items-start gap-4 px-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === "user" ? "bg-blue-500" : "bg-teal-500"
                    }`}>
                      {msg.role === "user" ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="font-medium">
                        {msg.role === "user" ? "You" : "FinGPT"}
                      </div>
                      <div className="text-gray-700">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-50 to-transparent pt-10 pb-6">
        <div className="max-w-2xl mx-auto px-4">
          <form onSubmit={handleSubmit} className="relative bg-white rounded-lg shadow-lg">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message FinGPT..."
              className="w-full pr-12 py-3 rounded-lg border-gray-200"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100"
              variant="ghost"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                <Send className="w-5 h-5 text-gray-400" />
              )}
            </Button>
          </form>
          <p className="text-xs text-center mt-2 text-gray-500">
            FinGPT provides general financial information and should not be considered as financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}