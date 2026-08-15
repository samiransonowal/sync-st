/**
 * ============================================================================
 * STUDIO TUNNEL / CINELOOM POSTWORKS PVT. LTD.
 * FILE 5: 5_DiscordNotifier.gs
 * ============================================================================
 * 
 * 💡 NOOB / ARTIST GUIDE:
 * This script posts rich notification embed cards directly to Discord
 * whenever an invoice is generated or sent!
 */

// Paste your Discord Webhook URL here (or store in Script Properties)
const DISCORD_WEBHOOK_URL = '';

/**
 * Sends a rich Discord embed card when an invoice is generated.
 * 
 * @param {Object} data - Invoice Dataset from getInvoiceData()
 * @param {string} pdfUrl - Google Drive URL of the generated PDF
 */
function sendDiscordInvoiceNotification(data, pdfUrl) {
  if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.trim() === '') {
    Logger.log('Discord Webhook URL not set. Skipping Discord notification.');
    return;
  }

  const payload = {
    username: 'Studio Tunnel Comptroller',
    avatar_url: 'https://studiotunnel.com/logo.png', // Optional logo URL
    embeds: [
      {
        title: \📄 Tax Invoice #\ Generated\,
        color: 34616, // Studio Tunnel Brand Green (#008738 in decimal)
        fields: [
          { name: '🏢 Client Name', value: data.client.name, inline: true },
          { name: '📅 Date', value: data.inv.date, inline: true },
          { name: '💰 Grand Total', value: \₹ \\, inline: true },
          { name: '📝 Items Included', value: data.items.map(i => \• \ (\ \)\).join('\\n') || 'None', inline: false },
          { name: '📧 Client Email', value: data.client.email || 'Not provided', inline: true },
          { name: '📍 Place of Supply', value: data.inv.placeOfSupply, inline: true }
        ],
        description: \[👉 Click Here to Open PDF in Google Drive](\)\,
        footer: {
          text: 'Cineloom Postworks Pvt. Ltd. • Automated Invoice System'
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, options);
    Logger.log('Discord Notification Sent. Response: ' + response.getContentText());
  } catch (e) {
    Logger.log('Error sending Discord notification: ' + e.toString());
  }
}

