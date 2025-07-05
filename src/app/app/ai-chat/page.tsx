"use client";

import { useState, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TShirtInventoryResponse,
  VolunteerStatsResponse,
  SevaCategoryStatsResponse,
  CheckInResponse,
  ErrorResponse,
  HelpResponse
} from './components/response-formatters';

interface Message {
  id: string;
  text?: string;
  content?: React.ReactNode;
  sender: "user" | "bot";
  type?: string;
  data?: any;
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: <HelpResponse />,
      sender: 'bot',
      type: 'help'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), text: input, sender: "user" };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Actual API call to the chatbot backend
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.text }), // Send the user's message text
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ reply: `Error: ${response.statusText}` }));
        throw new Error(errorData.reply || `Error: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      // Create rich bot message based on response type
      const botMessage: Message = {
        id: Date.now().toString() + '-bot',
        sender: "bot",
        type: responseData.type || 'text',
        data: responseData.data
      };

      // Set content based on response type
      switch (responseData.type) {
        case 'tshirt_inventory':
          botMessage.content = (
            <TShirtInventoryResponse 
              data={responseData.data.data}
              title={responseData.data.title}
              message={responseData.data.message}
            />
          );
          break;
        case 'volunteer_stats':
          botMessage.content = (
            <VolunteerStatsResponse 
              data={responseData.data.data}
              stats={responseData.data.stats}
              title={responseData.data.title}
              message={responseData.data.message}
            />
          );
          break;
        case 'seva_category_stats':
          botMessage.content = (
            <SevaCategoryStatsResponse 
              data={responseData.data.data}
              title={responseData.data.title}
              message={responseData.data.message}
            />
          );
          break;
        case 'check_in_stats':
          botMessage.content = (
            <CheckInResponse 
              data={responseData.data.data}
              title={responseData.data.title}
              dateContext={responseData.data.dateContext}
              message={responseData.data.message}
            />
          );
          break;
        case 'error':
          botMessage.content = (
            <ErrorResponse 
              message={responseData.data.message}
              suggestions={responseData.data.suggestions}
            />
          );
          break;
        case 'help':
          botMessage.content = <HelpResponse />;
          break;
        default:
          botMessage.text = responseData.reply || responseData.data;
      }

      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error: any) {
      console.error("Failed to send message:", error);
      const errorMessageText = error.message || "Sorry, I couldn't get a response. Please try again.";
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        content: (
          <ErrorResponse 
            message={errorMessageText}
            suggestions={['Check your internet connection', 'Try asking a different question', 'Contact support if the issue persists']}
          />
        ),
        sender: "bot",
        type: 'error'
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 flex flex-col h-[calc(100vh-100px)]">
      <Card className="flex flex-col flex-grow">
        <CardHeader>
          <CardTitle>Ask AI</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden">
          <ScrollArea className="h-full pr-4">
            {messages.map((msg) => (
              <div key={msg.id} className="mb-4">
                {msg.sender === 'user' ? (
                  <div className="flex justify-end">
                    <div className="bg-blue-500 text-white p-3 rounded-lg max-w-[80%]">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div className="max-w-[95%] w-full">
                      {msg.content ? msg.content : (
                        <div className="bg-gray-200 text-gray-800 p-3 rounded-lg">
                          {msg.text}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-grow"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
