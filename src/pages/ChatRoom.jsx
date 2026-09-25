import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  MdArrowBack,
  MdSend,
  MdMoreVert,
  MdAttachFile,
  MdInfoOutline,
  MdChat,
  MdEmail,
  MdPeople,
  MdPersonAdd,
  MdAssignment,
  MdClose,
  MdCheck,
  MdKeyboardArrowRight,
  MdKeyboardArrowLeft,
  MdImage,
  MdEdit,
  MdPictureAsPdf,
  MdVisibility,
  MdFileDownload,
  MdArchive,
  MdAccessTime,
  MdLabel,
  MdDelete,
  MdPrint,
  MdStarBorder,
  MdStar,
  MdInsertEmoticon
} from "react-icons/md";
import { chatAPI, mailAPI, templateAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";
import { DEFAULT_TEMPLATES } from "./Templates";


const POPULAR_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
  "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "✊", "👊", "🤛", "🤜", "👏", "🙌",
  "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "👀",
  "❤️", "🩷", "🧡", "💛", "💚", "💙", "🩵", "💜", "🖤", "🩶", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗",
  "🎉", "✨", "🔥", "💡", "🌟", "🎈", "🎁", "💬", "✉️", "📅", "💻", "📱", "⌚", "📷", "🎨", "🎵", "✈️", "🚗", "🏠", "💼"
];

