/**
 * 🔔 Studio Tunnel — ntfy.sh Push Notification Engine
 * 
 * Provides instantaneous lock-screen push notifications to iOS and Android devices
 * without requiring custom APNs or FCM certificates.
 */

export const NTFY_TOPICS = {
  OPS: 'studio-tunnel-ops',
  QC: 'studio-tunnel-qc',
  ALERTS: 'studio-tunnel-alerts',
  TEAM: 'studio-tunnel-team',
  MASTER: 'studio-tunnel-samiran',
};

/**
 * Resolves a clean ntfy topic name for any user ID or object.
 */
export const getUserNtfyTopic = (userOrId) => {
  if (!userOrId) return null;
  const id = typeof userOrId === 'object' ? userOrId.id : String(userOrId);
  return `studio-tunnel-${id.toLowerCase()}`;
};

/**
 * Synthesizes a gentle high-frequency audio ping using Web Audio API.
 */
export const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12); // A6 note

    gain.setValueAtTime(0, ctx.currentTime);
    gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.04);
    gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // AudioContext blocked or not supported — safe to ignore
  }
};

/**
 * Dispatches an instant push notification via ntfy.sh
 * 
 * @param {Object} params
 * @param {string|string[]} [params.topic] - Target topic or array of topics
 * @param {string} [params.userId] - Target User ID (auto-mapped to studio-tunnel-<userId>)
 * @param {string} params.title - Notification title
 * @param {string} params.message - Body text
 * @param {string} [params.clickUrl] - URL opened on notification click
 * @param {string} [params.priority] - 'min', 'low', 'default', 'high', 'urgent' (default: 'high')
 * @param {string|string[]} [params.tags] - Comma-separated or array of tags/emojis (e.g. 'bell', 'clapper')
 * @param {string} [params.actions] - Action button spec (e.g. 'view, Open Web App, https://sync.studiotunnel.com')
 */
export const sendNtfyNotification = async ({
  topic,
  topics = [],
  userId,
  title = 'Studio Tunnel',
  message = 'New notification received.',
  clickUrl = 'https://sync.studiotunnel.com',
  priority = 'high',
  tags = 'bell',
  actions
}) => {
  const targetTopics = new Set();

  if (topic) {
    if (Array.isArray(topic)) topic.forEach(t => t && targetTopics.add(t));
    else targetTopics.add(topic);
  }

  if (Array.isArray(topics)) {
    topics.forEach(t => t && targetTopics.add(t));
  }

  if (userId) {
    const userTopic = getUserNtfyTopic(userId);
    if (userTopic) targetTopics.add(userTopic);

    // Also copy Samiran's alias topic if relevant
    const idStr = String(userId).toLowerCase();
    if (idStr === 'u3' || idStr.includes('samiran')) {
      targetTopics.add(NTFY_TOPICS.MASTER);
    }
  }

  // Fallback to Ops topic if no specific destination was specified
  if (targetTopics.size === 0) {
    targetTopics.add(NTFY_TOPICS.OPS);
  }

  const tagsHeader = Array.isArray(tags) ? tags.join(',') : tags;
  const click = clickUrl || 'https://sync.studiotunnel.com';

  // Play browser chime
  playNotificationChime();

  // Send to all targets in parallel
  const promises = Array.from(targetTopics).map(async (t) => {
    try {
      const headers = {
        'Title': title,
        'Priority': priority,
        'Tags': tagsHeader,
        'Click': click,
      };

      if (actions) {
        headers['Actions'] = actions;
      }

      const res = await fetch(`https://ntfy.sh/${t}`, {
        method: 'POST',
        headers,
        body: message,
      });

      if (!res.ok) {
        console.warn(`ntfy push to ${t} returned status ${res.status}`);
      }
      return { topic: t, success: res.ok };
    } catch (err) {
      console.warn(`ntfy fetch failed for topic ${t}:`, err);
      return { topic: t, success: false, error: err };
    }
  });

  return Promise.all(promises);
};

/**
 * Convenience helper: Send direct notification to a specific team member
 */
export const sendDirectUserAlert = (userId, title, message, extra = {}) => {
  return sendNtfyNotification({
    userId,
    title,
    message,
    tags: extra.tags || 'bell,point_right',
    priority: extra.priority || 'high',
    ...extra
  });
};

/**
 * Convenience helper: Send notification to Line Producers for QC and Work Submissions
 */
export const sendQcAlert = (title, message, extra = {}) => {
  return sendNtfyNotification({
    topics: [
      NTFY_TOPICS.QC,
      'studio-tunnel-u0_b', // Prakash
      'studio-tunnel-u11',  // Tamash
      'studio-tunnel-u3',   // Samiran
      NTFY_TOPICS.MASTER
    ],
    title,
    message,
    tags: extra.tags || 'clapper,mag,package',
    priority: 'urgent',
    ...extra
  });
};

/**
 * Convenience helper: Send notification for Studio Bookings & Operations
 */
export const sendOpsAlert = (title, message, extra = {}) => {
  return sendNtfyNotification({
    topic: NTFY_TOPICS.OPS,
    title,
    message,
    tags: extra.tags || 'calendar,studio,video_camera',
    priority: extra.priority || 'high',
    ...extra
  });
};

/**
 * Convenience helper: Send Team Chat alerts (general team topic + any directly mentioned users)
 */
export const sendTeamChatAlert = (senderName, messageText, mentionedUserIds = []) => {
  const topics = [NTFY_TOPICS.TEAM];
  if (Array.isArray(mentionedUserIds)) {
    mentionedUserIds.forEach(uid => {
      const ut = getUserNtfyTopic(uid);
      if (ut) topics.push(ut);
    });
  }

  return sendNtfyNotification({
    topics,
    title: `💬 ${senderName} in Team Chat`,
    message: messageText.length > 120 ? `${messageText.slice(0, 120)}...` : messageText,
    tags: 'speech_balloon,speech_balloon',
    priority: 'default',
  });
};
