import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SIDEBAR_ITEMS } from "../Data/constants";
import { useTheme } from "../context/ThemeContext";
import { useMail } from "../context/MailContext";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";
import { chatAPI } from "../services/api";
import StorageWidget from './StorageWidget';
import { MdLabel, MdAdd, MdClose, MdCheck, MdDelete, MdExpandMore, MdExpandLess, MdHelpOutline, MdContactSupport, MdSettings, MdMoreVert, MdEdit, MdGroup, MdChat, MdCloudUpload, MdOutlineNoteAlt } from "react-icons/md";

const SideBar = ({ isDesktopOpen, isMobileOpen, onCloseMobile, onOpenNotes }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, backgroundImage, sidebarPreferences } = useTheme();
  const { unreadCounts, labels, handleCreateLabel, handleUpdateLabel, handleDeleteLabel, openCompose } = useMail();
  const { user, getSessions } = useAuth();

  const handleNavigation = (path) => {
    navigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  const isChatMode = location.pathname.startsWith("/colab") || location.pathname.startsWith("/chat") || location.pathname.startsWith("/casbox");
  const isVaultMode = location.pathname.startsWith("/vault");

  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(false);

  useEffect(() => {
    if (isChatMode && user?.email) {
      setChatsLoading(true);
      chatAPI.getUserChats(user.email)
        .then(res => {
          if (res.data) {
            setChats(Array.isArray(res.data) ? res.data : (res.data.data || []));
          }
        })
        .catch(err => console.error("Failed to load chats in sidebar:", err))
        .finally(() => setChatsLoading(false));
    }
  }, [isChatMode, user?.email]);

  const colabGroups = chats.filter(c => c.type === 'GROUP');
  const directMessages = chats.filter(c => c.type === 'DIRECT');

  const [isCreating, setIsCreating] = useState(false);
  const [onLabelCreatedCb, setOnLabelCreatedCb] = useState(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [activeLabelMenu, setActiveLabelMenu] = useState(null);
  const [newLabel, setNewLabel] = useState({ name: "", color: "#135bec", parentId: "" });
  const [editingLabel, setEditingLabel] = useState(null);
  const labelMenuRef = useRef(null);

  const getItemLabel = (name) => {
    switch (name) {
      case 'All Inbox': return t('sidebar.all_inbox', 'All Inbox');
      case 'Inbox': return t('sidebar.inbox', 'Inbox');
      case 'Analytics': return t('sidebar.analytics', 'Analytics');
      case 'Starred': return t('sidebar.starred', 'Starred');
      case 'Sent': return t('sidebar.sent', 'Sent');
      case 'Draft':
      case 'Drafts': return t('sidebar.draft', t('sidebar.drafts', 'Drafts'));
      case 'Snoozed': return t('sidebar.snoozed', 'Snoozed');
      case 'Scheduled': return t('sidebar.scheduled', 'Scheduled');
      case 'Archive': return t('sidebar.archive', 'Archive');
      case 'Spam': return t('sidebar.spam', 'Spam');
      case 'Trash': return t('sidebar.trash', 'Trash');
      case 'Unread': return t('sidebar.unread', 'Unread');
      case 'All Mail': return t('sidebar.all_mail', 'All Mail');
      case 'Templates': return t('sidebar.templates', 'Templates');
      case 'Colab': return t('sidebar.colab', 'Colab');
      case 'Chat': return t('sidebar.chat', 'Chat');
      case 'Mail Backup': return t('sidebar.mail_backup', 'Mail Backup');
      case 'Groups': return t('sidebar.groups', 'Groups');
      case 'Chat Room': return t('sidebar.chat_room', 'Chat Room');
      case 'Casbox': return t('sidebar.casbox', 'Casbox');
      case 'Vault': return t('sidebar.vault', 'Vault');
      case 'Storage Management': return t('sidebar.storage_management', 'Storage Management');
      case 'Subscriptions': return t('sidebar.subscriptions', 'Subscriptions');
      case 'Notification':
      case 'NotifyHub': return t('sidebar.notification', 'Notifications');
      case 'Settings': return t('sidebar.settings', 'Settings');
      case 'Support & Help': return t('sidebar.support', 'Support & Help');
      default: return name;
    }
  };

  useEffect(() => {
    const handleOpenLabelModal = (e) => {
      setIsCreating(true);
      if (e.detail?.onSuccess) {
        setOnLabelCreatedCb(() => e.detail.onSuccess);
      }
    };
    window.addEventListener('openLabelCreateModal', handleOpenLabelModal);
    return () => window.removeEventListener('openLabelCreateModal', handleOpenLabelModal);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (labelMenuRef.current && !labelMenuRef.current.contains(event.target)) {
        setActiveLabelMenu(null);
      }
    };
    if (activeLabelMenu) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [activeLabelMenu]);

  const COLORS = ["#135bec", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];

  const handleAddLabel = async () => {
    if (!newLabel.name.trim()) return;
    const parentId = newLabel.parentId ? parseInt(newLabel.parentId) : null;
    const newLbl = await handleCreateLabel(newLabel.name, newLabel.color, parentId);
    if (newLbl) {
      if (onLabelCreatedCb) {
        onLabelCreatedCb(newLbl.id);
        setOnLabelCreatedCb(null);
      }
      setIsCreating(false);
      setNewLabel({ name: "", color: "#135bec", parentId: "" });
    }
  };

  const handleEditLabelSubmit = async () => {
    if (!editingLabel.name.trim()) return;
    const parentId = editingLabel.parentId ? parseInt(editingLabel.parentId) : null;
    const success = await handleUpdateLabel(editingLabel.id, editingLabel.name, editingLabel.color, parentId);
    if (success) {
      setEditingLabel(null);
    }
  };

  return (
    <>
      <aside
        className={`
        h-full overflow-y-auto flex flex-col transition-all duration-300 shrink-0 border-r-0 hidden-scrollbar
        flex relative translate-x-0 sidebar-wrapper
        ${!isDesktopOpen ? "sidebar-collapsed" : "md:w-56"}
        ${isMobileOpen ? "sidebar-mobile-open" : ""}
      `}
        style={{ backgroundColor: isMobileOpen ? undefined : (backgroundImage ? "transparent" : theme.bg) }}
      >

        {/* NAVIGATION */}
        <nav className="flex-1 flex flex-col pr-0 pt-6 pb-2 space-y-0 overflow-y-auto hidden-scrollbar">
          {/* TOP ITEMS */}
          {isVaultMode ? (
            <div className="flex flex-col px-2 mt-2">
               <button
                  onClick={() => handleNavigation('/vault')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group cursor-pointer btn-collapse bg-primary/10 dark:bg-primary/20`}
                  style={{ color: theme.accent || "#135bec" }}
               >
                 <MdCloudUpload size={18} className="shrink-0" />
                 <span className="text-sm font-medium hide-on-collapse">{t('sidebar.my_vault', 'My Vault')}</span>
               </button>
            </div>
          ) : !isChatMode ? (
            ["Inbox", "Starred", "Snoozed", "Sent", "Draft", "Trash"]
              .map(name => SIDEBAR_ITEMS.find(item => item.name === name))
              .filter(Boolean)
              .filter(item => sidebarPreferences?.[item.name] !== false)
              .map((item) => {
                const isActive = location.pathname === item.path || (location.pathname === "/" && item.path === "/inbox");
                const unreadKey = item.name.toLowerCase().replace(' ', '').replace('-', '');
                const count = unreadCounts[unreadKey] || 0;

                return (
                  <button
                    key={getItemLabel(item.name)}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-[calc(100%-16px)] mx-2 my-0.5 flex items-center justify-between pl-4 pr-3 py-1 rounded-full transition-all duration-200 group cursor-pointer btn-collapse shrink-0
                      ${isActive
                        ? "bg-primary/10 dark:bg-primary/20"
                        : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                      }
                    `}
                    style={{
                      color: isActive ? (theme.accent || "#135bec") : theme.sidebarText,
                      fontWeight: isActive ? 400 : 300,
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`text-[18px] shrink-0 transition-transform duration-200 ${isActive ? "scale-105" : "group-hover:scale-105"}`}>
                        {item.icon}
                      </span>
                      <span className="text-sm tracking-wide truncate whitespace-nowrap hide-on-collapse">{getItemLabel(item.name)}</span>
                    </div>

                    {count > 0 && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full shadow-sm hide-on-collapse"
                        style={{ backgroundColor: theme.accent || "#135bec", color: "#fff" }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })
          ) : (
            <div className="flex flex-col px-2 mt-2">

              {/* Casbox */}
              <div className="mb-2">
                 <button
                    onClick={() => handleNavigation('/casbox')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group cursor-pointer btn-collapse
                      ${location.pathname.startsWith('/casbox') ? "bg-primary/10 dark:bg-primary/20" : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"}
                    `}
                    style={{ color: location.pathname.startsWith('/casbox') ? (theme.accent || "#135bec") : theme.sidebarText }}
                 >
                   <MdChat size={18} className="shrink-0" />
                   <span className="text-sm font-medium hide-on-collapse text-left flex-1">{t('sidebar.casbox', 'Casbox')}</span>
                 </button>
              </div>

              {/* Colab */}
              <div className="mb-6">
                 <button
                    onClick={() => handleNavigation('/colab')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group cursor-pointer btn-collapse
                      ${location.pathname.startsWith('/colab') || location.pathname.startsWith('/chat') ? "bg-primary/10 dark:bg-primary/20" : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"}
                    `}
                    style={{ color: location.pathname.startsWith('/colab') || location.pathname.startsWith('/chat') ? (theme.accent || "#135bec") : theme.sidebarText }}
                 >
                   <MdGroup size={18} className="shrink-0" />
                   <span className="text-sm font-medium hide-on-collapse text-left flex-1">{t('sidebar.colab', 'Colab')}</span>
                 </button>
              </div>

            </div>
          )}

          {!isChatMode && !isVaultMode && ["All Inbox", "Scheduled", "Spam", "All Mail", "Archive", "Unread", "Chat", "Templates", "Analytics", "Subscriptions", "Mail Backup"]
            .filter(name => name !== "All Inbox" || (getSessions && getSessions().length > 1))
            .map(name => SIDEBAR_ITEMS.find(item => item.name === name))
            .filter(Boolean)
            .filter(item => sidebarPreferences?.[item.name] !== false)
            .length > 0 && (
            <div className="pt-1">
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className="w-[calc(100%-16px)] mx-2 my-0.5 flex items-center justify-between pl-4 pr-3 py-1 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all cursor-pointer group btn-collapse shrink-0"
                style={{ color: theme.sidebarText, fontWeight: 500 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[18px] transition-transform duration-200 group-hover:scale-105">
                    {isMoreOpen ? <MdExpandLess /> : <MdExpandMore />}
                  </span>
                  <span className="text-sm tracking-wide hide-on-collapse">{isMoreOpen ? t('sidebar.less', 'Less') : t('sidebar.more', 'More')}</span>
                </div>
              </button>

              {isMoreOpen && (
                <div className="mt-1 space-y-0 animate-fade-in origin-top">
                  {["All Inbox", "Scheduled", "Spam", "All Mail", "Archive", "Unread", "Templates", "Analytics", "Subscriptions", "Mail Backup"]
                    .filter(name => name !== "All Inbox" || (getSessions && getSessions().length > 1))
                    .map(name => SIDEBAR_ITEMS.find(item => item.name === name))
                    .filter(Boolean)
                    .filter(item => sidebarPreferences?.[item.name] !== false)
                    .map((item) => {
                      const isActive = location.pathname === item.path;
                      const unreadKey = item.name === "NotifyHub" ? "notification" : item.name.toLowerCase().replace(' ', '').replace('-', '');
                      const count = unreadCounts[unreadKey] || 0;

                      return (
                        <button
                          key={getItemLabel(item.name)}
                          onClick={() => handleNavigation(item.path)}
                          className={`w-[calc(100%-16px)] mx-2 my-0.5 flex items-center justify-between pl-4 pr-3 py-1 rounded-full transition-all duration-200 group cursor-pointer btn-collapse
                    ${isActive
                              ? "bg-primary/10 dark:bg-primary/20"
                              : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                            }
                  `}
                          style={{
                            color: isActive ? (theme.accent || "#135bec") : theme.sidebarText,
                            fontWeight: isActive ? 400 : 300,
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className={`text-[18px] shrink-0 transition-transform duration-200 ${isActive ? "scale-105" : "group-hover:scale-105"}`}>
                              {item.icon}
                            </span>
                            <span className="text-sm tracking-wide truncate whitespace-nowrap hide-on-collapse">{getItemLabel(item.name)}</span>
                          </div>

                          {count > 0 && (
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded-full shadow-sm hide-on-collapse"
                              style={{ backgroundColor: theme.accent || "#135bec", color: "#fff" }}
                            >
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          )}



          {/* CUSTOM LABELS */}
          {!isChatMode && !isVaultMode && (
            <>
              <div className="pt-3 pb-2">
                <hr className="border-gray-200 dark:border-gray-700/50 mx-4" />
              </div>
          <div className="mt-1">
            <div className="pl-4 pr-3 flex items-center justify-between mb-1 hide-on-collapse">
              <h3 className="text-xs font-bold uppercase tracking-widest opacity-50" style={{ color: theme.sidebarText }}>
                {t('sidebar.labels', 'Labels')}
              </h3>
              <button
                onClick={() => setIsCreating(true)}
                className="p-1 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                style={{ color: theme.accent }}
              >
                <MdAdd size={18} />
              </button>
            </div>



            {(() => {
              const renderLabelTree = (parentId, depth = 0) => {
                const children = labels.filter(l => l.parentId === parentId || (!l.parentId && parentId === null));
                return children.map(label => (
                  <div key={label.id} className="group">
                    <div
                      onClick={() => handleNavigation(`/label/${label.id}`)}
                      className="w-[calc(100%-16px)] mx-2 flex items-center justify-between pr-3 py-1 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all cursor-pointer btn-collapse"
                      style={{ color: theme.sidebarText, paddingLeft: `${16 + (depth * 16)}px` }}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <MdLabel style={{ color: label.colorHex }} size={18} className="shrink-0" />
                        <span className="text-sm truncate hide-on-collapse pl-1.5">{label.name}</span>
                      </div>
                      <div className="relative flex items-center h-full hide-on-collapse">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveLabelMenu(activeLabelMenu === label.id ? null : label.id);
                          }}
                          className={`p-1 rounded transition-opacity hover:bg-black/10 dark:hover:bg-white/10 shrink-0 ${activeLabelMenu === label.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                          style={{ color: theme.sidebarText }}
                        >
                          <MdMoreVert size={16} />
                        </button>

                        {activeLabelMenu === label.id && (
                            <div
                              ref={activeLabelMenu === label.id ? labelMenuRef : null}
                              className="absolute right-0 top-full mt-1 w-32 py-1 rounded-xl shadow-lg border z-50 text-xs overflow-hidden"
                              style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveLabelMenu(null);
                                  setEditingLabel({ id: label.id, name: label.name, color: label.colorHex || "#135bec", parentId: label.parentId || "" });
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                              >
                                <MdEdit size={14} /> {t('common.edit', 'Edit')}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveLabelMenu(null);
                                  if (window.confirm(t('sidebar.delete_label_confirm', 'Are you sure you want to delete this label? Sub-labels will also be deleted.'))) {
                                    handleDeleteLabel(label.id);
                                  }
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left text-red-500"
                              >
                                <MdDelete size={14} /> {t('common.delete', 'Delete')}
                              </button>
                            </div>
                        )}
                      </div>
                    </div>
                    {renderLabelTree(label.id, depth + 1)}
                  </div>
                ));
              };
              return renderLabelTree(null);
            })()}
          </div>

            {/* HELP & SUPPORT (Removed HR above it) */}
            </>
          )}
          <div className="pt-2">
          </div>
        </nav>

        <div className="space-y-0 mb-6 shrink-0 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
          <StorageWidget isDesktopOpen={isDesktopOpen} />
          <button
            onClick={() => handleNavigation("/settings")}
            className="w-[calc(100%-16px)] mx-2 my-0.5 flex items-center gap-3 pl-4 pr-3 py-1 rounded-full transition-all duration-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] cursor-pointer text-sm tracking-wide btn-collapse"
            style={{ color: theme.sidebarText, fontWeight: 500 }}
          >
            <span className="text-[18px]"><MdSettings size={22} /></span>
            <span className="hide-on-collapse">{t('sidebar.settings', 'Settings')}</span>
          </button>

          <button
            onClick={() => handleNavigation("/support")}
            className="w-[calc(100%-16px)] mx-2 my-0.5 flex items-center gap-3 pl-4 pr-3 py-1 rounded-full transition-all duration-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] cursor-pointer text-sm tracking-wide btn-collapse"
            style={{ color: theme.sidebarText, fontWeight: 500 }}
          >
            <span className="text-[18px]"><MdHelpOutline size={22} /></span>
            <span className="hide-on-collapse">{t('sidebar.support', 'Support & Help')}</span>
          </button>
        </div>
      </aside>

      {/* CREATE LABEL MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <h2 className="text-lg font-semibold" style={{ color: theme.text }}>{t('sidebar.new_label', 'New Label')}</h2>
              <button onClick={() => setIsCreating(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer" style={{ color: theme.subText }}>
                <MdClose size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: theme.subText }}>{t('sidebar.label_name', 'Label Name')}</label>
                <input
                  autoFocus
                  placeholder={t('sidebar.label_placeholder', 'e.g. Work, Personal, Receipts')}
                  value={newLabel.name}
                  onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-transparent outline-none transition-all"
                  style={{ color: theme.text, borderColor: theme.border }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: theme.subText }}>{t('sidebar.nest_under', 'Nest label under')}</label>
                <select
                  value={newLabel.parentId}
                  onChange={(e) => setNewLabel({ ...newLabel, parentId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-transparent outline-none transition-all cursor-pointer"
                  style={{ color: theme.text, borderColor: theme.border }}
                >
                  <option value="" style={{ color: "black" }}>{t('sidebar.top_level', 'Top Level (No Parent)')}</option>
                  {labels.map(l => (
                    <option key={l.id} value={l.id} style={{ color: "black" }}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.subText }}>{t('sidebar.color', 'Color')}</label>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewLabel({ ...newLabel, color: c })}
                      className={`w-6 h-6 rounded-full transition-transform hover:scale-110 cursor-pointer flex items-center justify-center`}
                      style={{
                        backgroundColor: c,
                        border: newLabel.color === c ? '2px solid white' : '2px solid transparent',
                        boxShadow: newLabel.color === c ? `0 0 0 2px ${c}` : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                style={{ color: theme.text }}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleAddLabel}
                disabled={!newLabel.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: theme.accent || "#135bec" }}
              >
                {t('sidebar.create_label', 'Create Label')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT LABEL MODAL */}
      {editingLabel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <h2 className="text-lg font-semibold" style={{ color: theme.text }}>{t('sidebar.edit_label', 'Edit Label')}</h2>
              <button onClick={() => setEditingLabel(null)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer" style={{ color: theme.subText }}>
                <MdClose size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: theme.subText }}>{t('sidebar.label_name', 'Label Name')}</label>
                <input
                  autoFocus
                  placeholder={t('sidebar.label_placeholder', 'e.g. Work, Personal, Receipts')}
                  value={editingLabel.name}
                  onChange={(e) => setEditingLabel({ ...editingLabel, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-transparent outline-none transition-all"
                  style={{ color: theme.text, borderColor: theme.border }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: theme.subText }}>{t('sidebar.nest_under', 'Nest label under')}</label>
                <select
                  value={editingLabel.parentId}
                  onChange={(e) => setEditingLabel({ ...editingLabel, parentId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-transparent outline-none transition-all cursor-pointer"
                  style={{ color: theme.text, borderColor: theme.border }}
                >
                  <option value="" style={{ color: "black" }}>{t('sidebar.top_level', 'Top Level (No Parent)')}</option>
                  {labels.filter(l => l.id !== editingLabel.id).map(l => (
                    <option key={l.id} value={l.id} style={{ color: "black" }}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.subText }}>{t('sidebar.color', 'Color')}</label>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditingLabel({ ...editingLabel, color: c })}
                      className={`w-6 h-6 rounded-full transition-transform hover:scale-110 cursor-pointer flex items-center justify-center`}
                      style={{
                        backgroundColor: c,
                        border: editingLabel.color === c ? '2px solid white' : '2px solid transparent',
                        boxShadow: editingLabel.color === c ? `0 0 0 2px ${c}` : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3">
              <button
                onClick={() => setEditingLabel(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                style={{ color: theme.text }}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleEditLabelSubmit}
                disabled={!editingLabel.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: theme.accent || "#135bec" }}
              >
                {t('sidebar.save_changes', 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SideBar;
