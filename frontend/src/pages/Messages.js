import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { authUtils } from '../utils/authUtils';
import './style/Messages.css';
import './style/MessageAttachments.css';

function Messages() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        // Check if user is authenticated and is admin
        if (!authUtils.isAuthenticated()) {
          setError('Please log in to access this page.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (!authUtils.isAdmin()) {
          setError('Access denied. Admin privileges required.');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Get baseURL from environment or default
        const baseURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
        
        // Ensure axios is configured with baseURL and auth headers
        const token = localStorage.getItem('token');
        const response = await axios({
          method: 'get',
          url: '/api/admin/messages',
          baseURL,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        setMessages(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        
        if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
          setTimeout(() => navigate('/login'), 2000);
        } else if (err.response?.status === 403) {
          setError('Access denied. Admin privileges required.');
          setTimeout(() => navigate('/'), 3000);
        } else {
          setError(err.response?.data?.error || 'Failed to load messages');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [navigate]);

  const handleViewMessage = (message) => {
    setSelectedMessage(message);
  };

  const handleCloseMessage = () => {
    setSelectedMessage(null);
  };

  if (loading) {
    return (
      <div className="messages-container">
        <div className="messages-loading">
          Loading messages...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="messages-container">
        <div className="messages-error">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h1>Contact Messages</h1>
        <p>View and manage messages from the contact form</p>
      </div>

      <div className="messages-content">
        {messages.length === 0 ? (
          <p className="no-messages">No messages found.</p>
        ) : (
          <div className="messages-list">
            {messages.map((message) => (
              <div key={message._id} className="message-card">
                <div className="message-header">
                  <h3>{message.subject}</h3>
                  <span className="message-date">
                    {new Date(message.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="message-info">
                  <p><strong>From:</strong> {message.name} ({message.email})</p>
                  <p className="message-preview">
                    {message.message.substring(0, 100)}...
                  </p>
                </div>
                <button 
                  className="view-message-btn"
                  onClick={() => handleViewMessage(message)}
                >
                  View Full Message
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedMessage && (
          <div className="message-modal">
            <div className="message-modal-content">
              <div className="message-modal-header">
                <h2>{selectedMessage.subject}</h2>
                <button className="close-modal" onClick={handleCloseMessage}>×</button>
              </div>
              <div className="message-modal-body">
                <div className="message-details">
                  <p><strong>From:</strong> {selectedMessage.name}</p>
                  <p data-email={selectedMessage.email}><strong>Email:</strong> <span>{selectedMessage.email}</span></p>
                  <p><strong>Subject:</strong> {selectedMessage.subject}</p>
                  <p><strong>Date:</strong> {new Date(selectedMessage.createdAt).toLocaleString()}</p>
                </div>
                <div className="message-content">
                  <p>{selectedMessage.message}</p>
                </div>
                
                {/* Display attachment if present */}
                {selectedMessage.attachment && (
                  <div className="message-attachment">
                    <h4>Attachment</h4>
                    
                    <div className="attachment-file-info">
                      {/* File type specific icon */}
                      <div className={`attachment-icon ${
                        selectedMessage.attachment.mimetype.includes('image') ? 'attachment-icon-image' : 
                        selectedMessage.attachment.mimetype.includes('audio') ? 'attachment-icon-audio' :
                        selectedMessage.attachment.mimetype.includes('pdf') ? 'attachment-icon-pdf' :
                        'attachment-icon-default'
                      }`}>
                      </div>
                      
                      <div className="attachment-details">
                        <div className="attachment-filename">{selectedMessage.attachment.filename}</div>
                        <div className="attachment-size">{Math.round(selectedMessage.attachment.size / 1024)} KB</div>
                      </div>
                    </div>
                    
                    {/* Preview for images */}
                    {selectedMessage.attachment.mimetype.includes('image') && (
                      <div className="attachment-preview">
                        <img 
                          src={`data:${selectedMessage.attachment.mimetype};base64,${selectedMessage.attachment.buffer}`} 
                          alt="Attachment preview" 
                        />
                      </div>
                    )}
                    
                    {/* Preview for audio */}
                    {selectedMessage.attachment.mimetype.includes('audio') && (
                      <div className="attachment-preview">
                        <audio 
                          controls 
                          src={`data:${selectedMessage.attachment.mimetype};base64,${selectedMessage.attachment.buffer}`}
                        />
                      </div>
                    )}
                    
                    {/* Download link for all attachment types */}
                    <a 
                      href={`data:${selectedMessage.attachment.mimetype};base64,${selectedMessage.attachment.buffer}`}
                      download={selectedMessage.attachment.filename}
                      className="attachment-download"
                    >
                      Download Attachment
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;
