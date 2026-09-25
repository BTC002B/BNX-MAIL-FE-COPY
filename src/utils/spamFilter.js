/**
 * Utility functions for deduplicating emails in the Spam display.
 * FRONTEND-ONLY filtering:
 * 1. Checks strongest unique identifiers (messageId, message-id, uid, id, emailId, mailId).
 * 2. Does NOT consider emails duplicates simply because they have the same subject.
 * 3. Falls back to a safe combination of (sender + recipient + subject + content + timestamp)
 *    only when reliable unique IDs are genuinely absent.
 */

/**
 * Extracts the strongest available unique identifier from an email object.
 * Priority:
 * 1. RFC Message-ID headers (messageId, message-id, message-ID, message_id)
 * 2. Explicit entity IDs (uid, id, emailId, mailId)
 * Returns a prefixed string identifier (e.g., 'msgid:<...>' or 'id:101'), or null if unavailable.
 */
export const getEmailUniqueId = (email) => {
  if (!email || typeof email !== 'object') return null;

  // 1. Message-ID candidates (strongest standard unique identifier in email protocol)
  const messageIdCandidates = [
    email.messageId,
    email['message-id'],
    email['message-ID'],
    email.message_id
  ];
  for (const candidate of messageIdCandidates) {
    if (candidate !== undefined && candidate !== null) {
      const trimmed = String(candidate).trim();
      if (trimmed !== '') {
        return `msgid:${trimmed}`;
      }
    }
  }

  // 2. Direct entity ID candidates from API / data models (uid, id, emailId, mailId)
  const idCandidates = [
    email.uid,
    email.id,
    email.emailId,
    email.mailId
  ];
  for (const candidate of idCandidates) {
    if (candidate !== undefined && candidate !== null) {
      const trimmed = String(candidate).trim();
      if (trimmed !== '') {
        return `id:${trimmed}`;
      }
    }
  }

  return null;
};

/**
 * Fallback duplicate detection when a reliable unique ID is genuinely unavailable.
 * Inspects existing data structure and uses a safe combination of:
 * sender + recipient + subject + message/content + timestamp
 */
export const getFallbackKey = (email) => {
  if (!email || typeof email !== 'object') return null;

  const sender = (email.senderEmail || email.from || '').trim().toLowerCase();
  const recipient = (email.recipientEmail || email.to || '').trim().toLowerCase();
  const subject = (email.subject || '').trim();
  const content = (email.body || email.htmlBody || email.textPlain || '').trim();
  const timestamp = (email.sentDate || email.receivedDate || email.date || '').toString().trim();

  // If all fields are completely blank, return null to avoid false duplicates
  if (!sender && !recipient && !subject && !content && !timestamp) {
    return null;
  }

  return `fallback:${sender}|${recipient}|${subject}|${content}|${timestamp}`;
};

/**
 * Determines the unique deduplication key for an email in Spam.
 * Strictly avoids using subject alone.
 */
export const getSpamEmailDedupKey = (email) => {
  const uniqueId = getEmailUniqueId(email);
  if (uniqueId) {
    return uniqueId;
  }
  return getFallbackKey(email);
};

/**
 * Filters out duplicate spam email objects, keeping the first occurrence.
 * Operates in O(N) time with Set for optimal frontend performance.
 *
 * @param {Array} emails - Array of email objects
 * @returns {Array} Deduplicated array of email objects
 */
export const filterDuplicateSpamEmails = (emails) => {
  if (!Array.isArray(emails) || emails.length <= 1) {
    return emails || [];
  }

  const seenKeys = new Set();
  const uniqueEmails = [];

  for (const email of emails) {
    if (!email) continue;
    const key = getSpamEmailDedupKey(email);
    if (!key) {
      // If no reliable key can be built, preserve the email so we don't hide legitimate emails
      uniqueEmails.push(email);
      continue;
    }
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueEmails.push(email);
    }
  }

  return uniqueEmails;
};
