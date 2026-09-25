/**
 * Deduplicates Spam email objects based on their existing unique identifier.
 * Priority:
 * 1. Standard RFC Message-ID (messageId, message-id, message-ID)
 * 2. Existing unique entity IDs (id, uid, emailId, mailId)
 * 3. Safe fallback (sender + recipient + subject + content + timestamp)
 *    only when reliable unique IDs are genuinely absent.
 * 
 * Does NOT consider emails duplicates based on subject alone.
 */
export const getSpamEmailUniqueKey = (email) => {
  if (!email || typeof email !== 'object') return null;

  // 1. Message-ID candidates (standard RFC email unique identifier)
  const msgId = email.messageId || email['message-id'] || email['message-ID'];
  if (msgId !== undefined && msgId !== null && String(msgId).trim() !== '') {
    return `msgid:${String(msgId).trim()}`;
  }

  // 2. Reliable fallback when Message-ID is absent:
  // Combines sender, recipient, timestamp, subject, and content.
  // Note: NEVER deduplicates on subject alone!
  const sender = (email.senderEmail || email.from || '').trim().toLowerCase();
  const recipient = (email.recipientEmail || email.to || '').trim().toLowerCase();
  const subject = (email.subject || '').trim();
  const content = (email.body || email.htmlBody || email.textPlain || '').trim();
  const timestamp = (email.sentDate || email.receivedDate || email.date || '').toString().trim();

  if (sender && (content || timestamp)) {
    return `fallback:${sender}|${recipient}|${timestamp}|${subject}|${content.slice(0, 150)}`;
  }

  // 3. Existing entity IDs only as last resort
  const idCandidates = [email.id, email.emailId, email.mailId, email.uid];
  for (const id of idCandidates) {
    if (id !== undefined && id !== null && String(id).trim() !== '') {
      return `id:${String(id).trim()}`;
    }
  }

  return null;
};

/**
 * Filters out duplicate spam email objects, keeping only one copy.
 * Operates in O(N) using a Set for optimal frontend performance.
 *
 * @param {Array} emails - Array of email objects
 * @returns {Array} Deduplicated array of email objects
 */
export const filterDuplicateSpamEmails = (emails) => {
  if (!Array.isArray(emails) || emails.length <= 1) {
    return emails || [];
  }

  const seen = new Set();
  const result = [];

  for (const email of emails) {
    if (!email) continue;
    const key = getSpamEmailUniqueKey(email);
    if (!key) {
      result.push(email);
      continue;
    }
    if (!seen.has(key)) {
      seen.add(key);
      result.push(email);
    }
  }

  return result;
};
