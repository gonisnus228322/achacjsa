'use client';

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import { upload } from '@vercel/blob/client';

const USER_ACCOUNTS: Record<string, string> = {
  xalaxxi: '1459',
  Aa: '228322',
  betterthanmc: 'mc',
  coolboy: 'cool',
};

interface ChatMessage {
  id: string;
  username: string;
  avatarUrl?: string;
  text: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video' | 'audio' | 'file';
  attachmentName?: string;
  timestamp: string;
}

export default function DiscordChat() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('xalaxxi');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  const [showPfpModal, setShowPfpModal] = useState<boolean>(false);
  const [pfpInput, setPfpInput] = useState<string>('');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages', { cache: 'no-store' });
      if (res.ok) {
        const data: ChatMessage[] = await res.json();
        if (Array.isArray(data)) {
          setMessages((prev) => {
            const map = new Map(prev.map((m) => [m.id, m]));
            data.forEach((m) => map.set(m.id, m));
            return Array.from(map.values()).sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          });
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 1000);
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
      setLoginError('Invalid password.');
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const getAttachmentType = (file: File): 'image' | 'video' | 'audio' | 'file' => {
    const type = file.type.toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return 'image';
    }
    if (type.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv'].includes(ext)) {
      return 'video';
    }
    if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
      return 'audio';
    }
    return 'file';
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    let attachmentUrl = '';
    let attachmentType: 'image' | 'video' | 'audio' | 'file' | undefined = undefined;
    let attachmentName = '';

    try {
      if (selectedFile) {
        attachmentType = getAttachmentType(selectedFile);
        attachmentName = selectedFile.name;

        const blob = await upload(selectedFile.name, selectedFile, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          onUploadProgress: (progressEvent: { percentage: number }) => {
            setUploadProgress(Math.round(progressEvent.percentage));
          },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        attachmentUrl = blob.url;
      }

      const currentAvatar = currentUser ? userAvatars[currentUser] : '';

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser,
          avatarUrl: currentAvatar,
          text: text.trim(),
          attachmentUrl: attachmentUrl || undefined,
          attachmentType,
          attachmentName: attachmentName || undefined,
        }),
      });

      if (res.ok) {
        const savedMsg: ChatMessage = await res.json();
        setMessages((prev) => [...prev.filter((m) => m.id !== savedMsg.id), savedMsg]);
        setText('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch {
      alert('Upload failed. Please check network and try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
    try {
      await fetch(`/api/messages?id=${id}`, {
        method: 'DELETE',
      });
    } catch {
      alert('Could not delete message.');
    }
  };

  const saveProfilePicture = () => {
    if (currentUser) {
      setUserAvatars((prev) => ({ ...prev, [currentUser]: pfpInput.trim() }));
    }
    setShowPfpModal(false);
    setPfpInput('');
  };

  if (!currentUser) {
    return (
      <div className="login-overlay">
        <form onSubmit={handleLogin} className="discord-login-card">
          <div className="login-header">
            <h2>Welcome Back</h2>
            <p className="subtitle">Private Vault Login</p>
          </div>

          <div className="input-group">
            <label>ACCOUNT</label>
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

  const userPfp = userAvatars[currentUser];

  return (
    <div className="discord-app">
      <aside className="discord-sidebar">
        <div className="server-header">
          <span className="liquid-badge" />
          <span className="server-name">Private Vault</span>
        </div>

        <div className="channel-list">
          <div className="channel-item active">
            <span className="hash">#</span> general
          </div>
        </div>

        <div className="user-profile-bar">
          <div className="avatar">
            {userPfp ? <img src={userPfp} alt="avatar" /> : currentUser[0].toUpperCase()}
          </div>
          <div className="user-details">
            <span className="username">{currentUser}</span>
            <button onClick={() => setShowPfpModal(true)} className="btn-change-pfp">
              Change PFP
            </button>
          </div>
          <button onClick={() => setCurrentUser(null)} className="btn-logout" title="Log Out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      <main className="discord-chat-container">
        <header className="channel-bar">
          <span className="hash">#</span>
          <span className="channel-title">general</span>
        </header>

        <div className="messages-feed">
          {messages.map((msg) => (
            <div key={msg.id} className="message-row">
              <div className="avatar msg-avatar">
                {msg.avatarUrl ? <img src={msg.avatarUrl} alt="avatar" /> : msg.username[0].toUpperCase()}
              </div>
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

                    {msg.attachmentType === 'audio' && (
                      <audio src={msg.attachmentUrl} controls className="attached-audio" />
                    )}

                    {msg.attachmentType === 'file' && (
                      <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="file-attachment-link">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                          <polyline points="13 2 13 9 20 9" />
                        </svg>
                        <span>{msg.attachmentName || 'Download File'}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleDeleteMessage(msg.id)}
                className="btn-delete-msg"
                title="Delete message"
              >
                Delete
              </button>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="chat-input-wrapper">
          {isUploading && (
            <div className="upload-progress-container">
              <div className="upload-progress-header">
                <span>Uploading {selectedFile?.name}...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {!isUploading && selectedFile && (
            <div className="file-preview-strip">
              <span className="file-preview-name">Ready: {selectedFile.name}</span>
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
            <label htmlFor="file-upload" className="btn-attach" title="Attach file">
              +
            </label>

            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message #general..."
              className="chat-text-input"
              disabled={isUploading}
            />

            <button type="submit" disabled={isUploading || (!text.trim() && !selectedFile)} className="btn-send">
              {isUploading ? `${uploadProgress}%` : 'Send'}
            </button>
          </div>
        </form>
      </main>

      {showPfpModal && (
        <div className="modal-overlay">
          <div className="pfp-modal">
            <h3>Change Profile Picture</h3>
            <input
              type="text"
              placeholder="Paste image URL (e.g. https://i.imgur.com/...)"
              value={pfpInput}
              onChange={(e) => setPfpInput(e.target.value)}
              className="discord-input"
            />
            <div className="pfp-modal-actions">
              <button onClick={() => setShowPfpModal(false)} className="btn-modal-cancel">
                Cancel
              </button>
              <button onClick={saveProfilePicture} className="btn-modal-save">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
