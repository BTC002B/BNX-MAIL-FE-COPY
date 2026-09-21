import { useTranslation } from "../context/LanguageContext";
import React, { useEffect, useState } from "react";
import { useMail } from "../context/MailContext";
import { MdDelete } from "react-icons/md";
import EmailList from "../components/EmailList";
import EmailDetails from "../components/EmailDetails";
import { useTheme } from "../context/ThemeContext";
import { mailAPI } from "../services/api";
import toast from "react-hot-toast";

import BulkActionsToolbar from "../components/BulkActionsToolbar";
import ReadingPaneLayout from "../components/ReadingPaneLayout";

const Trash = ({ searchQuery }) => {
  const { t } = useTranslation();
  const { theme, readingPaneMode } = useTheme();
  const { emails, loading, fetchEmails, handleDeletePermanently } = useMail();
  const [selectedEmail, setSelectedEmail] = useState(null);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const handleToggleSelect = (uid) => {
    const strUid = String(uid);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(strUid)) next.delete(strUid);
      else next.add(strUid);
      return next;
    });
  };



  useEffect(() => {
    fetchEmails('trash');
  }, [fetchEmails]);

  const visibleEmails = emails.filter(
    (e) =>
      !searchQuery ||
      e.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.senderEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.to?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.recipientEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.textPlain?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
  };

  const handlePermanentDelete = async (uid) => {
    await handleDeletePermanently(uid);
    setSelectedEmail(null);
  };

  const handleRestore = async (uid) => {
    try {
      await mailAPI.restore(uid);
      toast.success("Email restored");
      fetchEmails('trash', true);
      setSelectedEmail(null);
    } catch (error) {
      toast.error("Failed to restore email");
    }
  };

  /* ---------------- MAIN UI ---------------- */
  
  const detailsComponent = selectedEmail ? (
<div className="h-full flex flex-col overflow-hidden">
          {/* TRASH QUICK ACTIONS */}
          <div className="p-3 border-b flex gap-3 shrink-0" style={{ borderColor: theme.border }}>
            <button
              onClick={() => setSelectedEmail(null)}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 cursor-pointer"
              title="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <button
              onClick={() => handleRestore(selectedEmail.uid)}
              className="px-4 py-1.5 text-xs font-semibold rounded-full bg-green-600 text-white hover:bg-green-700 transition-all cursor-pointer shadow-sm hover:shadow"
            >
              Restore
            </button>
            <button
              onClick={() => handlePermanentDelete(selectedEmail.uid)}
              className="px-4 py-1.5 text-xs font-semibold rounded-full bg-red-600 text-white hover:bg-red-700 transition-all cursor-pointer shadow-sm hover:shadow"
            >
              Delete Permanently
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <EmailDetails
      emailList={visibleEmails}
      onNavigate={(email) => setSelectedEmail(email)}
              email={selectedEmail}
              onBack={() => setSelectedEmail(null)}
              onDelete={handlePermanentDelete}
            />
          </div>
        </div>
  ) : null;

  const headerComponent = selectedIds.size > 0 ? (

            <BulkActionsToolbar
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              visibleEmails={visibleEmails}
              folder="trash"
            />
          
  ) : (

            <div
              className="p-4 sm:p-5 border-b flex justify-between items-center shrink-0 bg-transparent"
              style={{ borderColor: theme.border }}
            >
              <h2
                className="text-base font-bold flex items-center gap-2"
                style={{ color: theme.text }}
              >
                <MdDelete size={20} className="text-gray-500" /> Trash
                <span
                  className="ml-2 text-xs font-normal"
                  style={{ color: theme.subText }}
                >
                  ({emails.length})
                </span>
              </h2>
            </div>
          
  );

  const listComponent = (
    <div className="flex-1 flex flex-col overflow-hidden">
{emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                <MdDelete size={52} className="text-gray-300 dark:text-gray-600 mb-4 opacity-50" />
                <p
                  className="text-base font-semibold mb-1"
                  style={{ color: theme.text }}
                >
                  Trash is empty
                </p>
              </div>
            ) : (
              <EmailList
                emails={visibleEmails}
                selectedEmailId={selectedEmail?.uid}
                onSelectEmail={handleSelectEmail}
                onDelete={handlePermanentDelete}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
              />
            )}
    </div>
  );

  return (
    <ReadingPaneLayout
      mode={readingPaneMode || 'no_split'}
      hasSelection={!!selectedEmail}
      listComponent={listComponent}
      detailsComponent={detailsComponent}
      headerComponent={headerComponent}
    />
  );

};

export default Trash;
