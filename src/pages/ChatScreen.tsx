import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import { z } from 'zod';
import { getBackendBaseUrl, getBackendPublishableKey } from '@/lib/backend/env';
import AIBadge from '@/components/AIBadge';
type Message = { role: 'user' | 'assistant'; content: string };

// Schema for validating streaming chat response chunks
const ChatStreamChunkSchema = z.object({
  choices: z.array(z.object({
    delta: z.object({
      content: z.string().optional(),
    }).optional(),
  })).optional(),
});

const ChatScreen = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '🌳 Xin chào! Mình là **AI Assistant** - trợ lý thông minh hướng dẫn đo cây. Bạn muốn biết cách đo chiều cao hay chu vi cây? Hãy hỏi mình nhé!'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const streamChat = async (userMessages: Message[]) => {
    const baseUrl = getBackendBaseUrl();
    if (!baseUrl) throw new Error('Missing backend base URL');

    const resp = await fetch(`${baseUrl}/functions/v1/tree-measurement-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getBackendPublishableKey()}`,
      },
      body: JSON.stringify({ messages: userMessages }),
    });

    if (!resp.ok || !resp.body) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to start stream');
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let assistantContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const rawParsed = JSON.parse(jsonStr);
          
          // Validate the chunk structure with zod
          const validationResult = ChatStreamChunkSchema.safeParse(rawParsed);
          if (!validationResult.success) {
            console.warn('Invalid stream chunk format:', validationResult.error);
            continue;
          }
          
          const parsed = validationResult.data;
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant' && prev.length > 1 && prev[prev.length - 2]?.role === 'user') {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
              }
              return [...prev, { role: 'assistant', content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async (input: string) => {
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      await streamChat([...messages, userMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '❌ Xin lỗi, có lỗi xảy ra. Vui lòng thử lại nhé!' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header
        className="flex items-center gap-3 p-4 border-b border-primary/20 bg-gradient-to-r from-card/80 to-card/50 backdrop-blur-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/');
            }
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <motion.div 
          className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center border border-primary/40 shadow-lg shadow-primary/10"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Bot className="w-5 h-5 text-primary" />
        </motion.div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-foreground">AI Assistant</h1>
            <AIBadge size="sm" variant="glow" showText={false} />
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary/60" />
            Trợ lý thông minh hướng dẫn đo cây
          </p>
        </div>
      </motion.header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}
        
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div 
              className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center border border-primary/30"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Bot className="w-4 h-4 text-primary" />
            </motion.div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-3 h-3 text-primary" />
                </motion.div>
                <span className="text-xs text-muted-foreground">AI đang suy nghĩ...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50 bg-card/50 backdrop-blur-sm">
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default ChatScreen;
