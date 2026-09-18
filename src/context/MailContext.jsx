import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { mailAPI, api } from '../services/api';
import { API_ENDPOINTS } from '../Data/constants';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import toast from 'react-hot-toast';

const MailContext = createContext();

export const MailProvider = ({ children }) => {
    const { user } = useAuth();
    const { emailsPerPage: limit } = useTheme();
    const [emails, setEmails] = useState([]);
    const [currentFolder, setCurrentFolder] = useState('inbox');
    const currentFolderRef = useRef('inbox');
    const pagesCache = useRef({});
    const invalidateCache = useCallback((folder) => {
        if (!folder) return;
        const folderKey = folder.toLowerCase();
        delete pagesCache.current[folderKey];
        if (user?.email) {
            sessionStorage.removeItem(`bnx_cache_${user.email}_${folderKey}_1`);
        }
    }, [user]);
    const [loading, setLoading] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState({ inbox: 0, spam: 0, trash: 0 });
    const [labels, setLabels] = useState([]);
    const [totalEmails, setTotalEmails] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        currentFolderRef.current = currentFolder;
    }, [currentFolder]);

    const fetchLabelEmails = useCallback(async (labelId, silent = false, page = 1) => {

        if (currentFolderRef.current !== `label-${labelId}`) setCurrentPage(1);
        else setCurrentPage(page);
        if (!user) return;
        if (!silent) setLoading(true);
        // Only clear if the folder actually changed to avoid flashing on auto-polling/refresh
        setEmails(prev => (currentFolderRef.current === `label-${labelId}` ? prev : []));
        setCurrentFolder(`label-${labelId}`);
        try {
            // Fetching all emails for a specific label
            // Assuming the endpoint follows the pattern /api/mail/labels/{id}
            const res = await api.get(`${API_ENDPOINTS.MAIL.LABELS}/${labelId}?page=${page}&limit=${limit}`);
            if (res.data?.success) {
                const data = res.data.data;
                setTotalEmails(data.totalCount || 0);
                const normalizedEmails = (data.emails || data || []).map(m => ({
                    ...m,
                    isRead: m.isRead !== undefined ? Boolean(m.isRead) : (m.read !== undefined ? Boolean(m.read) : false),
                    starred: m.starred ?? m.isStarred ?? false
                })).filter(m => m.folderName?.toLowerCase() !== 'trash');

                normalizedEmails.sort((a, b) => {
                    const dateA = new Date(a.date || a.receivedDate || a.sentDate || 0);
                    const dateB = new Date(b.date || b.receivedDate || b.sentDate || 0);
                    return dateB - dateA;
                });

                setEmails(normalizedEmails);
            }
        } catch (error) {
            console.error('Failed to fetch label emails:', error);
            toast.error('Failed to load labeled emails');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [user, limit]);

    const fetchEmailsSilently = useCallback(async (folder, page = 1) => {
        if (!user) return;
        const folderKey = folder.toLowerCase();
        try {
            let res;
            switch (folderKey) {
                case 'inbox': res = await mailAPI.getInbox(page, limit); break;
                case 'sent': res = await mailAPI.getSent(page, limit); break;
                case 'draft':
                case 'drafts': res = await mailAPI.getDrafts(page, limit); break;
                case 'starred': res = await mailAPI.getStarred(page, limit); break;
                case 'trash': res = await mailAPI.getTrash(page, limit); break;
                case 'spam': res = await mailAPI.getSpam(page, limit); break;
                case 'snoozed': res = await mailAPI.getSnoozed(page, limit); break;
                case 'archive': res = await mailAPI.getArchive(page, limit); break;
                case 'unread': res = await mailAPI.getUnread(page, limit); break;
                default: res = await mailAPI.getInbox(page, limit);
            }

            if (res && res.data?.success) {
                const data = res.data.data;
                let normalizedEmails = (data.emails || []).map(m => ({
                    ...m,
                    isRead: m.isRead !== undefined ? Boolean(m.isRead) : (m.read !== undefined ? Boolean(m.read) : false),
                    starred: m.starred ?? m.isStarred ?? false
                }));
                if (folderKey === 'starred') {
                    normalizedEmails = normalizedEmails.filter(m => m.folderName?.toLowerCase() !== 'trash');
                }

                if (user?.email) {
                    const loginEmail = user.email.trim().toLowerCase();
                    const isEmailMatch = (emailField, currentEmail) => {
                        if (!emailField) return false;
                        const cleanEmail = emailField.trim().toLowerCase();
                        const match = cleanEmail.match(/<([^>]+)>/);
                        const actualEmail = match ? match[1].trim().toLowerCase() : cleanEmail;
                        return actualEmail === currentEmail;
                    };

                    if (['inbox', 'all-inbox', 'allinbox'].includes(folderKey)) {
                        normalizedEmails = normalizedEmails.filter(m => {
                            const isSenderMe = isEmailMatch(m.senderEmail, loginEmail) || isEmailMatch(m.from, loginEmail);
                            const isRecipientMe = isEmailMatch(m.recipientEmail, loginEmail) || isEmailMatch(m.to, loginEmail) || isEmailMatch(m.cc, loginEmail) || isEmailMatch(m.bcc, loginEmail);
                            return !isSenderMe || isRecipientMe;
                        });
                    } else if (folderKey === 'sent') {
                        normalizedEmails = normalizedEmails.filter(m => {
                            const isSenderMe = isEmailMatch(m.senderEmail, loginEmail) || isEmailMatch(m.from, loginEmail);
                            return isSenderMe;
                        });
                    }
                }

                // Update caches
                if (!pagesCache.current[folderKey]) pagesCache.current[folderKey] = {};
                pagesCache.current[folderKey][page] = normalizedEmails;
                sessionStorage.setItem(`bnx_cache_${user.email}_${folderKey}_${page}`, JSON.stringify(normalizedEmails));

                // Only update active screen if it matches the current folder
                if (currentFolderRef.current.toLowerCase() === folderKey) {
                    setTotalEmails(data.totalCount || 0);
                    setEmails(normalizedEmails);
                    const countKey = folderKey.replace('-', '').replace(' ', '');
                    setUnreadCounts(prev => ({ ...prev, [countKey]: data.unreadCount || 0 }));
                }
            }
        } catch (e) {
            console.error(`Silent refresh failed for ${folder}:`, e);
        }
    }, [user, limit]);

    const fetchEmails = useCallback(async (folder = currentFolderRef.current, silent = false, page = 1) => {
        const folderKey = folder.toLowerCase();
        
        if (currentFolderRef.current.toLowerCase() !== folderKey) {
            setCurrentPage(1);
        } else {
            setCurrentPage(page);
        }
        
        if (!user) return;

        // 1. Check in-memory cache
        if (!silent && pagesCache.current[folderKey] && pagesCache.current[folderKey][page]) {
            setEmails(pagesCache.current[folderKey][page]);
            setCurrentFolder(folder);
            currentFolderRef.current = folder;
            fetchEmailsSilently(folder, page);
            return;
        }

        // 2. Check sessionStorage cache (cross-refresh persistence)
        const sessionCached = sessionStorage.getItem(`bnx_cache_${user.email}_${folderKey}_${page}`);
        if (!silent && sessionCached) {
            try {
                const parsed = JSON.parse(sessionCached);
                if (Array.isArray(parsed)) {
                    if (!pagesCache.current[folderKey]) pagesCache.current[folderKey] = {};
                    pagesCache.current[folderKey][page] = parsed;
                    
                    setEmails(parsed);
                    setCurrentFolder(folder);
                    currentFolderRef.current = folder;
                    fetchEmailsSilently(folder, page);
                    return;
                }
            } catch (e) {
                console.error("Failed to parse session cache", e);
            }
        }

        if (!silent) {
            setLoading(true);
        }
        
        // Clear emails if switching folders to avoid flashing stale content
        setEmails(prev => (currentFolderRef.current.toLowerCase() === folderKey ? prev : []));
        setCurrentFolder(folder);
        currentFolderRef.current = folder;

        try {
            let res;
            switch (folder.toLowerCase()) {
                case 'inbox': res = await mailAPI.getInbox(page, limit); break;
                case 'sent': res = await mailAPI.getSent(page, limit); break;
                case 'draft':
                case 'drafts': res = await mailAPI.getDrafts(page, limit); break;
                case 'starred': res = await mailAPI.getStarred(page, limit); break;
                case 'trash': res = await mailAPI.getTrash(page, limit); break;
                case 'spam': res = await mailAPI.getSpam(page, limit); break;
                case 'snoozed': res = await mailAPI.getSnoozed(page, limit); break;
                case 'archive': res = await mailAPI.getArchive(page, limit); break;
                case 'unread': res = await mailAPI.getUnread(page, limit); break;
                case 'all-inbox':
                case 'allinbox': {
                    const sessionsStr = localStorage.getItem('bnx_sessions');
                    let sessions = {};
                    try {
                        sessions = sessionsStr ? JSON.parse(sessionsStr) : {};
                    } catch (e) { }

                    const sessionKeys = Object.keys(sessions);
                    if (sessionKeys.length === 0) {
                        res = await mailAPI.getInbox(page, limit);
                        break;
                    }

                    const fetchPromises = sessionKeys.map(async (email) => {
                        const token = sessions[email].accessToken;
                        try {
                            const inboxRes = await api.get(API_ENDPOINTS.MAIL.INBOX, {
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            });
                            if (inboxRes.data?.success) {
                                const emailsList = inboxRes.data.data?.emails || [];
                                return emailsList.map(e => ({
                                    ...e,
                                    accountEmail: email
                                }));
                            }
                        } catch (err) {
                            console.error(`Failed to fetch all-inbox for ${email}:`, err);
                        }
                        return [];
                    });

                    const results = await Promise.all(fetchPromises);
                    const mergedEmails = results.flat();

                    mergedEmails.sort((a, b) => {
                        const dateA = new Date(a.date || a.receivedDate || a.sentDate || 0);
                        const dateB = new Date(b.date || b.receivedDate || b.sentDate || 0);
                        return dateB - dateA;
                    });

                    const totalUnreadCount = mergedEmails.filter(e => !e.isRead).length;

                    res = {
                        data: {
                            success: true,
                            data: {
                                emails: mergedEmails,
                                unreadCount: totalUnreadCount
                            }
                        }
                    };
                    break;
                }
                case 'all-mail':
                case 'allmail': {
                    const [inboxRes, sentRes, draftRes, archiveRes] = await Promise.all([
                        mailAPI.getInbox().catch(() => ({ data: { success: false } })),
                        mailAPI.getSent().catch(() => ({ data: { success: false } })),
                        mailAPI.getDrafts().catch(() => ({ data: { success: false } })),
                        mailAPI.getArchive().catch(() => ({ data: { success: false } }))
                    ]);

                    let mergedEmails = [];
                    if (inboxRes.data?.success && inboxRes.data.data?.emails) {
                        mergedEmails = [...mergedEmails, ...inboxRes.data.data.emails];
                    }
                    if (sentRes.data?.success && sentRes.data.data?.emails) {
                        mergedEmails = [...mergedEmails, ...sentRes.data.data.emails];
                    }
                    if (draftRes.data?.success && draftRes.data.data?.emails) {
                        mergedEmails = [...mergedEmails, ...draftRes.data.data.emails];
                    }
                    if (archiveRes.data?.success && archiveRes.data.data?.emails) {
                        mergedEmails = [...mergedEmails, ...archiveRes.data.data.emails];
                    }

                    console.log('📬 [All Mail] Inbox count:', inboxRes.data?.data?.emails?.length);
                    console.log('📬 [All Mail] Sent count:', sentRes.data?.data?.emails?.length);
                    console.log('📬 [All Mail] Draft count:', draftRes.data?.data?.emails?.length);
                    console.log('📬 [All Mail] Archive count:', archiveRes.data?.data?.emails?.length);
                    console.log('📬 [All Mail] Merged count:', mergedEmails.length);

                    // Sort descending by date
                    mergedEmails.sort((a, b) => {
                        const dateA = new Date(a.date || a.sentDate || a.receivedDate || 0);
                        const dateB = new Date(b.date || b.sentDate || b.receivedDate || 0);
                        return dateB - dateA;
                    });

                    // Deduplicate identical messages (e.g. from self-sends in Inbox and Sent)
                    const seenUids = new Set();
                    mergedEmails = mergedEmails.filter(e => {
                        const uidStr = String(e.uid || e.id || '');
                        if (!uidStr) return true;
                        if (seenUids.has(uidStr)) {
                            return false;
                        }
                        seenUids.add(uidStr);
                        return true;
                    });

                    res = {
                        data: {
                            success: true,
                            data: {
                                emails: mergedEmails,
                                unreadCount: (inboxRes.data?.success && inboxRes.data.data?.unreadCount) ? inboxRes.data.data.unreadCount : 0
                            }
                        }
                    };
                    break;
                }
                default: res = await mailAPI.getInbox(page, limit);
            }

            if (res.data?.success) {
                const data = res.data.data;
                let normalizedEmails = (data.emails || []).map(m => ({
                    ...m,
                    isRead: m.isRead !== undefined ? Boolean(m.isRead) : (m.read !== undefined ? Boolean(m.read) : false),
                    starred: m.starred ?? m.isStarred ?? false
                }));
                if (folder === 'starred') {
                    normalizedEmails = normalizedEmails.filter(m => m.folderName?.toLowerCase() !== 'trash');
                }

                // Filter logic for Inbox and Sent folders based on currently logged-in user's email ID
                const lowerFolder = folder.toLowerCase();
                if (user?.email) {
                    const loginEmail = user.email.trim().toLowerCase();
                    const isEmailMatch = (emailField, currentEmail) => {
                        if (!emailField) return false;
                        const cleanEmail = emailField.trim().toLowerCase();
                        const match = cleanEmail.match(/<([^>]+)>/);
                        const actualEmail = match ? match[1].trim().toLowerCase() : cleanEmail;
                        return actualEmail === currentEmail;
                    };

                    if (['inbox', 'all-inbox', 'allinbox'].includes(lowerFolder)) {
                        normalizedEmails = normalizedEmails.filter(m => {
                            const isSenderMe = isEmailMatch(m.senderEmail, loginEmail) || isEmailMatch(m.from, loginEmail);
                            const isRecipientMe = isEmailMatch(m.recipientEmail, loginEmail) || isEmailMatch(m.to, loginEmail) || isEmailMatch(m.cc, loginEmail) || isEmailMatch(m.bcc, loginEmail);
                            
                            // Keep if I am NOT the sender, OR if I am both the sender and the recipient (self-send)
                            return !isSenderMe || isRecipientMe;
                        });
                    } else if (lowerFolder === 'sent') {
                        normalizedEmails = normalizedEmails.filter(m => {
                            const isSenderMe = isEmailMatch(m.senderEmail, loginEmail) || isEmailMatch(m.from, loginEmail);
                            return isSenderMe;
                        });
                    }
                }
                
                // Update Cache
                if (!pagesCache.current[folderKey]) pagesCache.current[folderKey] = {};
                pagesCache.current[folderKey][page] = normalizedEmails;
                if (user?.email) {
                    sessionStorage.setItem(`bnx_cache_${user.email}_${folderKey}_${page}`, JSON.stringify(normalizedEmails));
                }
                
                // Only update state if this is still the active page
                if (currentFolderRef.current.toLowerCase() === folderKey) {
                    setTotalEmails(data.totalCount || 0);
                    setEmails(normalizedEmails);
                    const countKey = folderKey.replace('-', '').replace(' ', '');
                    setUnreadCounts(prev => ({ ...prev, [countKey]: data.unreadCount || 0 }));
                }
            }
        } catch (error) {
            console.error(`Failed to fetch ${folder}:`, error);
            toast.error(`Failed to load ${folder}`);
        } finally {
            if (!silent && currentFolderRef.current.toLowerCase() === folderKey) setLoading(false);
        }
    }, [user, limit]);

    const fetchLabels = useCallback(async () => {
        if (!user) return;
        try {
            const res = await mailAPI.getLabels();
            if (res.data?.success) {
                setLabels(res.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch labels:', error);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchLabels();
        }
    }, [user, fetchLabels]);

    // Background pre-fetching of critical folders in parallel
    useEffect(() => {
        if (user) {
            const prefetchFolders = async () => {
                const folders = ['inbox', 'sent', 'draft', 'trash', 'starred', 'spam', 'archive', 'snoozed', 'unread'];
                await Promise.all(
                    folders.map(async (folder) => {
                        const folderKey = folder.toLowerCase();
                        // Pre-fetch only if not already cached and not the active folder
                        if (
                            (!pagesCache.current[folderKey] || !pagesCache.current[folderKey][1]) &&
                            currentFolderRef.current.toLowerCase() !== folderKey
                        ) {
                            console.log(`🚀 Pre-fetching folder in background: ${folder}`);
                            try {
                                let res;
                                if (folder === 'inbox') res = await mailAPI.getInbox(1, limit);
                                else if (folder === 'sent') res = await mailAPI.getSent(1, limit);
                                else if (folder === 'draft') res = await mailAPI.getDrafts(1, limit);
                                else if (folder === 'trash') res = await mailAPI.getTrash(1, limit);
                                else if (folder === 'starred') res = await mailAPI.getStarred(1, limit);
                                else if (folder === 'spam') res = await mailAPI.getSpam(1, limit);
                                else if (folder === 'archive') res = await mailAPI.getArchive(1, limit);
                                else if (folder === 'snoozed') res = await mailAPI.getSnoozed(1, limit);
                                else if (folder === 'unread') res = await mailAPI.getUnread(1, limit);

                                if (res && res.data?.success) {
                                    const data = res.data.data;
                                    let normalized = (data.emails || []).map(m => ({
                                        ...m,
                                        isRead: m.isRead !== undefined ? Boolean(m.isRead) : (m.read !== undefined ? Boolean(m.read) : false),
                                        starred: m.starred ?? m.isStarred ?? false
                                    }));

                                    // Apply user filters to Inbox & Sent
                                    if (user?.email) {
                                        const loginEmail = user.email.trim().toLowerCase();
                                        const isEmailMatch = (emailField, currentEmail) => {
                                            if (!emailField) return false;
                                            const cleanEmail = emailField.trim().toLowerCase();
                                            const match = cleanEmail.match(/<([^>]+)>/);
                                            const actualEmail = match ? match[1].trim().toLowerCase() : cleanEmail;
                                            return actualEmail === currentEmail;
                                        };

                                        if (folder === 'inbox') {
                                            normalized = normalized.filter(m => {
                                                const isSenderMe = isEmailMatch(m.senderEmail, loginEmail) || isEmailMatch(m.from, loginEmail);
                                                const isRecipientMe = isEmailMatch(m.recipientEmail, loginEmail) || isEmailMatch(m.to, loginEmail) || isEmailMatch(m.cc, loginEmail) || isEmailMatch(m.bcc, loginEmail);
                                                return !isSenderMe || isRecipientMe;
                                            });
                                        } else if (folder === 'sent') {
                                            normalized = normalized.filter(m => {
                                                const isSenderMe = isEmailMatch(m.senderEmail, loginEmail) || isEmailMatch(m.from, loginEmail);
                                                return isSenderMe;
                                            });
                                        }
                                    }

                                    if (!pagesCache.current[folderKey]) pagesCache.current[folderKey] = {};
                                    pagesCache.current[folderKey][1] = normalized;
                                    sessionStorage.setItem(`bnx_cache_${user.email}_${folderKey}_1`, JSON.stringify(normalized));
                                }
                            } catch (e) {
                                console.error(`Failed to pre-fetch folder ${folder}:`, e);
                            }
                        }
                    })
                );
            };

            const timer = setTimeout(prefetchFolders, 3000); // 3 seconds delay
            return () => clearTimeout(timer);
        }
    }, [user, limit]);

    const handlePageChange = useCallback((newPage) => {
        if (currentFolderRef.current.startsWith('label-')) {
            const labelId = currentFolderRef.current.replace('label-', '');
            fetchLabelEmails(labelId, false, newPage);
        } else {
            fetchEmails(currentFolderRef.current, false, newPage);
        }
    }, [fetchLabelEmails, fetchEmails]);

    // Background auto-polling for new emails every 30 seconds
    useEffect(() => {
        if (!user) return;

        const interval = setInterval(() => {
            if (!document.hidden) {
                console.log('⏰ Auto-polling emails for:', currentFolderRef.current);
                if (currentFolderRef.current.startsWith('label-')) {
                    const labelId = currentFolderRef.current.replace('label-', '');
                    fetchLabelEmails(labelId, true);
                } else {
                    fetchEmails(currentFolderRef.current, true);
                }
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [user, fetchEmails, fetchLabelEmails]);

    const handleToggleStar = async (uid, folder) => {
        // Optimistic update
        setEmails(prev => {
            if (currentFolder?.toLowerCase() === 'starred') {
                return prev.filter(m => String(m.uid) !== String(uid));
            }
            return prev.map(m => String(m.uid) === String(uid) ? { ...m, starred: !m.starred } : m);
        });

        try {
            const res = await mailAPI.toggleStar(uid, folder);
            if (!res.data?.success) {
                // Rollback if failed
                if (currentFolder.startsWith('label-')) {
                    const labelId = currentFolder.replace('label-', '');
                    fetchLabelEmails(labelId);
                } else {
                    fetchEmails(currentFolder);
                }
                toast.error('Failed to update star');
            }
        } catch (error) {
            if (currentFolder.startsWith('label-')) {
                const labelId = currentFolder.replace('label-', '');
                fetchLabelEmails(labelId);
            } else {
                fetchEmails(currentFolder);
            }
            toast.error('Failed to update star');
        }
    };

    const handleMarkRead = async (uid, silent = false) => {
        try {
            await mailAPI.markRead(uid);
            setEmails(prev => prev.map(m => {
                if (String(m.uid) === String(uid) && !m.isRead) {
                    // Update unread counts locally
                    setUnreadCounts(counts => ({
                        ...counts,
                        inbox: Math.max(0, counts.inbox - 1)
                    }));
                    return { ...m, isRead: true };
                }
                return m;
            }));
        } catch (error) {
            console.error('Mark read failed:', error);
        }
    };

    const handleMarkUnread = async (uid, silent = false) => {
        try {
            await mailAPI.markUnread(uid);
            setEmails(prev => prev.map(m => String(m.uid) === String(uid) ? { ...m, isRead: false } : m));
            setUnreadCounts(counts => ({
                ...counts,
                inbox: (counts.inbox || 0) + 1
            }));
            invalidateCache('unread');
            if (currentFolderRef.current) {
                invalidateCache(currentFolderRef.current);
            }
            if (currentFolderRef.current?.toLowerCase() === 'unread') {
                fetchEmails('unread', true);
            }
        } catch (error) {
            console.error('Mark unread failed:', error);
        }
    };

    const handleMoveToTrash = async (uid, folder, silent = false) => {
        try {
            await mailAPI.trash(uid, folder);
            setEmails(prev => prev.filter(m => String(m.uid) !== String(uid)));
            invalidateCache('trash');
            if (folder) invalidateCache(folder);
            if (!silent) toast.success('Moved to trash');
        } catch (error) {
            if (!silent) toast.error('Failed to move to trash');
        }
    };

    const handleDeletePermanently = async (uid, silent = false) => {
        try {
            await mailAPI.permanentDelete(uid);
            setEmails(prev => prev.filter(m => String(m.uid) !== String(uid)));
            invalidateCache('trash');
            if (currentFolder) invalidateCache(currentFolder);
            if (!silent) toast.success('Permanently deleted');
        } catch (error) {
            if (!silent) toast.error('Failed to delete permanently');
        }
    };

    const handleSnooze = async (uid, wakeUpAt, folder = 'INBOX', silent = false) => {
        try {
            await mailAPI.snooze(uid, wakeUpAt, folder);
            setEmails(prev => prev.filter(m => String(m.uid) !== String(uid)));
            if (!silent) toast.success('Snoozed email');
        } catch (error) {
            if (!silent) toast.error('Failed to snooze');
        }
    };

    const handleCreateLabel = async (name, colorHex, parentId = null) => {
        try {
            const res = await mailAPI.createLabel({ name, colorHex, parentId });
            if (res.data?.success) {
                toast.success('Label created');
                fetchLabels();
                return res.data.data;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create label');
        }
    };

    const handleUpdateLabel = async (id, name, colorHex, parentId = null) => {
        try {
            const res = await mailAPI.updateLabel(id, { name, colorHex, parentId });
            if (res.data.success) {
                toast.success('Label updated');
                fetchLabels();
                return true;
            }
        } catch (error) {
            console.error('Update label error:', error);
        }
        return false;
    };

    const handleDeleteLabel = async (labelId) => {
        try {
            const res = await mailAPI.deleteLabel(labelId);
            if (res.data?.success) {
                toast.success('Label deleted');
                fetchLabels();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete label');
        }
    };

    const handleApplyLabel = async (uid, labelId, folder = currentFolder, silent = false) => {
        try {
            await mailAPI.applyLabel(uid, labelId, folder);
            if (!silent) toast.success('Label applied');
            if (currentFolder.startsWith('label-')) {
                const currentLabelId = currentFolder.replace('label-', '');
                fetchLabelEmails(currentLabelId);
            } else {
                fetchEmails(currentFolder);
            }
        } catch (error) {
            if (!silent) toast.error('Failed to apply label');
        }
    };

    const handleRemoveLabel = async (uid, labelId, folder = currentFolder, silent = false) => {
        try {
            await mailAPI.removeLabel(uid, labelId, folder);
            if (!silent) toast.success('Label removed');
            if (currentFolder === `label-${labelId}`) {
                setEmails(prev => prev.filter(m => String(m.uid) !== String(uid)));
            } else {
                setEmails(prev => prev.map(m => String(m.uid) === String(uid) ? { ...m, labels: m.labels?.filter(l => l.id !== labelId) } : m));
            }
        } catch (error) {
            if (!silent) toast.error('Failed to remove label');
        }
    };

    const handleArchive = async (uid, folder, silent = false) => {
        try {
            await mailAPI.archive(uid, folder);
            if (currentFolder === 'inbox') {
                setEmails(prev => prev.filter(m => String(m.uid) !== String(uid)));
            } else {
                setEmails(prev => prev.map(m => String(m.uid) === String(uid) ? { ...m, folderName: 'Archive' } : m));
            }
            // Invalidate cache
            if (folder) invalidateCache(folder);
            invalidateCache('archive');
            if (!silent) toast.success('Email archived');
        } catch (error) {
            console.error('Failed to archive:', error);
            if (!silent) toast.error('Failed to archive email');
        }
    };

    const handleUnarchive = async (uid, silent = false) => {
        try {
            await mailAPI.unarchive(uid);
            if (currentFolder === 'archive') {
                setEmails(prev => prev.filter(m => String(m.uid) !== String(uid)));
            } else {
                setEmails(prev => prev.map(m => String(m.uid) === String(uid) ? { ...m, folderName: 'INBOX' } : m));
            }
            // Invalidate cache
            invalidateCache('archive');
            invalidateCache('inbox');
            if (!silent) toast.success('Email restored');
        } catch (error) {
            console.error('Failed to unarchive:', error);
            if (!silent) toast.error('Failed to unarchive email');
        }
    };

    const handleMarkSpam = async (uid, folder = currentFolder, silent = false) => {
        try {
            await mailAPI.markSpam(uid, folder);
            setEmails(prev => prev.filter(m => String(m.uid) !== String(uid)));
            if (!silent) toast.success('Reported as spam');
        } catch (error) {
            if (!silent) toast.error('Failed to report spam');
        }
    };

    const handleRestoreSpam = async (uid, silent = false) => {
        try {
            await mailAPI.restoreSpam(uid);
            setEmails(prev => prev.filter(m => String(m.uid) !== String(uid)));
            if (!silent) toast.success('Restored from spam');
        } catch (error) {
            if (!silent) toast.error('Failed to restore from spam');
        }
    };

    const handleUnsubscribe = async (senderEmail, silent = false) => {
        try {
            await blockedContactsAPI.blockSender(senderEmail);
            if (!silent) toast.success('Unsubscribed from ' + senderEmail);
        } catch (error) {
            if (!silent) toast.error('Failed to unsubscribe');
        }
    };

    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [isComposeMinimized, setIsComposeMinimized] = useState(false);
    const [isComposeMaximized, setIsComposeMaximized] = useState(false);
    const [composeData, setComposeData] = useState(null);

    const openCompose = useCallback((data = null) => {
        if (data && data.replyTo) {
            const match = data.replyTo.match(/<([^>]+)>/);
            if (match) {
                data.replyTo = match[1];
            }
        }
        setComposeData(data);
        setIsComposeOpen(true);
        setIsComposeMinimized(false);
        setIsComposeMaximized(false);
    }, []);

    const closeCompose = useCallback(() => {
        setIsComposeOpen(false);
        setComposeData(null);
    }, []);

    return (
        <MailContext.Provider value={{
            emails,
            loading,
            currentFolder,
            setCurrentFolder,
            unreadCounts,
            labels,
            fetchEmails,
            fetchLabels,
            fetchLabelEmails,
            handleToggleStar,
            handleMarkRead,
            handleMarkUnread,
            totalEmails,
            currentPage,
            handlePageChange,
            handleMoveToTrash,
            handleDeletePermanently,
            handleSnooze,
            handleCreateLabel,
            handleUpdateLabel,
            handleApplyLabel,
            handleRemoveLabel,
            handleArchive,
            handleUnarchive,
            handleMarkSpam,
            handleRestoreSpam,
            handleUnsubscribe,
            handleDeleteLabel,
            isComposeOpen,
            setIsComposeOpen,
            isComposeMinimized,
            setIsComposeMinimized,
            isComposeMaximized,
            setIsComposeMaximized,
            composeData,
            setComposeData,
            openCompose,
            closeCompose
        }}>
            {children}
        </MailContext.Provider>
    );
};

export default MailProvider;
export const useMail = () => useContext(MailContext);
