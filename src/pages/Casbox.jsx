import { useTranslation } from "../context/LanguageContext";
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useMail } from "../context/MailContext";
import { casboxAPI, api, userAPI, mailAPI, contactAliasAPI, connectionAPI } from "../services/api";
import { MdCheck, MdDoneAll, MdStarBorder, MdStar, MdDeleteOutline, MdRefresh, MdSend, MdClose, MdRemoveRedEye, MdFileDownload, MdReply, MdBlock, MdArrowBack, MdArchive, MdUnarchive, MdAccessTime, MdLabel, MdDelete, MdMoreVert, MdInsertEmoticon, MdChevronRight, MdChevronLeft, MdEdit, MdPersonAdd } from "react-icons/md";
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

  const [activeTab, setActiveTab] = useState('messages');
  const [showArchive, setShowArchive] = useState(false);
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

  const [openMenuId, setOpenMenuId] = useState(null);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const listMenuRef = React.useRef(null);

  const [contactAliases, setContactAliases] = useState({});
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [customNameInput, setCustomNameInput] = useState("");
  const [isSavingAlias, setIsSavingAlias] = useState(false);

  const fetchAliases = async () => {
    try {
      const res = await contactAliasAPI.getAllAliases();
      if (res.data && Array.isArray(res.data)) {
        const map = {};
        res.data.forEach(item => {
          if (item.customName && item.customName.trim()) {
            const trimmed = item.customName.trim();
            if (item.contactUserId) map[String(item.contactUserId)] = trimmed;
            if (item.contactEmail) map[item.contactEmail.toLowerCase()] = trimmed;
            if (item.contactUsername) map[item.contactUsername.toLowerCase()] = trimmed;
          }
        });
        setContactAliases(prev => ({ ...prev, ...map }));
      }
    } catch (e) {
      console.error("Failed to load contact aliases", e);
    }
  };

  useEffect(() => {
    fetchAliases();
  }, []);

  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [connectionToDisconnect, setConnectionToDisconnect] = useState(null);
  const [isUpdatingConnection, setIsUpdatingConnection] = useState(false);
  const connectionsRef = React.useRef(null);

  const fetchConnections = async () => {
    try {
      setLoadingConnections(true);
      const res = await connectionAPI.getAccepted();
      if (res.data && Array.isArray(res.data)) {
        setConnections(res.data);
      }
    } catch (e) {
      console.error("Failed to load connections", e);
    } finally {
      setLoadingConnections(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (connectionsRef.current && !connectionsRef.current.contains(event.target)) {
        setShowConnectionsModal(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowConnectionsModal(false);
      }
    };
    if (showConnectionsModal) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showConnectionsModal]);

  const isDisconnectedContact = (emailOrUsername) => {
    if (!emailOrUsername) return false;
    const lower = emailOrUsername.toLowerCase();
    const local = (lower.includes('@') ? lower.split('@')[0] : lower);
    return connections.some(c => {
      if (c.status?.toUpperCase() !== 'DISCONNECTED') return false;
      const cEmail = c.contactEmail?.toLowerCase();
      const cUser = c.contactUsername?.toLowerCase();
      const cId = c.contactUserId ? String(c.contactUserId) : null;
      return (cEmail && (cEmail === lower || cEmail === local)) ||
             (cUser && (cUser === lower || cUser === local)) ||
             (cId && cId === lower);
    });
  };

  const handleConfirmDisconnect = async () => {
    if (!connectionToDisconnect) return;
    try {
      setIsUpdatingConnection(true);
      const connId = connectionToDisconnect.id;
      const targetName = connectionToDisconnect.contactDisplayName || connectionToDisconnect.contactUsername || "contact";
      await connectionAPI.updateStatus(connId, "DISCONNECTED");

      // Update local state
      setConnections(prev => prev.map(c => c.id === connId ? { ...c, status: "DISCONNECTED" } : c));

      // Close current chat if disconnected
      if (selectedMessage) {
        const other = selectedMessage.senderEmail === user?.email ? selectedMessage.receiverEmail : selectedMessage.senderEmail;
        if (other) {
          const lower = other.toLowerCase();
          const local = (lower.includes('@') ? lower.split('@')[0] : lower);
          const cEmail = connectionToDisconnect.contactEmail?.toLowerCase();
          const cUser = connectionToDisconnect.contactUsername?.toLowerCase();
          if ((cEmail && (cEmail === lower || cEmail === local)) || (cUser && (cUser === lower || cUser === local))) {
            setSelectedMessage(null);
          }
        }
      }

      fetchMessages(true);
      toast.success(`Disconnected from ${targetName}`);
    } catch (e) {
      console.error("Failed to disconnect", e);
      toast.error(e.response?.data?.message || "Failed to disconnect");
    } finally {
      setIsUpdatingConnection(false);
      setConnectionToDisconnect(null);
    }
  };

  const handleReconnect = async (conn) => {
    if (!conn) return;
    try {
      setIsUpdatingConnection(true);
      const connId = conn.id;
      const targetName = conn.contactDisplayName || conn.contactUsername || "contact";
      await connectionAPI.updateStatus(connId, "CONNECTED");

      setConnections(prev => prev.map(c => c.id === connId ? { ...c, status: "CONNECTED" } : c));
      fetchMessages(true);
      toast.success(`Connected with ${targetName}`);
    } catch (e) {
      console.error("Failed to reconnect", e);
      toast.error(e.response?.data?.message || "Failed to reconnect");
    } finally {
      setIsUpdatingConnection(false);
    }
  };

  const getDisplayName = (emailOrUsername, msg) => {
    if (!emailOrUsername) return "";
    const key = emailOrUsername.toLowerCase();
    const local = (emailOrUsername.includes('@') ? emailOrUsername.split('@')[0] : emailOrUsername).toLowerCase();
    if (contactAliases[key]) return contactAliases[key];
    if (contactAliases[local]) return contactAliases[local];
    if (msg) {
      if (msg.customName && msg.customName.trim()) return msg.customName.trim();
      if (msg.contactDisplayName && msg.contactDisplayName.trim()) return msg.contactDisplayName.trim();
    }
    return emailOrUsername.includes('@') ? emailOrUsername.split('@')[0] : emailOrUsername;
  };

  const getOriginalName = (emailOrUsername, msg) => {
    if (!emailOrUsername) return "";
    if (msg?.contactUsername) return msg.contactUsername;
    return emailOrUsername.includes('@') ? emailOrUsername.split('@')[0] : emailOrUsername;
  };

  const getContactInitial = (emailOrUsername, msg) => {
    const name = getDisplayName(emailOrUsername, msg);
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  const handleOpenEditNameModal = (chatOrMsg, e) => {
    if (e) e.stopPropagation();
    setOpenMenuId(null);
    setShowMoreMenu(false);

    const contactEmail = chatOrMsg.contact || (chatOrMsg.senderEmail === user?.email ? chatOrMsg.receiverEmail : chatOrMsg.senderEmail);
    const msg = chatOrMsg.latestMessage || (chatOrMsg.body !== undefined ? chatOrMsg : null);
    const originalName = getOriginalName(contactEmail, msg);
    const currentName = getDisplayName(contactEmail, msg);
    const hasCustomAlias = contactAliases[contactEmail.toLowerCase()] || 
                           contactAliases[contactEmail.split('@')[0].toLowerCase()] || 
                           (msg?.customName && msg.customName.trim());

    setEditingContact({
      contact: contactEmail,
      contactUserId: msg?.contactUserId,
      originalName: originalName,
      currentName: currentName,
      hasCustomAlias: Boolean(hasCustomAlias),
      msg: msg
    });
    setCustomNameInput(hasCustomAlias ? currentName : "");
    setShowEditNameModal(true);
  };

  const handleSaveContactName = async (e) => {
    if (e) e.preventDefault();
    if (!editingContact) return;

    const contactTarget = editingContact.contact;
    const trimmedInput = customNameInput.trim();
    const contactIdOrIdentifier = editingContact.contactUserId || contactTarget;

    try {
      setIsSavingAlias(true);

      if (!trimmedInput) {
        // Deleting / resetting custom alias to restore original username
        await contactAliasAPI.deleteAlias(contactIdOrIdentifier);

        // Update local contactAliases state
        setContactAliases(prev => {
          const updated = { ...prev };
          delete updated[contactTarget.toLowerCase()];
          delete updated[contactTarget.split('@')[0].toLowerCase()];
          if (editingContact.contactUserId) {
            delete updated[String(editingContact.contactUserId)];
          }
          return updated;
        });

        // Update messages in state
        setMessages(prev => prev.map(m => {
          const other = m.senderEmail === user?.email ? m.receiverEmail : m.senderEmail;
          if (other && other.toLowerCase() === contactTarget.toLowerCase()) {
            return {
              ...m,
              customName: null,
              contactDisplayName: m.contactUsername || contactTarget.split('@')[0]
            };
          }
          return m;
        }));

        // Update threadMessages
        setThreadMessages(prev => prev.map(m => {
          const other = m.senderEmail === user?.email ? m.receiverEmail : m.senderEmail;
          if (other && other.toLowerCase() === contactTarget.toLowerCase()) {
            return {
              ...m,
              customName: null,
              contactDisplayName: m.contactUsername || contactTarget.split('@')[0]
            };
          }
          return m;
        }));

        toast.success(`Contact name reset to ${editingContact.originalName}`);
      } else {
        // Setting / updating custom alias
        const res = await contactAliasAPI.setAlias(contactIdOrIdentifier, trimmedInput);
        const savedName = res.data?.customName || trimmedInput;

        // Update local contactAliases state
        setContactAliases(prev => ({
          ...prev,
          [contactTarget.toLowerCase()]: savedName,
          [contactTarget.split('@')[0].toLowerCase()]: savedName,
          ...(editingContact.contactUserId ? { [String(editingContact.contactUserId)]: savedName } : {})
        }));

        // Update messages in state
        setMessages(prev => prev.map(m => {
          const other = m.senderEmail === user?.email ? m.receiverEmail : m.senderEmail;
          if (other && other.toLowerCase() === contactTarget.toLowerCase()) {
            return {
              ...m,
              customName: savedName,
              contactDisplayName: savedName
            };
          }
          return m;
        }));

        // Update threadMessages
        setThreadMessages(prev => prev.map(m => {
          const other = m.senderEmail === user?.email ? m.receiverEmail : m.senderEmail;
          if (other && other.toLowerCase() === contactTarget.toLowerCase()) {
            return {
              ...m,
              customName: savedName,
              contactDisplayName: savedName
            };
          }
          return m;
        }));

        toast.success("Contact name updated");
      }

      setShowEditNameModal(false);
      setEditingContact(null);
      setCustomNameInput("");
    } catch (err) {
      console.error("Failed to save contact name", err);
      toast.error(err.response?.data?.message || "Failed to update contact name");
    } finally {
      setIsSavingAlias(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (listMenuRef.current && !listMenuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    };
    if (openMenuId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuId]);

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
    const isCurrentlyArchived = Boolean(selectedMessage.isArchived || selectedMessage.archived);
    const otherEmail = selectedMessage.senderEmail === user?.email
      ? selectedMessage.receiverEmail
      : selectedMessage.senderEmail;

    const matchingMsgIds = messages
      .filter(m => (m.senderEmail === otherEmail || m.receiverEmail === otherEmail) && (isCurrentlyArchived ? Boolean(m.isArchived || m.archived) : !Boolean(m.isArchived || m.archived)))
      .map(m => m.id);

    const targetIds = matchingMsgIds.length > 0 ? matchingMsgIds : [selectedMessage.id];
    const newArchived = !isCurrentlyArchived;

    try {
      setMessages(prev => prev.map(m => targetIds.includes(m.id) ? { ...m, isArchived: newArchived, archived: newArchived } : m));
      setSelectedMessage(null);
      await casboxAPI.updateArchiveStatus(targetIds, newArchived);
      if (newArchived) {
        toast.success("Message archived");
      } else {
        const isSent = selectedMessage.senderEmail === user?.email;
        toast.success(`Message moved back to ${isSent ? "Sent" : "Received"}`);
      }
    } catch (err) {
      console.error("Failed to update archive status", err);
      toast.error("Failed to update archive status");
      fetchMessages(true);
    }
  };

  const handleArchiveMessage = async (chatOrMsg, e) => {
    if (e) e.stopPropagation();
    setOpenMenuId(null);

    const otherEmail = chatOrMsg.contact || (chatOrMsg.senderEmail === user?.email ? chatOrMsg.receiverEmail : chatOrMsg.senderEmail);

    const matchingMsgIds = otherEmail 
      ? messages.filter(m => (m.senderEmail === otherEmail || m.receiverEmail === otherEmail) && !Boolean(m.isArchived || m.archived)).map(m => m.id)
      : [];

    const targetIds = matchingMsgIds.length > 0 
      ? matchingMsgIds 
      : (chatOrMsg.messages ? chatOrMsg.messages.map(m => m.id) : [chatOrMsg.id || chatOrMsg.latestMessage?.id].filter(Boolean));

    if (targetIds.length === 0) return;

    try {
      setMessages(prev => prev.map(m => targetIds.includes(m.id) ? { ...m, isArchived: true, archived: true } : m));
      
      if (selectedMessage && (targetIds.includes(selectedMessage.id) || (otherEmail && getOtherUserEmail(selectedMessage) === otherEmail))) {
        setSelectedMessage(null);
      }

      await casboxAPI.updateArchiveStatus(targetIds, true);
      toast.success("Conversation archived");
    } catch (err) {
      console.error("Failed to archive message", err);
      toast.error("Failed to archive message");
      fetchMessages(true);
    }
  };

  const handleUnarchiveMessage = async (chatOrMsg, e) => {
    if (e) e.stopPropagation();
    setOpenMenuId(null);

    const otherEmail = chatOrMsg.contact || (chatOrMsg.senderEmail === user?.email ? chatOrMsg.receiverEmail : chatOrMsg.senderEmail);

    const matchingMsgIds = otherEmail 
      ? messages.filter(m => (m.senderEmail === otherEmail || m.receiverEmail === otherEmail) && Boolean(m.isArchived || m.archived)).map(m => m.id)
      : [];

    const targetIds = matchingMsgIds.length > 0 
      ? matchingMsgIds 
      : (chatOrMsg.messages ? chatOrMsg.messages.map(m => m.id) : [chatOrMsg.id || chatOrMsg.latestMessage?.id].filter(Boolean));

    if (targetIds.length === 0) return;

    try {
      setMessages(prev => prev.map(m => targetIds.includes(m.id) ? { ...m, isArchived: false, archived: false } : m));
      if (selectedMessage && (targetIds.includes(selectedMessage.id) || (otherEmail && getOtherUserEmail(selectedMessage) === otherEmail))) {
        setSelectedMessage(null);
      }

      await casboxAPI.updateArchiveStatus(targetIds, false);
      toast.success("Moved back to Messages");
    } catch (err) {
      console.error("Failed to unarchive message", err);
      toast.error("Failed to unarchive message");
      fetchMessages(true);
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;
    const targetContact = conversationToDelete.contact;
    if (!targetContact) return;

    try {
      setIsDeletingConversation(true);
      await casboxAPI.deleteConversation(targetContact);

      // Only remove the conversation from UI after backend confirms successful deletion
      setMessages(prev => prev.filter(m => {
        if (targetContact.toLowerCase() === user?.email?.toLowerCase()) {
          return !(m.senderEmail?.toLowerCase() === user?.email?.toLowerCase() && m.receiverEmail?.toLowerCase() === user?.email?.toLowerCase());
        }
        const other = m.senderEmail?.toLowerCase() === user?.email?.toLowerCase() ? m.receiverEmail : m.senderEmail;
        return other?.toLowerCase() !== targetContact.toLowerCase();
      }));

      // Close thread if currently viewing this conversation
      if (selectedMessage) {
        const other = selectedMessage.senderEmail?.toLowerCase() === user?.email?.toLowerCase() ? selectedMessage.receiverEmail : selectedMessage.senderEmail;
        if (other?.toLowerCase() === targetContact.toLowerCase()) {
          setSelectedMessage(null);
        }
      }

      setOpenMenuId(null);
      setConversationToDelete(null);
      toast.success("Conversation deleted");
    } catch (err) {
      console.error("Failed to delete conversation", err);
      // Keep conversation in UI list and show error message
      toast.error("Unable to delete conversation. Please try again.");
    } finally {
      setIsDeletingConversation(false);
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
      m.status?.toUpperCase() !== 'SEEN'
    );

    if (unreadMsgs.length > 0) {
      const ids = unreadMsgs.map(m => m.id);
      setMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, status: 'SEEN' } : m));
      setThreadMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, status: 'SEEN' } : m));
      casboxAPI.updateStatus({ messageIds: ids, status: 'SEEN' })
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
        if (newMsg.customName && newMsg.customName.trim()) {
          const val = newMsg.customName.trim();
          const other = newMsg.senderEmail === user?.email ? newMsg.receiverEmail : newMsg.senderEmail;
          setContactAliases(prev => ({
            ...prev,
            ...(other ? { [other.toLowerCase()]: val, [other.split('@')[0].toLowerCase()]: val } : {}),
            ...(newMsg.contactUsername ? { [newMsg.contactUsername.toLowerCase()]: val } : {}),
            ...(newMsg.contactUserId ? { [String(newMsg.contactUserId)]: val } : {})
          }));
        }
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
      try {
        if (messageSub && stompClient && (stompClient.connected || isConnected)) {
          messageSub.unsubscribe();
        }
      } catch (e) {}
      try {
        if (statusSub && stompClient && (stompClient.connected || isConnected)) {
          statusSub.unsubscribe();
        }
      } catch (e) {}
    };
  }, [stompClient, isConnected]);

  const fetchMessages = async (background = false) => {
    try {
      if (!background) setLoading(true);
      const res = await casboxAPI.getAllMessages();
      const msgs = res.data || [];
      setMessages(msgs);

      // Collect any aliases returned in the messages DTOs
      const dtoAliases = {};
      msgs.forEach(m => {
        if (m.customName && m.customName.trim()) {
          const val = m.customName.trim();
          if (m.contactUserId) dtoAliases[String(m.contactUserId)] = val;
          const other = m.senderEmail === user?.email ? m.receiverEmail : m.senderEmail;
          if (other) {
            dtoAliases[other.toLowerCase()] = val;
            dtoAliases[other.split('@')[0].toLowerCase()] = val;
          }
          if (m.contactUsername) dtoAliases[m.contactUsername.toLowerCase()] = val;
        }
      });
      if (Object.keys(dtoAliases).length > 0) {
        setContactAliases(prev => ({ ...prev, ...dtoAliases }));
      }

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
      m.status?.toUpperCase() !== 'SEEN'
    );

    if (unreadMsgs.length > 0) {
      const ids = unreadMsgs.map(m => m.id);
      setMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, status: 'SEEN' } : m));
      setThreadMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, status: 'SEEN' } : m));
      if (ids.includes(msg.id)) {
        setSelectedMessage(prev => prev ? { ...prev, status: 'SEEN' } : { ...msg, status: 'SEEN' });
      }

      try {
        await casboxAPI.updateStatus({ messageIds: ids, status: 'SEEN' });
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

  const activeUnarchived = unblockedMessages.filter(msg => !msg.isArchived && !msg.archived);
  const archivedMessages = unblockedMessages.filter(msg => Boolean(msg.isArchived || msg.archived));

  const sentMessages = activeUnarchived.filter(msg => msg.senderEmail === user?.email);
  const allReceived = activeUnarchived.filter(msg => msg.receiverEmail === user?.email);

  const receivedMessages = allReceived.filter(msg =>
    knownContacts.has(msg.senderEmail) || acceptedContacts.includes(msg.senderEmail)
  );
  const requestMessages = allReceived.filter(msg =>
    !knownContacts.has(msg.senderEmail) && !acceptedContacts.includes(msg.senderEmail)
  );

  const mainMessages = activeUnarchived.filter(msg => {
    const contact = msg.senderEmail === user?.email ? msg.receiverEmail : msg.senderEmail;
    if (isDisconnectedContact(contact)) return false;
    if (msg.senderEmail === user?.email) return true;
    return knownContacts.has(msg.senderEmail) || acceptedContacts.includes(msg.senderEmail);
  });

  const filteredMessages = (activeTab === 'messages' || activeTab === 'received' || activeTab === 'sent') ? mainMessages
    : activeTab === 'requests' ? requestMessages
      : archivedMessages;

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

  const isMessageUnread = (m) => {
    if (!m || m.receiverEmail !== user?.email) return false;
    if (m.isRead === true || m.read === true) return false;
    return m.status?.toUpperCase() !== 'SEEN';
  };

  const unreadMessagesCount = mainMessages.filter(isMessageUnread).length;
  const unreadArchivedCount = archivedMessages.filter(isMessageUnread).length;

  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newChatText.trim()) return;

    const otherEmail = selectedMessage.senderEmail === user?.email
      ? selectedMessage.receiverEmail
      : selectedMessage.senderEmail;

    if (isDisconnectedContact(otherEmail)) {
      toast.error("Cannot send message. This connection is disconnected.");
      return;
    }

    try {
      setSendingChat(true);
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
      const errMsg = err.response?.data?.message || err.response?.data?.error || "Cannot send message. This connection is disconnected.";
      toast.error(errMsg);
    } finally {
      setSendingChat(false);
    }
  };

  const displayedConnections = React.useMemo(() => {
    const list = [...connections];

    if (conversationList && conversationList.length > 0) {
      conversationList.forEach(chat => {
        const contactEmail = chat.contact;
        if (!contactEmail || contactEmail === user?.email) return;
        const lower = contactEmail.toLowerCase();
        const local = lower.includes('@') ? lower.split('@')[0] : lower;

        const alreadyExists = list.some(c => {
          const cEmail = c.contactEmail?.toLowerCase();
          const cUser = c.contactUsername?.toLowerCase();
          return cEmail === lower || cEmail === local || cUser === lower || cUser === local;
        });

        if (!alreadyExists) {
          list.push({
            id: contactEmail,
            contactEmail: contactEmail,
            contactUsername: getOriginalName(contactEmail, chat.latestMessage),
            contactDisplayName: getDisplayName(contactEmail, chat.latestMessage),
            status: 'CONNECTED',
            contactUserId: chat.latestMessage?.contactUserId
          });
        }
      });
    }

    return list.filter(conn => {
      const email = conn.contactEmail?.toLowerCase();
      const uname = conn.contactUsername?.toLowerCase();
      if (blockedContacts.some(b => b.toLowerCase() === email || b.toLowerCase() === uname)) {
        return false;
      }
      return true;
    });
  }, [connections, conversationList, blockedContacts, user?.email, contactAliases]);

  const headerComponent = (
    <div className="flex flex-col shrink-0">
      <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 shrink-0 bg-transparent">
        <div className="flex items-center bg-gray-100/80 dark:bg-gray-800/80 p-1 rounded-lg shrink-0">
          <button
            onClick={() => { setActiveTab('messages'); setSelectedMessage(null); }}
            className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${activeTab === 'messages' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            {t('casbox.messages', 'Messages')}
            {unreadMessagesCount > 0 && (
              <span className={`font-normal hidden sm:inline ${activeTab === 'messages' ? 'opacity-80' : 'opacity-60'}`}>
                ({unreadMessagesCount})
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('requests'); setSelectedMessage(null); }}
            className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${activeTab === 'requests' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            {t('casbox.requests', 'Requests')} {requestMessages.length > 0 && <span className="flex h-2 w-2 rounded-full bg-red-500"></span>}
          </button>
          <button
            onClick={() => {
              if (showArchive && activeTab === 'archive') {
                setActiveTab('messages');
                setSelectedMessage(null);
              }
              setShowArchive(prev => !prev);
            }}
            className="p-1.5 rounded-md transition-all flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60"
            title={showArchive ? t('common.collapse', 'Collapse') : t('sidebar.archive', 'Archive')}
            aria-label={showArchive ? "Collapse Archive" : "Expand Archive"}
          >
            {showArchive ? <MdChevronLeft size={18} /> : <MdChevronRight size={18} />}
          </button>
          {showArchive && (
            <button
              onClick={() => { setActiveTab('archive'); setSelectedMessage(null); }}
              className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 animate-in fade-in duration-150 ${activeTab === 'archive' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              title={t('sidebar.archive', 'Archive')}
            >
              {t('sidebar.archive', 'Archive')}
              {unreadArchivedCount > 0 && (
                <span className={`font-normal hidden sm:inline ${activeTab === 'archive' ? 'opacity-80' : 'opacity-60'}`}>
                  ({unreadArchivedCount})
                </span>
              )}
            </button>
          )}
        </div>

        <div className="flex-1"></div>

        {/* Connection Icon BEFORE Compose */}
        <div className="relative mr-1.5" ref={connectionsRef}>
          <button
            type="button"
            onClick={() => {
              setShowConnectionsModal(prev => !prev);
              if (!showConnectionsModal) fetchConnections();
            }}
            className={`p-2 rounded-full transition-all flex items-center justify-center cursor-pointer ${
              showConnectionsModal
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title="Connections"
            aria-label="Connections"
          >
            <MdPersonAdd size={20} />
          </button>

          {/* Connections Popover */}
          {showConnectionsModal && (
            <div className="absolute right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mt-2 w-80 sm:w-96 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="p-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-black/20">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <MdPersonAdd size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-none">Connections</h3>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {displayedConnections.length} accepted contact{displayedConnections.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConnectionsModal(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <MdClose size={18} />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                {loadingConnections && connections.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400 dark:text-gray-500">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading connections...
                  </div>
                ) : displayedConnections.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-xs">
                    No accepted connections found.
                  </div>
                ) : (
                  displayedConnections.map((conn) => {
                    const isConn = conn.status?.toUpperCase() === 'CONNECTED';
                    const initial = (conn.contactDisplayName || conn.contactUsername || "?").charAt(0).toUpperCase();

                    return (
                      <div key={conn.id} className="p-3.5 flex items-start justify-between gap-3 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-start gap-2.5 min-w-0">
                          {conn.contactProfilePicture ? (
                            <img
                              src={conn.contactProfilePicture}
                              alt={conn.contactDisplayName}
                              className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5 border border-gray-200 dark:border-gray-700"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                              {initial}
                            </div>
                          )}

                          <div className="min-w-0 flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate">
                                {conn.contactDisplayName || conn.contactUsername}
                              </span>
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${isConn ? 'bg-emerald-500' : 'bg-gray-400'}`}
                                title={isConn ? 'Connected' : 'Disconnected'}
                              />
                            </div>

                            <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                              @{conn.contactUsername || conn.contactEmail?.split('@')[0]}
                            </span>

                            <div className="flex items-center gap-1.5 mt-2">
                              {/* Connected Button */}
                              {isConn ? (
                                <button
                                  type="button"
                                  disabled
                                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 cursor-default shadow-xs"
                                >
                                  <MdCheck size={14} /> Connected
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isUpdatingConnection}
                                  onClick={() => handleReconnect(conn)}
                                  className="px-2.5 py-1 rounded-md text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-500/30 transition-colors cursor-pointer"
                                >
                                  Connect
                                </button>
                              )}

                              {/* Disconnected Button */}
                              {isConn ? (
                                <button
                                  type="button"
                                  disabled={isUpdatingConnection}
                                  onClick={() => setConnectionToDisconnect(conn)}
                                  className="px-2.5 py-1 rounded-md text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
                                >
                                  Disconnected
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 flex items-center gap-1 cursor-default"
                                >
                                  <MdCheck size={14} /> Disconnected
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

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
      {conversationList.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 opacity-80 pb-20">
          {activeTab === 'archive' ? (
            <>
              <MdArchive className="text-4xl mb-3 opacity-30" />
              <p className="text-sm font-medium">No archived messages</p>
            </>
          ) : (
            <>
              <MdSend className="text-4xl mb-3 opacity-30" />
              <p className="text-sm font-medium">
                {activeTab === 'requests' ? 'No message requests' : t('casbox.no_chats', 'No chats yet')}
              </p>
            </>
          )}
        </div>
      ) : (
        conversationList.map((chat) => {
          const msg = chat.latestMessage;
          const isMe = msg.senderEmail === user?.email;
          const otherEmail = chat.contact;
          const isSelected = selectedMessage && (
            (selectedMessage.senderEmail === user?.email ? selectedMessage.receiverEmail : selectedMessage.senderEmail) === otherEmail
          );

          const unreadCount = chat.messages.filter(isMessageUnread).length;

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
                  {getContactInitial(otherEmail, msg)}
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm truncate ${unreadCount > 0 ? 'font-extrabold text-gray-900 dark:text-white' : 'font-semibold text-gray-800 dark:text-gray-200'}`}>
                    {getDisplayName(otherEmail, msg)}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-xs ${unreadCount > 0 ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-400 dark:text-gray-500'}`}>
                      {parseTimestamp(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="relative shrink-0" ref={openMenuId === chat.contact ? listMenuRef : null}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(prev => prev === chat.contact ? null : chat.contact);
                        }}
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        title="More options"
                      >
                        <MdMoreVert size={18} />
                      </button>

                      {openMenuId === chat.contact && (
                        <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-30 py-1 animate-in fade-in duration-150">
                          <button
                            onClick={(e) => handleOpenEditNameModal(chat, e)}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 flex items-center gap-2 transition-colors"
                          >
                            <MdEdit size={16} className="text-gray-500 dark:text-gray-400" />
                            {t('casbox.edit_name', 'Edit Name')}
                          </button>
                          {activeTab === 'archive' ? (
                            <button
                              onClick={(e) => handleUnarchiveMessage(chat, e)}
                              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 transition-colors"
                            >
                              <MdUnarchive size={16} className="text-blue-600 dark:text-blue-400" />
                              Unarchive
                            </button>
                          ) : (
                            <button
                              onClick={(e) => handleArchiveMessage(chat, e)}
                              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 flex items-center gap-2 transition-colors"
                            >
                              <MdArchive size={16} className="text-gray-500 dark:text-gray-400" />
                              Archive
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              setConversationToDelete(chat);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                          >
                            <MdDeleteOutline size={16} className="text-red-500 dark:text-red-400" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                    {activeTab === 'archive' && (
                      <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 shrink-0">
                        {chat.messages.length} {chat.messages.length === 1 ? 'message' : 'messages'} &bull;
                      </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate font-normal">
                      {isMe ? "You: " : ""}{msg.body}
                    </span>
                  </div>

                  {(unreadCount > 0 || (isMe && getStatusIcon(msg.status))) && (
                    <div className="flex items-center gap-1.5 shrink-0">
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
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const handleAcceptRequest = async (senderEmail) => {
    try {
      const newAccepted = [...acceptedContacts, senderEmail];
      setAcceptedContacts(newAccepted);
      await userAPI.updateSettings({ casboxAccepted: newAccepted });
      toast.success("Request accepted");
      setActiveTab("messages");
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
              title={Boolean(selectedMessage?.isArchived || selectedMessage?.archived) ? "Unarchive" : "Archive"}
            >
              {Boolean(selectedMessage?.isArchived || selectedMessage?.archived) ? (
                <MdUnarchive size={20} className="text-blue-600 dark:text-blue-400" />
              ) : (
                <MdArchive size={20} />
              )}
            </button>
            <button
              onClick={() => {
                const other = getOtherUserEmail(selectedMessage);
                setConversationToDelete({ contact: other });
              }}
              className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
              title="Delete conversation"
            >
              <MdDeleteOutline size={20} />
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
                      setShowMoreMenu(false);
                      handleOpenEditNameModal({ contact: otherUserEmail, latestMessage: selectedMessage });
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
                  >
                    <MdEdit size={16} className="text-gray-500 dark:text-gray-400" />
                    {t('casbox.edit_contact_name', 'Edit Contact Name')}
                  </button>
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
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      setConversationToDelete({ contact: otherUserEmail });
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2"
                  >
                    <MdDeleteOutline size={16} />
                    Delete Conversation
                  </button>
                </div>
              )}
            </div>
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
              {getContactInitial(otherUserEmail, selectedMessage)}
            </div>

            <div className="flex flex-col">
              <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{getDisplayName(otherUserEmail, selectedMessage)}</span>
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
              const senderLabel = isMe ? (user?.username || senderEmail.split("@")[0]) : getDisplayName(senderEmail, msg);
              const senderInitial = isMe ? (user?.username || senderEmail).charAt(0).toUpperCase() : getContactInitial(senderEmail, msg);

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
                          {senderInitial}
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
          {isDisconnectedContact(otherUserEmail) ? (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs">
              <span className="font-semibold">Cannot send message. This connection is disconnected.</span>
              <button
                type="button"
                disabled={isUpdatingConnection}
                onClick={() => {
                  const conn = connections.find(c => {
                    const cEmail = c.contactEmail?.toLowerCase();
                    const cUser = c.contactUsername?.toLowerCase();
                    const other = otherUserEmail.toLowerCase();
                    return cEmail === other || cUser === other || (other.includes('@') && cUser === other.split('@')[0]);
                  });
                  if (conn) handleReconnect(conn);
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
              >
                Reconnect
              </button>
            </div>
          ) : isContactRequest && selectedMessage.receiverEmail === user?.email ? (
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

        {conversationToDelete && (
          <div
            className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center animate-fade-in p-4 backdrop-blur-sm"
            onClick={() => {
              if (!isDeletingConversation) {
                setConversationToDelete(null);
              }
            }}
          >
            <div
              className="bg-white dark:bg-[#1e1e1e] rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden p-6 border border-gray-100 dark:border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4 mx-auto">
                <MdDeleteOutline size={26} />
              </div>

              <h3 className="font-bold text-lg text-center text-gray-900 dark:text-white mb-2">
                Delete this conversation?
              </h3>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-6">
                This will delete all messages with <span className="font-medium text-gray-700 dark:text-gray-300">{getDisplayName(conversationToDelete.contact, conversationToDelete.latestMessage)}</span>. This action cannot be undone.
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={isDeletingConversation}
                  onClick={() => setConversationToDelete(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingConversation}
                  onClick={handleDeleteConversation}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isDeletingConversation && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditNameModal && editingContact && (
          <div
            className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center animate-fade-in p-4 backdrop-blur-sm"
            onClick={() => {
              if (!isSavingAlias) {
                setShowEditNameModal(false);
                setEditingContact(null);
              }
            }}
          >
            <div
              className="bg-white dark:bg-[#1e1e1e] rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden p-6 border border-gray-100 dark:border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4 mx-auto">
                <MdEdit size={24} />
              </div>

              <h3 className="font-bold text-lg text-center text-gray-900 dark:text-white mb-1">
                {t('casbox.edit_contact_name', 'Edit Contact Name')}
              </h3>

              <div className="text-center mb-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Current Name:{" "}
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {editingContact.currentName}
                  </span>
                </div>
                {editingContact.hasCustomAlias && (
                  <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                    Original username:{" "}
                    <span className="font-mono text-gray-600 dark:text-gray-300">
                      {editingContact.originalName}
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveContactName}>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Custom Name
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={customNameInput}
                    onChange={(e) => setCustomNameInput(e.target.value)}
                    placeholder={editingContact.originalName || "e.g. Rahul"}
                    maxLength={150}
                    disabled={isSavingAlias}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 transition-all"
                  />
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 leading-tight">
                    Only you will see this name. The contact's account name is not changed.
                  </p>
                </div>

                {editingContact.hasCustomAlias && (
                  <div className="mb-4 flex justify-end">
                    <button
                      type="button"
                      disabled={isSavingAlias}
                      onClick={() => setCustomNameInput("")}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                    >
                      Clear custom name (restore original)
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 mt-2">
                  <button
                    type="button"
                    disabled={isSavingAlias}
                    onClick={() => {
                      setShowEditNameModal(false);
                      setEditingContact(null);
                    }}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingAlias}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    style={{ backgroundColor: theme?.accent || "#135bec" }}
                  >
                    {isSavingAlias && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {connectionToDisconnect && (
          <div
            className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center animate-fade-in p-4 backdrop-blur-sm"
            onClick={() => {
              if (!isUpdatingConnection) {
                setConnectionToDisconnect(null);
              }
            }}
          >
            <div
              className="bg-white dark:bg-[#1e1e1e] rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden p-6 border border-gray-100 dark:border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-lg text-center text-gray-900 dark:text-white mb-2">
                Disconnect from {connectionToDisconnect.contactDisplayName || connectionToDisconnect.contactUsername}?
              </h3>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Disconnecting will remove this chat from your Cashbox. Your existing account and connection request information will be preserved.
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={isUpdatingConnection}
                  onClick={() => setConnectionToDisconnect(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpdatingConnection}
                  onClick={handleConfirmDisconnect}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingConnection && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Casbox;
