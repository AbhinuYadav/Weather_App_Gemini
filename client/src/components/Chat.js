// client/src/components/Chat.js
import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/weatherService'; // Import our chat API service

const Chat = ({ sessionId, weatherContext }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const messagesEndRef = useRef(null); // Ref for auto-scrolling chat

  // Scroll to bottom of messages whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage = { sender: 'user', text: newMessage };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setNewMessage(''); // Clear input field

    setChatLoading(true);
    setChatError(null);

    try {
      const response = await sendChatMessage(sessionId, userMessage.text, weatherContext);
      setMessages((prevMessages) => [...prevMessages, { sender: 'ai', text: response.reply }]);
    } catch (err) {
      setChatError(err.message || 'Failed to get a response from the AI.');
      console.error('Error in chat:', err);
      // Optionally add an error message to the chat history
      setMessages((prevMessages) => [...prevMessages, { sender: 'system', text: `Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <section className="chat-container">
      <h3>AI Weather Assistant Chat</h3>
      <div className="messages-display">
        {messages.length === 0 ? (
          <p className="no-messages">Ask me anything about the weather!</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              {msg.sender === 'user' && <strong>You: </strong>}
              {msg.sender === 'ai' && <strong>AI: </strong>}
              {msg.sender === 'system' && <strong>System: </strong>}
              {msg.text}
            </div>
          ))
        )}
        {chatLoading && <div className="message ai typing">AI is thinking...</div>}
        {chatError && <p className="chat-error">{chatError}</p>}
        <div ref={messagesEndRef} /> {/* Element to scroll into view */}
      </div>
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={handleMessageChange}
          placeholder="Ask about the weather..."
          className="chat-input"
          disabled={chatLoading}
        />
        <button type="submit" className="send-button" disabled={chatLoading}>
          {chatLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </section>
  );
};

export default Chat;