const ChatRoom = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { isConnected, subscribeToChat, sendMessage } = useSocket();

  const [chat, setChat] = useState(location.state?.chat || null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isChatStarred, setIsChatStarred] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef(null);
  const [hasNewMessagesBelow, setHasNewMessagesBelow] = useState(false);

  useEffect(() => {
    if (chat) {
      setIsChatStarred(Boolean(chat.starred || chat.isStarred));
    } else {
      setIsChatStarred(false);
    }
  }, [chat, chatId]);

  const handleArchiveChat = async () => {
    const targetId = chatId || chat?.uid || chat?.id;
    if (!targetId) return;

    try {
      if (mailAPI.archive) {
        await mailAPI.archive(targetId, 'chat');
      }
      toast.success("Chat archived");
      if (chat?.type === 'DIRECT') {
        navigate("/chat");
      } else {
        navigate("/colab");
      }
    } catch (err) {
      console.error("Failed to archive chat", err);
      toast.error("Failed to archive chat");
    }
  };

  const handleSnoozeChat = async (wakeUpDate) => {
    const targetId = chatId || chat?.uid || chat?.id;
    if (!targetId) return;
    const wakeUpAt = wakeUpDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    try {
      if (mailAPI.snooze) {
        await mailAPI.snooze(targetId, wakeUpAt, 'chat');
      }
      toast.success("Chat snoozed");
      if (chat?.type === 'DIRECT') {
        navigate("/chat");
      } else {
        navigate("/colab");
      }
    } catch (err) {
      console.error("Failed to snooze chat", err);
      toast.error("Failed to snooze chat");
    }
  };

  const handleDeleteChat = async () => {
    const targetId = chatId || chat?.uid || chat?.id;
    if (!targetId) return;

    try {
      if (mailAPI.trash) {
        await mailAPI.trash(targetId, 'chat');
      }
      toast.success("Chat deleted");
      if (chat?.type === 'DIRECT') {
        navigate("/chat");
      } else {
        navigate("/colab");
      }
    } catch (err) {
      console.error("Failed to delete chat", err);
      toast.error("Failed to delete chat");
    }
  };

  const handleToggleStarChat = async () => {
    const targetId = chatId || chat?.uid || chat?.id;
    if (!targetId) return;
    const newStarred = !isChatStarred;

    try {
      if (mailAPI.toggleStar) {
        await mailAPI.toggleStar(targetId, 'chat');
      }
      setIsChatStarred(newStarred);
      setChat(prev => prev ? { ...prev, starred: newStarred, isStarred: newStarred } : null);
    } catch (err) {
      console.error("Failed to toggle star chat", err);
      toast.error("Failed to update star");
    }
  };

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
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

  // Layout States (Info Modal, Compose Modal, Collapsed Chat)
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [isChatPaneOpen, setIsChatPaneOpen] = useState(true);
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const fileInputRef = useRef(null);

  // Group Members State
  const [membersList, setMembersList] = useState([]);
  const [emailsInput, setEmailsInput] = useState("");
  const [addingMembers, setAddingMembers] = useState(false);

  // Broadcasts List State
  const [broadcasts, setBroadcasts] = useState([]);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(false);

  // Broadcast Email Form State
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const emailBodyRef = useRef(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [broadcastAttachments, setBroadcastAttachments] = useState([]);

  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setBroadcastAttachments(prev => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            size: file.size,
            content: event.target.result
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDownloadAttachment = (att) => {
    try {
      const base64Data = att.content.split(',')[1] || att.content;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: att.type });
      
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = att.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Error downloading attachment:", e);
      toast.error("Failed to download attachment");
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm("Are you sure you want to leave this Colab?")) return;
    try {
      await chatAPI.leaveGroup(chatId);
      toast.success("You left the Colab");
      navigate("/colab");
    } catch (error) {
      toast.error("Failed to leave the group");
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this Colab? This action cannot be undone.")) return;
    try {
      await chatAPI.deleteGroup(chatId);
      toast.success("Colab deleted successfully");
      navigate("/colab");
    } catch (error) {
      toast.error("Failed to delete the Colab");
    }
  };

  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const handleRenameGroup = async () => {
    if (!editingName.trim()) return;
    try {
      const res = await chatAPI.renameGroup(chatId, editingName);
      setChat(res.data);
      setIsEditingName(false);
      toast.success("Colab renamed successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to rename Colab");
    }
  };

  const isUserNearBottom = () => {
    const container = messagesContainerRef.current || messagesEndRef.current?.parentElement;
    if (!container) return true;
    const threshold = 150;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom <= threshold;
  };

  const scrollToBottom = (force = false) => {
    if (force || isUserNearBottom()) {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      } else if (messagesEndRef.current?.parentElement) {
        messagesEndRef.current.parentElement.scrollTop = messagesEndRef.current.parentElement.scrollHeight;
      }
      setHasNewMessagesBelow(false);
    }
  };

  const handleMessagesScroll = () => {
    if (isUserNearBottom()) {
      setHasNewMessagesBelow(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    let date;
    if (Array.isArray(timestamp)) {
      const [year, month, day, hour, minute, second] = timestamp;
      date = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return '';

    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const removeAttachment = (index) => {
    setSelectedAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large (max 5MB)`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedAttachments(prev => [...prev, {
          name: file.name,
          type: file.type,
          size: file.size,
          content: event.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fetchChatDetails = async () => {
    if (chat) return;
    try {
      const res = await chatAPI.getUserChats(user.email);
      if (res.data) {
        const chatList = Array.isArray(res.data) ? res.data : (res.data.data || []);
        const currentChat = chatList.find(c => c.id === parseInt(chatId));
        if (currentChat) setChat(currentChat);
      }
    } catch (err) {
      console.error("Failed to fetch chat details:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await chatAPI.getMessageHistory(chatId);
      if (res.data) {
        const history = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setMessages(history);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
      toast.error("Failed to load message history");
    } finally {
      setLoading(false);
      setTimeout(() => scrollToBottom(true), 100);
    }
  };

  const fetchChatMembers = async () => {
    try {
      const res = await chatAPI.getMembers(chatId);
      if (res.data) {
        setMembersList(res.data);
      }
    } catch (err) {
      console.error("Error fetching chat members:", err);
    }
  };

  const fetchBroadcasts = async () => {
    try {
      setLoadingBroadcasts(true);
      const res = await chatAPI.getBroadcasts(chatId);
      if (res.data) {
        setBroadcasts(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load broadcasts:", err);
    } finally {
      setLoadingBroadcasts(false);
    }
  };

  const fetchTemplates = async () => {
    const defaultMapped = DEFAULT_TEMPLATES.map(t => ({
      ...t,
      name: t.title || t.name,
      isDefault: true
    }));

    let customMapped = [];
    if (user?.email) {
      try {
        const res = await templateAPI.getTemplates(user.email);
        const dataList = res.data?.data || res.data || [];
        customMapped = dataList.map(t => ({
          ...t,
          name: t.title || t.name,
          isDefault: false
        }));
      } catch (err) {
        console.error("Error loading templates from backend:", err);
        // Fallback to local storage
        const saved = localStorage.getItem("bnx_mail_custom_templates");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            customMapped = parsed.map(t => ({
              ...t,
              name: t.title || t.name,
              isDefault: false
            }));
          } catch (e) {
            console.error("Error parsing templates from local storage:", e);
          }
        }
      }
    } else {
      const saved = localStorage.getItem("bnx_mail_custom_templates");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          customMapped = parsed.map(t => ({
            ...t,
            name: t.title || t.name,
            isDefault: false
          }));
        } catch (e) {
          console.error("Error parsing templates from local storage:", e);
        }
      }
    }

    setTemplates([...defaultMapped, ...customMapped]);
  };


  useEffect(() => {
    fetchChatDetails();
    fetchHistory();
    
    // Subscribe to live messages
    let subscription = null;
    if (isConnected) {
      subscription = subscribeToChat(chatId, (msg) => {
        const msgSender = msg.sender || msg.senderEmail;
        const msgContent = msg.content || msg.message;
        const isMe = msgSender === user?.email;
        const nearBottom = isUserNearBottom();

        setMessages(prev => {
          const normalizedMsg = {
            ...msg,
            sender: msgSender || msg.sender,
            content: msgContent || msg.content,
            message: msgContent || msg.message,
            isOptimistic: false
          };

          if (prev.some(m => String(m.id) === String(msg.id) && !m.isOptimistic)) return prev;

          const optimisticIdx = prev.findIndex(m => 
            m.isOptimistic && 
            (m.sender === msgSender || m.sender === user?.email) && 
            (m.content === msgContent || m.message === msgContent)
          );

          if (optimisticIdx !== -1) {
            const newMsgs = [...prev];
            newMsgs[optimisticIdx] = normalizedMsg;
            return newMsgs;
          }

          return [...prev, normalizedMsg];
        });

        if (isMe || nearBottom) {
          setTimeout(() => scrollToBottom(true), 50);
        } else {
          setHasNewMessagesBelow(true);
        }
      });
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [chatId, isConnected]);

  // Load Group Specific Data
  useEffect(() => {
    if (chat?.type === 'GROUP') {
      fetchChatMembers();
      fetchBroadcasts();
      fetchTemplates();
    } else {
      setMembersList(chat?.memberEmails || []);
    }
  }, [chatId, chat?.type, user?.email]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() && selectedAttachments.length === 0) return;

    const attachmentsJson = selectedAttachments.length > 0 ? JSON.stringify(selectedAttachments) : null;
    const contentText = newMessage;

    // Optimistic update
    const tempMsg = {
      id: `temp-${Date.now()}`,
      chatId: parseInt(chatId),
      sender: user.email,
      content: contentText,
      message: contentText,
      attachmentsJson: attachmentsJson,
      timestamp: new Date().toISOString(),
      isOptimistic: true
    };
    
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage("");
    setSelectedAttachments([]); // Clear after send
    setTimeout(() => scrollToBottom(true), 50);

    // Send via WebSocket with HTTP fallback if socket transmission fails
    let isSentViaWs = false;
    if (isConnected) {
      isSentViaWs = sendMessage(chatId, contentText, attachmentsJson) !== false;
    } 
    
    if (!isSentViaWs) {
      chatAPI.sendMessage({
        chatId: parseInt(chatId),
        sender: user.email,
        message: contentText,
        attachmentsJson: attachmentsJson
      }).then(res => {
        const resData = res.data?.data || res.data;
        if (resData) {
          const msgContent = resData.content || resData.message || contentText;
          const msgSender = resData.sender || resData.senderEmail || user.email;
          const updatedMsg = {
            ...resData,
            sender: msgSender,
            content: msgContent,
            message: msgContent,
            isOptimistic: false
          };
          setMessages(prev => prev.map(m => m.id === tempMsg.id ? updatedMsg : m));
        } else {
          setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...m, isOptimistic: false } : m));
        }
      }).catch(err => {
        console.error("Failed to send message via HTTP", err);
        toast.error("Failed to send message");
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      });
    }
  };

  // Add Member Action
  const handleAddMembers = async (e) => {
    e.preventDefault();
    if (!emailsInput.trim()) return;

    const emailsList = emailsInput.split(/[\s,]+/).filter(e => e.includes('@'));
    if (emailsList.length === 0) {
      toast.error("Please enter valid email addresses");
      return;
    }

    try {
      setAddingMembers(true);
      const res = await chatAPI.addMembers(chatId, { emails: emailsList });
      if (res.data) {
        toast.success("Invitations sent!");
        setEmailsInput("");
        fetchChatMembers();
      }
    } catch (err) {
      toast.error("Failed to add members");
    } finally {
      setAddingMembers(false);
    }
  };

  // Broadcast Email Action
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    const bodyContent = emailBodyRef.current ? emailBodyRef.current.innerHTML : emailBody;
    const cleanContent = bodyContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
    if (!emailSubject.trim() || !cleanContent) {
      toast.error("Subject and body are required");
      return;
    }

    try {
      setSendingEmail(true);
      toast.loading("Sending broadcast...", { id: "send-broadcast" });
      
      await chatAPI.sendBroadcast(chatId, {
        subject: emailSubject,
        body: bodyContent,
        attachmentsJson: broadcastAttachments.length > 0 ? JSON.stringify(broadcastAttachments) : null
      });
      
      toast.success("Broadcast sent successfully", { id: "send-broadcast" });
      setEmailSubject("");
      setEmailBody("");
      if (emailBodyRef.current) emailBodyRef.current.innerHTML = "";
      setSelectedTemplate("");
      setBroadcastAttachments([]);
      setShowComposeModal(false);
      fetchBroadcasts();
    } catch (err) {
      toast.error("Failed to send broadcast", { id: "send-broadcast" });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSelectTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    if (!templateId) {
      setEmailSubject("");
      setEmailBody("");
      if (emailBodyRef.current) emailBodyRef.current.innerHTML = "";
      return;
    }
    const selected = templates.find(t => String(t.id) === String(templateId));
    if (selected) {
      setEmailSubject(selected.subject || selected.title || selected.name || "");
      const bodyContent = selected.body || "";
      setEmailBody(bodyContent);
      if (emailBodyRef.current) {
        emailBodyRef.current.innerHTML = bodyContent;
      }
    }
  };

  const chatPartner = chat?.memberEmails?.find(e => e !== user.email);
  const chatName = chat?.type === 'DIRECT' ? chatPartner?.split('@')[0] : (chat?.name || `Chat #${chatId}`);

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Action Toolbar */}
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-2 border-b shrink-0 relative z-20 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md printable-conversation-no-print"
        style={{ borderColor: theme.border || 'rgba(229,231,235,0.5)' }}
      >
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => {
              if (chat?.type === 'DIRECT') {
                navigate("/chat");
              } else {
                navigate("/colab");
              }
            }}
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
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400 hover:text-indigo-500 cursor-pointer"
            title="Labels"
          >
            <MdLabel size={20} />
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => window.print()}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            title="Print"
          >
            <MdPrint size={20} />
          </button>
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
                    setIsChatPaneOpen(prev => !prev);
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
                >
                  {isChatPaneOpen ? "Hide Comments Pane" : "Show Comments Pane"}
                </button>
                {chat?.type === 'GROUP' && (
                  <button
                    onClick={() => {
                      setShowInfoModal(true);
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
                  >
                    View Group Info
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HEADER */}
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between bg-white/40 dark:bg-gray-900/40 backdrop-blur-md shrink-0 relative z-10 printable-conversation-no-print">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (chat?.type === 'DIRECT') {
                navigate("/chat");
              } else {
                navigate("/colab");
              }
            }}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: theme.text }}
          >
            <MdArrowBack size={24} />
          </button>
          
          {/* Clickable Group Name to open Colab Info Modal */}
          <div 
            onClick={() => {
              if (chat?.type === 'GROUP') {
                setShowInfoModal(true);
              }
            }}
            className={`flex items-center gap-3 ${chat?.type === 'GROUP' ? 'cursor-pointer hover:opacity-80 transition-all' : ''}`}
            title={chat?.type === 'GROUP' ? "View group details & members" : ""}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm ${chat?.type === 'GROUP' ? 'bg-gradient-to-br from-primary to-purple-600' : 'bg-gradient-to-br from-teal-500 to-blue-600'}`}>
              {chatName?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h2 className="font-bold leading-tight text-sm sm:text-base" style={{ color: theme.text }}>{chatName}</h2>
                {chat?.type === 'GROUP' && <MdInfoOutline size={14} className="opacity-60 text-gray-500 dark:text-gray-400" />}
              </div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-primary opacity-80">
                {chat?.type || 'CONVERSATION'} • {isConnected ? 'Online' : 'Reconnecting...'}
              </p>
            </div>
          </div>
        </div>

        {chat?.type === 'GROUP' && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowComposeModal(true)}
              className="md:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors" 
              style={{ color: theme.subText }}
              title="Compose Broadcast"
            >
              <MdEmail size={22} />
            </button>
          </div>
        )}
      </div>

      {/* Main Split Container */}
      <div className={`flex-1 flex flex-col md:flex-row overflow-hidden relative p-4 transition-all duration-300 ${isChatPaneOpen ? 'gap-4' : 'gap-0'}`}>
        
        {/* Left Side: Professional Broadcast list (60% width) */}
        {chat?.type === 'GROUP' && (
          <div className={`flex flex-col h-full rounded-2xl border border-gray-200/50 dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/60 shadow-sm overflow-hidden shrink-0 transition-all duration-300 ease-in-out ${isChatPaneOpen ? 'w-full h-1/2 md:h-full md:w-[60%]' : 'w-full h-full'}`}>
            
            {/* Header: Professional Broadcast Title */}
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02] shrink-0">
              <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: theme.text }}>
                <MdEmail size={18} className="text-primary" style={{ color: theme.accent }} /> Professional Broadcasts ({broadcasts.length})
              </h3>
              {!isChatPaneOpen && (
                <button 
                  onClick={() => setIsChatPaneOpen(true)}
                  className="p-1 px-2.5 rounded-xl border border-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="Open Comments"
                  style={{ color: theme.accent, borderColor: theme.accent + "33", backgroundColor: theme.accent + "0d" }}
                >
                  <MdKeyboardArrowRight size={18} /> Open Comments
                </button>
              )}
            </div>

            {/* Broadcasts List View */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 hidden-scrollbar bg-black/[0.01] dark:bg-white/[0.01]">
              {loadingBroadcasts && broadcasts.length === 0 ? (
                <div className="flex justify-center p-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : broadcasts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-40 text-center p-6 mt-10">
                  <MdEmail size={48} className="mb-3 text-gray-400" />
                  <p className="text-sm font-semibold">No Broadcasts Sent</p>
                  <p className="text-xs max-w-xs mt-1">
                    Send professional email updates to all group members. Click the button below to compose.
                  </p>
                </div>
              ) : (
                broadcasts.map((b, idx) => {
                  const cleanSub = b.subject ? b.subject.replace(/^\[Colab#\d+\]\s*/i, "") : "(No Subject)";
                  return (
                    <div 
                      key={b.id || idx}
                      className="p-4 rounded-2xl border border-gray-200/40 dark:border-gray-800/40 bg-white/50 dark:bg-gray-900/50 hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all shadow-sm flex flex-col gap-1.5"
                    >
                      <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5 text-[10px] opacity-75 text-gray-500 font-semibold tracking-wider">
                        <span>From: {b.from?.split("<")[0]?.trim() || b.from}</span>
                      </div>

                        <span className="text-[10px] opacity-60 shrink-0 font-medium ml-2">
                          {b.sentDate ? new Date(b.sentDate).toLocaleString() : ""}
                        </span>
                      </div>
                        <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 leading-tight">
                          {cleanSub}
                        </h4>
                      <div className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300 break-words whitespace-pre-line border-t border-gray-100 dark:border-gray-800/60 pt-2">
                        {b.body || b.textPlain || "(Empty Content)"}
                      </div>
                      
                      {/* Attachments Section */}
                      {(() => {
                        let atts = [];
                        try {
                          if (b.attachmentsJson) {
                            atts = JSON.parse(b.attachmentsJson);
                          }
                        } catch (e) {
                          console.error(e);
                        }
                        if (!atts || atts.length === 0) return null;
                        return (
                          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800/60 flex flex-wrap gap-2">
                            {atts.map((att, index) => (
                              <button
                                key={index}
                                onClick={() => handleDownloadAttachment(att)}
                                className="flex items-center justify-center w-7 h-7 bg-black/[0.03] dark:bg-white/[0.03] hover:bg-black/[0.06] dark:hover:bg-white/[0.06] border border-gray-200/50 dark:border-gray-800/50 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-all cursor-pointer shrink-0"
                                title={`${att.name} (${(att.size / 1024).toFixed(1)} KB)`}
                              >
                                <MdAttachFile size={14} className="text-gray-400 dark:text-gray-500" />
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Button Bar */}
            <div className="p-4 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-800/50 shrink-0">
              <button
                onClick={() => setShowComposeModal(true)}
                className="w-full py-3 rounded-2xl font-bold text-sm text-white shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                style={{ background: theme.accent || "#135bec" }}
              >
                <MdEmail size={18} /> Compose New Broadcast
              </button>
            </div>
          </div>
        )}

        {/* Right Side: Chat Room / Comments (40% width for GROUP, full width for DIRECT) */}
        <div 
          className={`flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out bg-white/60 dark:bg-gray-900/60 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-800/50 printable-conversation shrink-0 ${
            chat?.type === 'GROUP' 
              ? (isChatPaneOpen ? 'w-full h-1/2 md:h-full md:w-[40%]' : 'w-0 h-0 md:w-0 md:h-full overflow-hidden') 
              : 'w-full h-full'
          }`}
          style={{ 
            opacity: chat?.type === 'GROUP' ? (isChatPaneOpen ? 1 : 0) : 1,
            pointerEvents: chat?.type === 'GROUP' ? (isChatPaneOpen ? 'auto' : 'none') : 'auto',
            borderWidth: chat?.type === 'GROUP' && !isChatPaneOpen ? '0px' : '1px'
          }}
        >
          {/* Print-Only Header */}
          <div className="hidden print:block border-b pb-2 mb-4 px-6 pt-6 shrink-0">
            <h1 className="text-xl font-bold">{chatName}</h1>
            {chatPartner && <p className="text-xs text-gray-500">{chatPartner}</p>}
          </div>
          {/* Header: Instant Chat Messages Title (Only when split) */}
          {chat?.type === 'GROUP' && (
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02] shrink-0 printable-conversation-no-print">
              <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: theme.text }}>
                <MdChat size={18} className="text-primary" style={{ color: theme.accent }} /> Comments
              </h3>
              <button 
                onClick={() => setIsChatPaneOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer flex items-center justify-center"
                title="Hide Comments"
              >
                <MdKeyboardArrowLeft size={22} />
              </button>
            </div>
          )}
          {/* MESSAGES AREA */}
          <div className="relative flex-1 min-h-0">
            <div 
              ref={messagesContainerRef} 
              onScroll={handleMessagesScroll}
              className="h-full overflow-y-auto p-6 space-y-4 hidden-scrollbar bg-white/10 dark:bg-black/10"
            >
              {loading && messages.length === 0 ? (
                <div className="flex justify-center p-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-30 text-center">
                  <MdChat size={64} className="mb-4" />
                  <p className="text-lg font-medium">No messages yet</p>
                  <p className="text-sm">Be the first to say hello!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender === user.email;
                  return (
                    <div key={msg.id || idx} className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="max-w-[85%] sm:max-w-[75%] flex flex-col items-start">
                        <span className="text-[10px] font-bold mb-1 ml-2 uppercase opacity-60" style={{ color: theme.subText }}>
                          {chatName}
                        </span>
                        <div className="flex flex-col w-fit">
                          <div 
                            className={`px-4 py-2.5 rounded-full shadow-sm relative ${
                              isMe 
                                ? 'bg-primary text-white' 
                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700'
                            }`}
                          >
                            <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            
                            {/* Attachments Rendering */}
                            {msg.attachmentsJson && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {(() => {
                                  try {
                                    const atts = JSON.parse(msg.attachmentsJson);
                                    return atts.map((att, i) => (
                                      <div key={i} className="max-w-xs rounded-lg overflow-hidden border border-black/10 dark:border-white/10 shadow-sm bg-black/5 dark:bg-white/5 relative group">
                                        {att.type.startsWith('image/') ? (
                                          <a href={att.content} target="_blank" rel="noreferrer" download={att.name}>
                                            <img src={att.content} alt={att.name} className="max-h-48 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity" />
                                          </a>
                                        ) : (
                                          <div className="flex items-center gap-3 p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                            <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg shrink-0">
                                              <MdPictureAsPdf size={24} />
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                              <span className="text-xs font-semibold truncate max-w-[120px]">{att.name}</span>
                                              <span className="text-[10px] opacity-70">{(att.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                              <a href={att.content} target="_blank" rel="noreferrer" title="View PDF" className="p-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 transition-colors">
                                                <MdVisibility size={16} />
                                              </a>
                                              <a href={att.content} download={att.name} title="Download PDF" className="p-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 transition-colors">
                                                <MdFileDownload size={16} />
                                              </a>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ));
                                  } catch (e) {
                                    return null;
                                  }
                                })()}
                              </div>
                            )}

                          </div>

                          {/* Timestamp outside and below the bubble */}
                          <div 
                            className="text-[9px] mt-1 opacity-60 font-medium select-none text-gray-500 dark:text-gray-400 self-end mr-2 text-right"
                          >
                            {formatMessageTime(msg.timestamp)}
                            {msg.isOptimistic && " • sending..."}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {hasNewMessagesBelow && (
              <button
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-4 right-6 z-30 px-3.5 py-1.5 rounded-full text-white text-xs font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer border border-white/20"
                style={{ backgroundColor: theme?.accent || "#135bec" }}
              >
                <MdKeyboardArrowRight className="rotate-90" size={16} /> New Messages
              </button>
            )}
          </div>

          {/* INPUT AREA */}
          <div className="p-4 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-800/50 shrink-0 printable-conversation-no-print">
            {/* Attachments Preview Area */}
            {selectedAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 max-w-5xl mx-auto px-12">
                {selectedAttachments.map((att, idx) => (
                  <div key={idx} className="relative group rounded-xl border shadow-sm overflow-hidden bg-white dark:bg-gray-800 w-20 h-20 flex items-center justify-center shrink-0">
                    <button 
                      onClick={() => removeAttachment(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-black/80"
                    >
                      <MdClose size={12} />
                    </button>
                    {att.type.startsWith('image/') ? (
                      <img src={att.content} alt={att.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center p-2 text-center text-red-500 dark:text-red-400">
                        <MdPictureAsPdf size={24} />
                        <span className="text-[8px] font-medium truncate w-full mt-1 px-1 text-gray-700 dark:text-gray-300" title={att.name}>
                          {att.name}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <form onSubmit={handleSend} className="flex items-center gap-3 max-w-5xl mx-auto">
              <input 
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all focus:outline-none"
              >
                <MdAttachFile size={22} className="rotate-45" />
              </button>
              <div className="relative shrink-0 flex items-center" ref={emojiPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2.5 rounded-xl text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all focus:outline-none"
                  title="Insert Emoji"
                >
                  <MdInsertEmoticon size={22} />
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
              <div className="flex-1 relative">
                <input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full pl-4 pr-12 py-3 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-800/80 outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-inner text-sm"
                  style={{ color: theme.text }}
                  spellCheck="false"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim() && selectedAttachments.length === 0}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-white shadow-md disabled:opacity-30 transition-all hover:scale-105 active:scale-95 focus:outline-none"
                >
                  <MdSend size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Compose Broadcast Modal Overlay */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div 
            className="w-full max-w-lg p-6 rounded-2xl border shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b mb-4" style={{ borderColor: theme.border }}>
              <h3 className="text-lg font-bold flex items-center gap-1.5">
                <MdEmail size={20} className="text-primary" style={{ color: theme.accent }} /> New Colab Broadcast
              </h3>
              <button 
                onClick={() => setShowComposeModal(false)}
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <MdClose size={22} style={{ color: theme.text }} />
              </button>
            </div>

            {/* Modal Scrollable Body Form */}
            <form onSubmit={handleSendBroadcast} className="flex-1 overflow-y-auto space-y-4 pr-1 hidden-scrollbar">
              <p className="text-xs opacity-75 leading-relaxed" style={{ color: theme.subText }}>
                This broadcast will be sent directly to all {membersList.length} members of the group, and will show up in their broadcasts list.
              </p>

              {/* Template Selection Dropdown */}
              {templates.length > 0 && (
                <div className="p-3.5 bg-black/[0.02] dark:bg-white/[0.02] border border-gray-200/50 dark:border-gray-800/50 rounded-xl">
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 opacity-65 flex items-center gap-1">
                    <MdAssignment size={14} /> Quick Templates
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    className="w-full p-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none font-medium"
                  >
                    <option value="">-- Choose a template to load --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Subject Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-65">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Email subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-1 focus:ring-primary/45 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Body Textarea */}
              {/* Unified Message Body Input Container */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-65">
                  Message Body (HTML support)
                </label>
                
                <div 
                  className="flex flex-col border rounded-xl overflow-hidden transition-all bg-white dark:bg-gray-900"
                  style={{ borderColor: theme.border }}
                >
                  {/* ContentEditable Div for HTML support without raw tags */}
                  <div
                    ref={emailBodyRef}
                    contentEditable
                    onInput={(e) => setEmailBody(e.currentTarget.innerHTML)}
                    placeholder="Write email content here..."
                    className="w-full p-3 bg-transparent text-gray-900 dark:text-white outline-none text-sm overflow-y-auto min-h-[160px] max-h-[240px] custom-broadcast-editable"
                    style={{ whiteSpace: "pre-wrap" }}
                  />

                  {/* Selected Attachments Chips */}
                  {broadcastAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 border-t bg-black/[0.01] dark:bg-white/[0.01]" style={{ borderColor: theme.border }}>
                      {broadcastAttachments.map((att, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center gap-1.5 px-2 py-1 bg-black/[0.03] dark:bg-white/[0.03] border rounded-lg text-[11px] font-medium"
                          style={{ borderColor: theme.border }}
                        >
                          <span className="truncate max-w-[150px]">{att.name}</span>
                          <span className="text-[9px] opacity-60">({(att.size / 1024).toFixed(0)} KB)</span>
                          <button
                            type="button"
                            onClick={() => setBroadcastAttachments(prev => prev.filter((_, i) => i !== idx))}
                            className="p-0.5 text-red-500 hover:bg-red-500/10 rounded cursor-pointer flex items-center justify-center"
                          >
                            <MdClose size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Toolbar with Attach Icon */}
                  <div className="flex items-center justify-between px-3 py-2 border-t bg-black/[0.02] dark:bg-white/[0.02]" style={{ borderColor: theme.border }}>
                    <label className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-all" title="Attach file">
                      <MdAttachFile size={18} />
                      <input 
                        type="file" 
                        multiple 
                        onChange={handleAttachmentChange} 
                        className="hidden" 
                    />
                    </label>
                    <span className="text-[10px] text-gray-450 dark:text-gray-500 font-normal">HTML enabled • Max 5MB per file</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <button
                disabled={sendingEmail || membersList.length === 0}
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-sm text-white shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                style={{ background: theme.accent || "#135bec" }}
              >
                {sendingEmail ? "Sending Broadcast..." : "Send Broadcast"}
                <MdSend size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Colab Info Overlay Modal (Displays group metadata, members, and adding controls) */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div 
            className="w-full max-w-md p-6 rounded-2xl border shadow-xl flex flex-col max-h-[85vh] overflow-hidden"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b mb-4" style={{ borderColor: theme.border }}>
              <h3 className="text-lg font-bold flex items-center gap-1.5">
                <MdPeople size={20} className="text-primary" style={{ color: theme.accent }} /> Colab Channel Info
              </h3>
              <button 
                onClick={() => setShowInfoModal(false)}
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <MdClose size={22} style={{ color: theme.text }} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 hidden-scrollbar">
              <div>
                {isEditingName ? (
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-grow p-1.5 border rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-primary/45"
                      autoFocus
                    />
                    <button onClick={handleRenameGroup} className="p-1.5 bg-primary text-white rounded-lg hover:scale-105 transition-all">
                      <MdCheck size={16} />
                    </button>
                    <button onClick={() => setIsEditingName(false)} className="p-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
                      <MdClose size={16} />
                    </button>
                  </div>
                ) : (
                  <h4 className="font-bold text-base flex items-center gap-2">
                    {chat?.name || "Colab Group"}
                    {chat?.creatorEmail === user.email && (
                      <button 
                        onClick={() => {
                          setEditingName(chat?.name || "");
                          setIsEditingName(true);
                        }}
                        className="text-gray-400 hover:text-primary transition-colors p-1"
                        title="Rename Colab"
                      >
                        <MdEdit size={14} />
                      </button>
                    )}
                  </h4>
                )}
                <p className="text-xs opacity-75 mt-1 leading-relaxed" style={{ color: theme.subText }}>
                  {chat?.description || "A collaboration channel for team messaging and email broadcasting."}
                </p>
                {chat?.createdAt && (
                  <div className="mt-3 flex flex-wrap gap-2 text-[9px] uppercase font-bold tracking-wider opacity-60">
                    <span className="bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-full">
                      Created: {new Date(chat.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Add Members Form */}
              <form onSubmit={handleAddMembers} className="p-4 bg-black/[0.02] dark:bg-white/[0.02] border border-gray-200/50 dark:border-gray-800/50 rounded-2xl">
                <h5 className="text-xs font-bold uppercase tracking-wider mb-1 opacity-75 flex items-center gap-1">
                  <MdPersonAdd size={16} /> Add New Members
                </h5>
                <p className="text-[10px] opacity-60 mb-3">
                  Enter email addresses separated by commas or spaces.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="alice@bnxmail.com, bob@bnxmail.com"
                    value={emailsInput}
                    onChange={(e) => setEmailsInput(e.target.value)}
                    className="flex-grow p-2.5 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={addingMembers || !emailsInput.trim()}
                    className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl disabled:opacity-50 cursor-pointer shadow-sm transition-all"
                    style={{ background: theme.accent }}
                  >
                    {addingMembers ? "Adding..." : "Add"}
                  </button>
                </div>
              </form>

              {/* Members List */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider opacity-65 flex items-center gap-1.5">
                  <MdPeople size={16} /> Group Members ({membersList.length})
                </h5>
                <div className="border border-gray-100 dark:border-gray-800 rounded-2xl divide-y divide-gray-50 dark:divide-gray-800 bg-white/40 dark:bg-gray-900/10 overflow-hidden shadow-inner max-h-48 overflow-y-auto">
                  {membersList.map((email, idx) => {
                    const isMe = email.toLowerCase() === user.email.toLowerCase();
                    return (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs transition-colors hover:bg-black/[0.01]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/80 to-purple-500/80 flex items-center justify-center font-bold text-white shrink-0 shadow-inner">
                            {email.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                            {email}
                          </span>
                        </div>
                        {isMe && (
                          <span className="text-[9px] uppercase tracking-wide font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm mr-2">
                            Me
                          </span>
                        )}
                        {email === chat?.creatorEmail && (
                          <span className="text-[9px] uppercase tracking-wide font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm">
                            Creator
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Danger Zone */}
              {chat?.type === 'GROUP' && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                  {/* <h5 className="text-xs font-bold uppercase tracking-wider text-red-500 opacity-80 mb-2">
                    Danger Zone {chat?.creatorEmail ? `(Creator: ${chat.creatorEmail})` : '(No Creator)'}
                  </h5> */}
                  <button
                    onClick={handleLeaveGroup}
                    className="w-full py-2.5 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/50"
                  >
                    Leave Colab
                  </button>
                  {chat?.creatorEmail?.toLowerCase() === user?.email?.toLowerCase() && (
                    <button
                      onClick={handleDeleteGroup}
                      className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                    >
                      Delete Colab
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
