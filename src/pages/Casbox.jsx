import { useTranslation } from "../context/LanguageContext";
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useMail } from "../context/MailContext";
import { casboxAPI, api, userAPI, mailAPI } from "../services/api";
import { MdCheck, MdDoneAll, MdStarBorder, MdStar, MdDeleteOutline, MdRefresh, MdSend, MdClose, MdRemoveRedEye, MdFileDownload, MdReply, MdBlock, MdArrowBack, MdArchive, MdAccessTime, MdLabel, MdDelete, MdMoreVert, MdInsertEmoticon } from "react-icons/md";
import toast from "react-hot-toast";
import ReadingPaneLayout from "../components/ReadingPaneLayout";
import logo from "../assets/bnx-remove.png";

const getMimeType = (fileName) => {
  const ext = fileName?.split('.').pop().toLowerCase() || '';
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'webp': return 'image/webp';
    case 'svg': return 'image/svg+xml';
    case 'txt': return 'text/plain';
    case 'html': return 'text/html';
    default: return 'application/octet-stream';
  }
};

const getFileIcon = (fileName) => {
  const ext = fileName?.split('.').pop().toLowerCase() || '';
  switch (ext) {
    case 'pdf':
      return { icon: '📄', color: '#ea4335', name: 'PDF' };
    case 'doc':
    case 'docx':
      return { icon: '📝', color: '#1a73e8', name: 'Word' };
    case 'xls':
    case 'xlsx':
      return { icon: '📊', color: '#1e8e3e', name: 'Excel' };
    case 'ppt':
    case 'pptx':
      return { icon: '📈', color: '#f86734', name: 'PowerPoint' };
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'svg':
      return { icon: '🖼️', color: '#12a4b4', name: 'Image' };
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return { icon: '📦', color: '#e37400', name: 'Archive' };
    case 'mp3':
    case 'wav':
    case 'ogg':
      return { icon: '🎵', color: '#aa00ff', name: 'Audio' };
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'mkv':
      return { icon: '🎥', color: '#d500f9', name: 'Video' };
    default:
      return { icon: '📎', color: '#5f6368', name: 'File' };
  }
};

const POPULAR_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
  "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "✊", "👊", "🤛", "🤜", "👏", "🙌",
  "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "👀",
  "❤️", "🩷", "🧡", "💛", "💚", "💙", "🩵", "💜", "🖤", "🩶", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗",
  "🎉", "✨", "🔥", "💡", "🌟", "🎈", "🎁", "💬", "✉️", "📅", "💻", "📱", "⌚", "📷", "🎨", "🎵", "✈️", "🚗", "🏠", "💼"
];

