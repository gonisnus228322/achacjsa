'use client';

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import { upload } from '@vercel/blob/client';

// Configure users and customizable passwords here
const USER_ACCOUNTS: Record<string, string> = {
  xalaxxi: '123456',
  Aa: '123456',
  betterthanmc: '123456',
  coolboy: '123456',
};

interface ChatMessage {
  id: string;
  username: string;
  text: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video' | 'file';
  attachmentName?: string;
  timestamp: string;
}

export default function DiscordChat() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('xalaxxi');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Messaging state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch chat history
  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Poll every 3s
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const expectedPassword = USER_ACCOUNTS[selectedUser];
    if (passwordInput === expectedPassword) {
      setCurrentUser(selectedUser);
    } else {
      setLoginError('Invalid password. Default is 123456.');
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const getAttachmentType = (file: File): 'image' | 'video' | 'file' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'file';
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !selectedFile) return;

    setIsUploading(true);
    let attachmentUrl = '';
    let attachmentType: 'image' | 'video' | 'file' | undefined = undefined;
    let attachmentName = '';

    try {
      if (selectedFile) {
        attachmentType = getAttachmentType(selectedFile);
        attachmentName = selectedFile.name;

        const blob = await upload(selectedFile.name, selectedFile, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        });
        attachmentUrl = blob.url;
      }

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser,
          text: text.trim(),
          attachmentUrl: attachmentUrl || undefined,
          attachmentType,
          attachmentName: attachmentName || undefined,
        }),
      });

      if (res.ok) {
        setText('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchMessages();
      }
    } catch (err) {
      alert('Failed to send message/file.');
    } finally {
      setIsUploading(false);
    }
  };

  // Login Modal View
  if (!currentUser) {
    return (
      <div className="login-overlay">
        <form onSubmit={handleLogin} className="discord-login-card">
          <div className="login-header">
            <h2>Welcome back!</h2>
            <p>We're so excited to see you again!</p>
          </div>

          <div className="input-group">
            <label>SELECT ACCOUNT</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="discord-select"
            >
              {Object.keys(USER_ACCOUNTS).map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>PASSWORD</label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password"
              className="discord-input"
              required
            />
          </div>

          {loginError && <p className="login-error">{loginError}</p>}

          <button type="submit" className="btn-discord-primary">
            Log In
          </button>
        </form>
      </div>
    );
  }

  // Main Discord UI
  return (
    <div className="discord-app">
      {/* Discord Left Sidebar */}
      <aside className="discord-sidebar">
        <div className="server-header">
          <span className="server-name">Private Server</span>
        </div>

        <div className="channel-list">
          <div className="channel-item active">
            <span className="hash">#</span> general
          </div>
        </div>

        <div className="user-profile-bar">
          <div className="avatar">{currentUser[0].toUpperCase()}</div>
          <div className="user-details">
            <span className="username">{currentUser}</span>
            <span className="status-indicator">Online</span>
          </div>
          <button onClick={() => setCurrentUser(null)} className="btn-logout" title="Log Out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="discord-chat-container">
        {/* Top Channel Bar */}
        <header className="channel-bar">
          <span className="hash">#</span>
          <span className="channel-title">general</span>
        </header>

        {/* Message Feed */}
        <div className="messages-feed">
          {messages.map((msg) => (
            <div key={msg.id} className="message-row">
              <div className="avatar msg-avatar">{msg.username[0].toUpperCase()}</div>
              <div className="message-content-wrapper">
                <div className="message-header">
                  <span className="msg-username">{msg.username}</span>
                  <span className="msg-timestamp">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {msg.text && <p className="msg-text">{msg.text}</p>}

                {msg.attachmentUrl && (
                  <div className="attachment-box">
                    {msg.attachmentType === 'image' && (
                      <img src={msg.attachmentUrl} alt="attachment" className="attached-media" />
                    )}

                    {msg.attachmentType === 'video' && (
                      <video src={msg.attachmentUrl} controls className="attached-media" />
                    )}

                    {msg.attachmentType === 'file' && (
                      <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="file-attachment-link">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                          <polyline points="13 2 13 9 20 9" />
                        </svg>
                        <span>{msg.attachmentName || 'Download File'}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="chat-input-wrapper">
          {selectedFile && (
            <div className="file-preview-strip">
              <span className="file-preview-name">Attached: {selectedFile.name}</span>
              <button type="button" onClick={() => setSelectedFile(null)} className="btn-remove-file">
                ✕
              </button>
            </div>
          )}

          <div className="input-box">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload" className="btn-attach" title="Attach file, image, or video">
              +
            </label>

            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Message #general...`}
              className="chat-text-input"
              disabled={isUploading}
            />

            <button type="submit" disabled={isUploading || (!text.trim() && !selectedFile)} className="btn-send">
              {isUploading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