const Casbox = () => {
  const { t } = useTranslation();
  const { theme, readingPaneMode } = useTheme();
  const location = useLocation();
  const { user } = useAuth();
  const { stompClient, isConnected } = useSocket();
  const { openCompose, emails, handleArchive, handleSnooze, handleMoveToTrash, handleToggleStar } = useMail();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedMessage, setSelectedMessage] = useState(null);

  const [activeTab, setActiveTab] = useState('received');
  const [previewFile, setPreviewFile] = useState(null);

  const [acceptedContacts, setAcceptedContacts] = useState([]);
  const [blockedContacts, setBlockedContacts] = useState([]);
  const [knownContacts, setKnownContacts] = useState(new Set());
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  const [threadMessages, setThreadMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [newChatText, setNewChatText] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [isChatStarred, setIsChatStarred] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = React.useRef(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = React.useRef(null);

  const handleEmojiSelect = (emoji) => {
    setNewChatText(prev => prev + emoji);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showEmojiPicker]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showMoreMenu]);

  const chatEndRef = React.useRef(null);
  const selectedContactRef = React.useRef(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await userAPI.getSettings();
        if (res.data?.success) {
          const s = res.data.data;
          setAcceptedContacts(s.casboxAccepted || []);
          setBlockedContacts(s.casboxBlocked || []);
        }
      } catch (e) {
        console.error("Failed to load casbox settings", e);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (location.state?.preselectContact && messages.length > 0) {
      const contactEmail = location.state.preselectContact;
      const matchingMsg = messages.find(m => m.senderEmail === contactEmail || m.receiverEmail === contactEmail);
      if (matchingMsg) {
        handleSelectMessage(matchingMsg);
      } else {
        // Create a dummy message structure to open the thread
        handleSelectMessage({
          senderEmail: user?.email,
          receiverEmail: contactEmail,
          subject: "Casbox Message",
          body: "",
          id: -1
        });
      }
      // Clear location state after processing
      window.history.replaceState({}, document.title);
    }
  }, [location.state, messages, user?.email]);

  useEffect(() => {
    const contacts = new Set();

    // Auto-accept contacts from regular emails
    if (emails && emails.length > 0) {
      emails.forEach(email => {
        if (email.senderEmail) contacts.add(email.senderEmail);
        if (email.receiverEmail) contacts.add(email.receiverEmail);
        if (email.to && Array.isArray(email.to)) {
          email.to.forEach(t => contacts.add(t));
        }
      });
    }

    // Auto-accept people we have sent a Casbox message to
    if (messages && messages.length > 0 && user?.email) {
      messages.forEach(msg => {
        if (msg.senderEmail === user.email && msg.receiverEmail) {
          contacts.add(msg.receiverEmail);
        }
      });
    }

    setKnownContacts(contacts);
  }, [emails, messages, user?.email]);

  React.useEffect(() => {
    return () => {
      setPreviewFile((prev) => {
        if (prev) URL.revokeObjectURL(prev.blobUrl);
        return null;
      });
    };
  }, [selectedMessage]);

  const fetchThread = async (contactEmail) => {
    try {
      setLoadingThread(true);
      const res = await casboxAPI.getThread(contactEmail);
      setThreadMessages(res.data || []);
    } catch (e) {
      console.error("Failed to fetch thread", e);
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    if (selectedMessage) {
      const otherEmail = selectedMessage.senderEmail === user?.email
        ? selectedMessage.receiverEmail
        : selectedMessage.senderEmail;
      selectedContactRef.current = otherEmail;
      fetchThread(otherEmail);
      setIsChatStarred(Boolean(selectedMessage.starred || selectedMessage.isStarred));
    } else {
      selectedContactRef.current = null;
      setThreadMessages([]);
      setIsChatStarred(false);
    }
  }, [selectedMessage, user?.email]);

  const handleArchiveChat = async () => {
    if (!selectedMessage) return;
    const targetId = selectedMessage.uid || selectedMessage.id;
    const otherEmail = selectedMessage.senderEmail === user?.email
      ? selectedMessage.receiverEmail
      : selectedMessage.senderEmail;

    try {
      if (mailAPI.archive) {
        await mailAPI.archive(targetId, 'casbox');
      } else if (handleArchive) {
        await handleArchive(targetId, 'casbox', true);
      }
      toast.success("Chat archived");
      setMessages(prev => prev.filter(m => (m.senderEmail === user?.email ? m.receiverEmail : m.senderEmail) !== otherEmail));
      setSelectedMessage(null);
      fetchMessages(true);
    } catch (err) {
      console.error("Failed to archive chat", err);
      toast.error("Failed to archive chat");
    }
  };

  const handleSnoozeChat = async (wakeUpDate) => {
    if (!selectedMessage) return;
    const targetId = selectedMessage.uid || selectedMessage.id;
    const otherEmail = selectedMessage.senderEmail === user?.email
      ? selectedMessage.receiverEmail
      : selectedMessage.senderEmail;

    const wakeUpAt = wakeUpDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    try {
      if (mailAPI.snooze) {
        await mailAPI.snooze(targetId, wakeUpAt, 'casbox');
      } else if (handleSnooze) {
        await handleSnooze(targetId, wakeUpAt, 'casbox', true);
      }
      toast.success("Chat snoozed");
      setMessages(prev => prev.filter(m => (m.senderEmail === user?.email ? m.receiverEmail : m.senderEmail) !== otherEmail));
      setSelectedMessage(null);
      fetchMessages(true);
    } catch (err) {
      console.error("Failed to snooze chat", err);
      toast.error("Failed to snooze chat");
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedMessage) return;
    const targetId = selectedMessage.uid || selectedMessage.id;
    const otherEmail = selectedMessage.senderEmail === user?.email
      ? selectedMessage.receiverEmail
      : selectedMessage.senderEmail;

    try {
      if (mailAPI.trash) {
        await mailAPI.trash(targetId, 'casbox');
      } else if (handleMoveToTrash) {
        await handleMoveToTrash(targetId, 'casbox', true);
      }
      toast.success("Chat deleted");
      setMessages(prev => prev.filter(m => (m.senderEmail === user?.email ? m.receiverEmail : m.senderEmail) !== otherEmail));
      setSelectedMessage(null);
      fetchMessages(true);
    } catch (err) {
      console.error("Failed to delete chat", err);
      toast.error("Failed to delete chat");
    }
  };

  const handleToggleStarChat = async () => {
    if (!selectedMessage) return;
    const targetId = selectedMessage.uid || selectedMessage.id;
    const newStarred = !isChatStarred;

    try {
      if (mailAPI.toggleStar) {
        await mailAPI.toggleStar(targetId, 'casbox');
      } else if (handleToggleStar) {
        await handleToggleStar(targetId, 'casbox');
      }
      setIsChatStarred(newStarred);
      setSelectedMessage(prev => prev ? { ...prev, starred: newStarred, isStarred: newStarred } : null);
      setMessages(prev => prev.map(m => (m.id === targetId || m.uid === targetId) ? { ...m, starred: newStarred, isStarred: newStarred } : m));
    } catch (err) {
      console.error("Failed to toggle star chat", err);
      toast.error("Failed to update star");
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      const container = chatEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [threadMessages]);

  useEffect(() => {
    const activeContact = selectedContactRef.current;
    if (!activeContact || !user?.email || threadMessages.length === 0) return;

    const unreadMsgs = threadMessages.filter(m => 
      m.receiverEmail === user.email && 
      m.status !== 'SEEN'
    );

    if (unreadMsgs.length > 0) {
      const ids = unreadMsgs.map(m => m.id);
      casboxAPI.updateStatus({ messageIds: ids, status: 'SEEN' })
        .then(() => {
          setMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, status: 'SEEN' } : m));
          setThreadMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, status: 'SEEN' } : m));
        })
        .catch(console.error);
    }
  }, [threadMessages, user?.email]);


  const closePreview = () => {
    setPreviewFile((prev) => {
      if (prev) URL.revokeObjectURL(prev.blobUrl);
      return null;
    });
  };

  const handleDownloadAttachment = async (fileObj) => {
    try {
      const fileName = fileObj.fileName || fileObj.name || (typeof fileObj === 'string' ? fileObj.split('/').pop() : "Attachment");
      const urlPath = fileObj.url || fileObj.filePath || (typeof fileObj === 'string' ? fileObj : "");
      if (!urlPath) return;

      toast.loading(`Downloading ${fileName}...`, { id: "download-casbox-attachment" });
      const res = await api.get(urlPath, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${fileName} downloaded successfully`, { id: "download-casbox-attachment" });
    } catch (err) {
      console.error("Failed to download attachment:", err);
      toast.error("Failed to download attachment", { id: "download-casbox-attachment" });
    }
  };

  const handlePreviewAttachment = async (fileObj) => {
    try {
      const fileName = fileObj.fileName || fileObj.name || (typeof fileObj === 'string' ? fileObj.split('/').pop() : "Attachment");
      const urlPath = fileObj.url || fileObj.filePath || (typeof fileObj === 'string' ? fileObj : "");
      if (!urlPath) return;

      toast.loading(`Loading preview...`, { id: "preview-casbox-attachment" });
      const res = await api.get(urlPath, { responseType: 'blob' });
      const mime = getMimeType(fileName);

      let textContent = "";
      if (mime === "text/plain") {
        const reader = new FileReader();
        textContent = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsText(new Blob([res.data]));
        });
      }

      const url = window.URL.createObjectURL(new Blob([res.data], { type: mime }));
      setPreviewFile({
        fileName,
        blobUrl: url,
        mimeType: mime,
        textContent,
        rawFileObj: fileObj
      });
      toast.success("Loaded preview", { id: "preview-casbox-attachment" });
    } catch (err) {
      console.error("Failed to preview attachment:", err);
      toast.error("Failed to preview attachment", { id: "preview-casbox-attachment" });
    }
  };

  useEffect(() => {
    fetchMessages();

    // Background auto-polling for new casbox messages every 10 seconds
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchMessages(true);
      }
    }, 10000);

    const handleCasboxMessageSent = (e) => {
      fetchMessages(true);
    };
    window.addEventListener('casbox_message_sent', handleCasboxMessageSent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('casbox_message_sent', handleCasboxMessageSent);
    };
  }, []);

  useEffect(() => {
    if (!stompClient || !isConnected || !stompClient.connected) return;

    let messageSub = null;
    let statusSub = null;

    try {
      messageSub = stompClient.subscribe('/user/queue/casbox/messages', (msg) => {
        const newMsg = JSON.parse(msg.body);
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [newMsg, ...prev];
        });

        // Append to threadMessages if it's the active contact
        const activeContact = selectedContactRef.current;
        if (activeContact && (newMsg.senderEmail === activeContact || newMsg.receiverEmail === activeContact)) {
          setThreadMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      });

      statusSub = stompClient.subscribe('/user/queue/casbox/status', (msg) => {
        const updatedMsg = JSON.parse(msg.body);
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
        setThreadMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
      });

      casboxAPI.markAsDelivered().catch(console.error);
    } catch (e) {
      console.error("Failed to subscribe to Casbox queue:", e);
    }

    return () => {
      if (messageSub) messageSub.unsubscribe();
      if (statusSub) statusSub.unsubscribe();
    };
  }, [stompClient, isConnected]);

  const fetchMessages = async (background = false) => {
    try {
      if (!background) setLoading(true);
      const res = await casboxAPI.getAllMessages();
      setMessages(res.data || []);
      if (selectedContactRef.current) {
        const contactEmail = selectedContactRef.current;
        casboxAPI.getThread(contactEmail).then(r => setThreadMessages(r.data || [])).catch(console.error);
      }
    } catch (err) {
      if (!background) toast.error("Failed to fetch messages");
    } finally {
      if (!background) setLoading(false);
    }
  };

  const handleSelectMessage = async (msg) => {
    setSelectedMessage(msg);
    const otherEmail = msg.senderEmail === user?.email ? msg.receiverEmail : msg.senderEmail;
    const unreadMsgs = messages.filter(m => 
      (m.senderEmail === otherEmail || m.receiverEmail === otherEmail) && 
      m.receiverEmail === user?.email && 
      m.status !== 'SEEN'
    );

    if (unreadMsgs.length > 0) {
      try {
        const ids = unreadMsgs.map(m => m.id);
        await casboxAPI.updateStatus({ messageIds: ids, status: 'SEEN' });
        setMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, status: 'SEEN' } : m));
        if (ids.includes(msg.id)) {
          setSelectedMessage({ ...msg, status: 'SEEN' });
        }
      } catch (e) {
        console.error("Failed to mark messages as seen", e);
      }
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return null;
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "sent") return <MdCheck size={16} className="text-gray-400" title="Sent" />;
    if (lowerStatus === "delivered") return <MdDoneAll size={16} className="text-gray-400" title="Delivered" />;
    if (lowerStatus === "seen") return <MdDoneAll size={16} className="text-blue-500" title="Seen" />;
    return null;
  };

  const parseTimestamp = (ts) => {
    if (!ts) return new Date();
    if (Array.isArray(ts)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = ts;
      return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    }
    if (typeof ts === 'string') {
      const str = ts.endsWith('Z') || ts.includes('+') ? ts : ts + 'Z';
      return new Date(str);
    }
    return new Date(ts);
  };

  const unblockedMessages = messages.filter(msg => {
    return !blockedContacts.includes(msg.senderEmail);
  });

  const sentMessages = unblockedMessages.filter(msg => msg.senderEmail === user?.email);
  const allReceived = unblockedMessages.filter(msg => msg.receiverEmail === user?.email);

  const receivedMessages = allReceived.filter(msg =>
    knownContacts.has(msg.senderEmail) || acceptedContacts.includes(msg.senderEmail)
  );
  const requestMessages = allReceived.filter(msg =>
    !knownContacts.has(msg.senderEmail) && !acceptedContacts.includes(msg.senderEmail)
  );

  const filteredMessages = activeTab === 'received' ? receivedMessages
    : activeTab === 'sent' ? sentMessages
      : requestMessages;

  // Group messages by conversation contact
  const conversationGroups = {};
  filteredMessages.forEach(msg => {
    const contact = msg.senderEmail === user?.email ? msg.receiverEmail : msg.senderEmail;
    if (!contact) return;
    if (!conversationGroups[contact]) {
      conversationGroups[contact] = [];
    }
    conversationGroups[contact].push(msg);
  });

  const conversationList = Object.keys(conversationGroups).map(contact => {
    const msgs = conversationGroups[contact];
    const sorted = [...msgs].sort((a, b) => parseTimestamp(b.timestamp) - parseTimestamp(a.timestamp));
    return {
      contact,
      latestMessage: sorted[0],
      messages: sorted
    };
  }).sort((a, b) => parseTimestamp(b.latestMessage.timestamp) - parseTimestamp(a.latestMessage.timestamp));

  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newChatText.trim()) return;

    try {
      setSendingChat(true);
      const otherEmail = selectedMessage.senderEmail === user?.email
        ? selectedMessage.receiverEmail
        : selectedMessage.senderEmail;

      const payload = {
        receiverEmail: otherEmail,
        subject: selectedMessage.subject || "Casbox Message",
        body: newChatText.trim(),
        attachmentsJson: null
      };

      const res = await casboxAPI.sendMessage(payload);

      setNewChatText("");

      const newMsg = res.data;
      setThreadMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [newMsg, ...prev];
      });

    } catch (err) {
      console.error("Failed to send Casbox message", err);
      toast.error("Failed to send message");
    } finally {
      setSendingChat(false);
    }
  };

  const headerComponent = (
    <div className="flex flex-col shrink-0">
      <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 shrink-0 bg-transparent">
        <div className="flex items-center bg-gray-100/80 dark:bg-gray-800/80 p-1 rounded-lg shrink-0">
          <button
            onClick={() => { setActiveTab('received'); setSelectedMessage(null); }}
            className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${activeTab === 'received' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            {t('casbox.received', 'Received')} <span className={`font-normal hidden sm:inline ${activeTab === 'received' ? 'opacity-80' : 'opacity-60'}`}>({receivedMessages.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('sent'); setSelectedMessage(null); }}
            className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${activeTab === 'sent' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            {t('sidebar.sent', 'Sent')} <span className={`font-normal hidden sm:inline ${activeTab === 'sent' ? 'opacity-80' : 'opacity-60'}`}>({sentMessages.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('requests'); setSelectedMessage(null); }}
            className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${activeTab === 'requests' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            {t('casbox.requests', 'Requests')} {requestMessages.length > 0 && <span className="flex h-2 w-2 rounded-full bg-red-500"></span>}
          </button>
        </div>

        <div className="flex-1"></div>

        <button
          onClick={() => openCompose({ mode: 'casbox' })}
          className="px-4 py-1.5 rounded-full text-sm font-bold text-white transition-transform hover:shadow-md active:scale-95"
          style={{ backgroundColor: theme.accent || "#135bec" }}
        >
          {t('navbar.compose', 'Compose')}
        </button>
        <button
          onClick={() => setShowBlockedModal(true)}
          className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 ml-1"
          title={t('casbox.blocked_users', 'Blocked Users')}
        >
          <MdBlock size={18} />
        </button>
        <button
          onClick={fetchMessages}
          className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          title={t('common.refresh', 'Refresh')}
        >
          <MdRefresh size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  );

  const listComponent = (
    <div className="flex-1 overflow-y-auto hidden-scrollbar relative bg-transparent">
      {conversationList.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 opacity-80 pb-20">
          <MdSend className="text-4xl mb-3 opacity-30" />
          <p className="text-sm font-medium">{t('casbox.no_chats', 'No chats yet')}</p>
        </div>
      )}
      {conversationList.map((chat) => {
        const msg = chat.latestMessage;
        const isMe = msg.senderEmail === user?.email;
        const otherEmail = chat.contact;
        const isSelected = selectedMessage && (
          (selectedMessage.senderEmail === user?.email ? selectedMessage.receiverEmail : selectedMessage.senderEmail) === otherEmail
        );

        const unreadCount = chat.messages.filter(m => m.receiverEmail === user?.email && m.status !== 'SEEN').length;

        return (
          <div
            key={otherEmail}
            onClick={() => handleSelectMessage(msg)}
            className={`group flex items-center px-4 sm:px-6 py-3.5 border-b border-gray-100 dark:border-gray-800/50 hover:shadow-sm transition-all cursor-pointer relative bg-white dark:bg-[#121212] ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30'} ${unreadCount > 0 ? 'font-bold' : ''}`}
          >
            {isSelected && (
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r bg-blue-500"></div>
            )}

            <div className="shrink-0 mr-3.5">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                {otherEmail.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className={`text-sm truncate ${unreadCount > 0 ? 'font-extrabold text-gray-900 dark:text-white' : 'font-semibold text-gray-800 dark:text-gray-200'}`}>
                  {otherEmail.split('@')[0]}
                </span>
                <span className={`text-xs ${unreadCount > 0 ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-400 dark:text-gray-500'}`}>
                  {parseTimestamp(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px] font-normal">
                  {isMe ? "You: " : ""}{msg.body}
                </span>

                {unreadCount > 0 ? (
                  <span className="bg-blue-500 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full shrink-0">
                    {unreadCount}
                  </span>
                ) : isMe ? (
                  <span className="shrink-0">
                    {getStatusIcon(msg.status)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const handleAcceptRequest = async (senderEmail) => {
    try {
      const newAccepted = [...acceptedContacts, senderEmail];
      setAcceptedContacts(newAccepted);
      await userAPI.updateSettings({ casboxAccepted: newAccepted });
      toast.success("Request accepted");
      setActiveTab("received");
    } catch (e) {
      toast.error("Failed to accept request");
      setAcceptedContacts(acceptedContacts);
    }
  };

  const handleBlockRequest = async (senderEmail) => {
    try {
      const newBlocked = [...blockedContacts, senderEmail];
      setBlockedContacts(newBlocked);
      await userAPI.updateSettings({ casboxBlocked: newBlocked });
      toast.success("User blocked");
      setSelectedMessage(null);
    } catch (e) {
      toast.error("Failed to block user");
      setBlockedContacts(blockedContacts);
    }
  };

  const handleUnblockUser = async (senderEmail) => {
    try {
      const newBlocked = blockedContacts.filter(email => email !== senderEmail);
      setBlockedContacts(newBlocked);
      await userAPI.updateSettings({ casboxBlocked: newBlocked });
      toast.success("User unblocked");
    } catch (e) {
      toast.error("Failed to unblock user");
      setBlockedContacts(blockedContacts);
    }
  };

  const renderBubbleAttachments = (msg) => {
    if (!msg.attachmentsJson) return null;
    try {
      const files = JSON.parse(msg.attachmentsJson);
      if (!files || files.length === 0) return null;
      return (
        <div className="mt-2 space-y-1.5 border-t border-black/5 dark:border-white/5 pt-2">
          {files.map((fileObj, i) => {
            const fileName = fileObj.fileName || fileObj.name || (typeof fileObj === 'string' ? fileObj.split('/').pop() : "Attachment");
            const fileInfo = getFileIcon(fileName);
            return (
              <div
                key={i}
                className="flex items-center justify-between gap-3 p-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-[11px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{fileInfo.icon}</span>
                  <span className="font-medium truncate max-w-[120px]">{fileName}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownloadAttachment(fileObj); }}
                  className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-current cursor-pointer shrink-0"
                >
                  <MdFileDownload size={14} />
                </button>
              </div>
            );
          })}
        </div>
      );
    } catch (e) {
      return null;
    }
  };

  const getOtherUserEmail = (msg) => {
    if (!msg) return "";
    return msg.senderEmail === user?.email ? msg.receiverEmail : msg.senderEmail;
  };

  const detailsComponent = selectedMessage ? (() => {
    const otherUserEmail = getOtherUserEmail(selectedMessage);
    const isContactRequest = !knownContacts.has(otherUserEmail) && !acceptedContacts.includes(otherUserEmail);
    const sortedThread = [...threadMessages].sort((a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp));

    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#121212] border-l border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Action Toolbar */}
        <div
          className="flex items-center justify-between px-4 sm:px-6 py-2 border-b shrink-0 relative z-20 bg-white dark:bg-[#121212]"
          style={{ borderColor: theme?.border || '#e2e8f0' }}
        >
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setSelectedMessage(null)}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
              title="Back"
            >
              <MdArrowBack size={20} />
            </button>
            <div className="h-5 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1" />
            <button
              onClick={handleArchiveChat}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 cursor-pointer"
              title="Archive"
            >
              <MdArchive size={20} />
            </button>
            <button
              onClick={() => handleSnoozeChat()}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400 hover:text-blue-500 cursor-pointer"
              title="Snooze"
            >
              <MdAccessTime size={20} />
            </button>
            <button
              onClick={handleDeleteChat}
              className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-gray-500 dark:text-gray-400 hover:text-red-500 cursor-pointer"
              title="Delete"
            >
              <MdDelete size={20} />
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu(prev => !prev)}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                title="More"
              >
                <MdMoreVert size={20} />
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <button
                    onClick={() => {
                      handleToggleStarChat();
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
                  >
                    {isChatStarred ? "Unstar Conversation" : "Star Conversation"}
                  </button>
                  <button
                    onClick={() => {
                      handleBlockRequest(otherUserEmail);
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2"
                  >
                    Block Contact
                  </button>
                  <button
                    onClick={() => {
                      setShowBlockedModal(true);
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
                  >
                    View Blocked Users
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleToggleStarChat}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title={isChatStarred ? "Starred" : "Star"}
              style={{ color: isChatStarred ? "#e3b341" : "rgb(107,114,128)" }}
            >
              {isChatStarred ? <MdStar size={20} /> : <MdStarBorder size={20} />}
            </button>
          </div>
        </div>

        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-[#121212] shrink-0 relative z-10"
          style={{ borderColor: theme?.border || '#e2e8f0' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedMessage(null)}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              title="Close"
            >
              <MdClose size={22} className="hidden md:block" />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base">
              {otherUserEmail.charAt(0).toUpperCase()}
            </div>

            <div className="flex flex-col">
              <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{otherUserEmail.split('@')[0]}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{otherUserEmail}</span>
            </div>
          </div>
        </div>

        {/* Message Thread Panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col hidden-scrollbar">
          {loadingThread && threadMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
              Loading chat history...
            </div>
          ) : sortedThread.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60">
              <MdSend className="text-3xl text-gray-300 dark:text-gray-600 mb-2" />
              <span className="text-xs font-semibold">No messages in this chat yet</span>
            </div>
          ) : (
            sortedThread.map((msg, index) => {
              const isMe = msg.senderEmail === user?.email;
              const senderEmail = msg.senderEmail || "";
              const senderLabel = senderEmail ? senderEmail.split("@")[0] : "";

              return (
                <div key={msg.id || index} className="flex items-start gap-4 sm:gap-6 w-full py-1">
                  {/* Left Column: Contact Card */}
                  <div className="w-20 sm:w-36 md:w-40 shrink-0 pt-0 select-none text-left">
                    <div 
                      className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-xl border relative shadow-sm w-full bg-gray-50/50 dark:bg-[#1e1e1e]/40"
                      style={{
                        borderColor: theme?.border || '#e2e8f0',
                        borderLeftWidth: '4px',
                        borderLeftColor: isMe ? (theme?.accent || '#135bec') : (theme?.mode === 'dark' ? '#4b5563' : '#d1d5db'),
                      }}
                    >
                      {/* Avatar Container */}
                      <div className="relative shrink-0">
                        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs ${
                          isMe 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                            : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        }`}>
                          {senderLabel.charAt(0).toUpperCase()}
                        </div>
                        {/* Green online dot */}
                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-[#121212]" />
                      </div>

                      {/* Details */}
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[10px] sm:text-xs text-gray-800 dark:text-gray-200 truncate">
                          {senderLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Chat Message */}
                  <div className="flex-1 flex flex-col items-start min-w-0">
                    {/* Bubble */}
                    <div className="max-w-[85%] flex flex-col items-start">
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm flex flex-col gap-1 ${isMe ? 'rounded-tr-none text-white shadow-sm font-medium' : 'rounded-tl-none border shadow-sm font-medium'}`}
                        style={{
                          backgroundColor: isMe ? (theme?.accent || '#135bec') : (theme?.mode === 'dark' ? '#1e1e1e' : '#f3f4f6'),
                          color: isMe ? '#ffffff' : (theme?.mode === 'dark' ? '#f3f4f6' : '#1f2937'),
                          borderColor: isMe ? 'transparent' : (theme?.border || '#e2e8f0')
                        }}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed break-words">{msg.body}</p>
                        {renderBubbleAttachments(msg)}
                      </div>

                      {/* Timestamp outside and below the bubble */}
                      <div 
                        className="text-[9px] mt-1 select-none font-normal text-gray-400 dark:text-gray-500 self-end mr-1 text-right"
                      >
                        {parseTimestamp(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>

                      {isMe && index === sortedThread.length - 1 && (
                        <div className="mt-1 mr-1">
                          {getStatusIcon(msg.status)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Footer Accept Request or Message Input */}
        <div
          className="p-4 border-t bg-white dark:bg-[#121212] shrink-0"
          style={{ borderColor: theme?.border || '#e2e8f0' }}
        >
          {isContactRequest && selectedMessage.receiverEmail === user?.email ? (
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => handleAcceptRequest(otherUserEmail)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-white font-semibold shadow-sm hover:shadow hover:-translate-y-0.5 transition-all text-sm cursor-pointer border-0"
                style={{ background: theme?.accent || "#135bec" }}
              >
                <MdCheck size={18} /> Accept
              </button>
              <button
                onClick={() => handleBlockRequest(otherUserEmail)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-semibold shadow-sm hover:shadow transition-all text-sm cursor-pointer text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 border border-red-100 dark:border-red-950/30"
              >
                <MdClose size={18} /> Block
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSendChatMessage}
              className="flex items-center gap-3 bg-transparent w-full relative"
            >
              <div className="relative shrink-0 flex items-center" ref={emojiPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer flex items-center justify-center shrink-0"
                  title="Insert Emoji"
                >
                  <MdInsertEmoticon size={20} />
                </button>
                {showEmojiPicker && (
                  <div
                    className="absolute bottom-14 left-0 z-50 bg-white dark:bg-gray-800 border shadow-2xl rounded-2xl p-3 w-72 max-w-sm"
                    style={{ borderColor: theme?.border || 'rgba(0,0,0,0.1)' }}
                  >
                    <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1 select-none">
                      Popular Emojis
                    </div>
                    <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto hidden-scrollbar">
                      {POPULAR_EMOJIS.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleEmojiSelect(emoji)}
                          className="w-7 h-7 flex items-center justify-center text-lg rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer select-none border-0 bg-transparent"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <input
                type="text"
                placeholder="Type a message..."
                value={newChatText}
                onChange={(e) => setNewChatText(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-full text-sm border focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent"
                style={{ borderColor: theme?.border || '#e2e8f0', color: theme?.text || '#000' }}
                disabled={sendingChat}
              />
              <button
                type="submit"
                disabled={sendingChat || !newChatText.trim()}
                className="p-2.5 rounded-full text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm shrink-0 border-0"
                style={{ backgroundColor: theme?.accent || "#135bec" }}
              >
                <MdSend size={18} />
              </button>
            </form>
          )}
        </div>
      </div>
    );
  })() : (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 bg-gray-50/30 dark:bg-[#1e1e1e]/30 border-l border-gray-100 dark:border-gray-800">
      <MdSend className="text-6xl mb-4 opacity-50" />
      <p className="text-base font-medium">Select a message to read</p>
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-full w-full bg-white dark:bg-[#121212] relative overflow-hidden">
        <ReadingPaneLayout
          mode={readingPaneMode || 'no_split'}
          hasSelection={!!selectedMessage}
          headerComponent={headerComponent}
          listComponent={listComponent}
          detailsComponent={detailsComponent}
        />

        {previewFile && (
          <div className="fixed inset-0 bg-black/90 z-[1000] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 bg-black/30 border-b border-white/5 text-white select-none">
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate max-w-[60vw]">
                  {previewFile.fileName}
                </span>
                <span className="text-[10px] opacity-60">
                  {previewFile.mimeType}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownloadAttachment(previewFile.rawFileObj)}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                  title="Download file"
                >
                  <MdFileDownload size={20} />
                </button>
                <button
                  onClick={closePreview}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                  title="Close preview"
                >
                  <MdClose size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
              {previewFile.mimeType.startsWith("image/") ? (
                <img
                  src={previewFile.blobUrl}
                  alt={previewFile.fileName}
                  className="max-w-full max-h-[82vh] object-contain rounded shadow-2xl select-none"
                />
              ) : previewFile.mimeType === "application/pdf" ? (
                <object
                  data={previewFile.blobUrl}
                  type="application/pdf"
                  className="w-[90vw] h-[80vh] rounded-lg shadow-2xl bg-white border-none"
                >
                  <embed
                    src={previewFile.blobUrl}
                    type="application/pdf"
                    className="w-full h-full border-none rounded-lg"
                  />
                </object>
              ) : previewFile.mimeType === "text/plain" ? (
                <pre className="bg-zinc-950 text-zinc-100 p-6 rounded-xl shadow-2xl overflow-auto max-w-[90vw] max-h-[80vh] text-left font-mono text-xs sm:text-sm leading-relaxed border border-zinc-800 hidden-scrollbar">
                  {previewFile.textContent}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center bg-zinc-900/60 text-white p-8 rounded-2xl border border-zinc-800 max-w-sm text-center shadow-xl">
                  <span className="text-5xl mb-4 select-none">📎</span>
                  <p className="font-semibold text-sm mb-1 truncate max-w-[280px]">{previewFile.fileName}</p>
                  <p className="text-[11px] text-gray-400 mb-6">No inline preview available for this file type</p>
                  <button
                    onClick={() => handleDownloadAttachment(previewFile.rawFileObj)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <MdFileDownload size={15} /> Download Attachment
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showBlockedModal && (
          <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center animate-fade-in p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden max-h-[80vh]">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <MdBlock className="text-red-500" size={20} /> Blocked Users
                </h3>
                <button
                  onClick={() => setShowBlockedModal(false)}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 transition-colors"
                >
                  <MdClose size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {blockedContacts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <MdCheck className="mx-auto text-4xl mb-3 opacity-30 text-green-500" />
                    <p>No blocked users</p>
                  </div>
                ) : (
                  blockedContacts.map((email) => (
                    <div key={email} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors mx-2 my-1">
                      <span className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate pr-4">{email}</span>
                      <button
                        onClick={() => handleUnblockUser(email)}
                        className="px-4 py-1.5 rounded-full text-xs font-bold border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-all shrink-0"
                      >
                        Unblock
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Casbox;
