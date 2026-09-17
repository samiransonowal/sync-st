import partiesData from '../data/parties_database.js';

function normalizeKey(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Find party in master database by name or search string
 */
export function findParty(nameOrQuery) {
  if (!nameOrQuery) return null;
  const key = normalizeKey(nameOrQuery);
  if (!key) return null;

  // Exact key match
  if (partiesData.byKey && partiesData.byKey[key]) {
    return partiesData.byKey[key];
  }

  // Fuzzy / substring match in list
  const list = partiesData.list || [];
  const found = list.find(p => {
    const pKey = normalizeKey(p.name);
    return pKey === key || pKey.includes(key) || key.includes(pKey);
  });

  return found || null;
}

/**
 * Return all parties for autocomplete / dropdown
 */
export function getAllParties() {
  return partiesData.list || [];
}

/**
 * Resolve client details for an invoice
 * Merges invoice attributes with party master database fallbacks
 */
export function resolveInvoiceClientDetails(invoice = {}) {
  const customerName = (invoice.customer_name || invoice.client_name || invoice.party_name || invoice.billed_to || '').trim();
  const party = findParty(customerName);

  const billingAddress = invoice.billing_address || invoice.address || party?.address || '';
  const gstin = invoice.client_gstin || invoice.gstin || party?.gstin || '';
  const pan = invoice.pan || party?.pan || (gstin && gstin.length === 15 ? gstin.substring(2, 12) : '');
  const phone = invoice.phone || invoice.party_phone || party?.phone || '';
  const email = invoice.email || party?.email || '';
  const state = invoice.state_of_supply || invoice.state || party?.state || (gstin && gstin.length >= 2 ? getStateFromCode(gstin.substring(0, 2)) : '');

  return {
    name: customerName || party?.name || 'Valued Client',
    address: billingAddress,
    gstin: gstin,
    pan: pan,
    phone: phone,
    email: email,
    state: state
  };
}

const STATE_CODES = {
  '01': '01-Jammu & Kashmir',
  '02': '02-Himachal Pradesh',
  '03': '03-Punjab',
  '04': '04-Chandigarh',
  '06': '06-Haryana',
  '07': '07-Delhi',
  '08': '08-Rajasthan',
  '09': '09-Uttar Pradesh',
  '10': '10-Bihar',
  '19': '19-West Bengal',
  '24': '24-Gujarat',
  '27': '27-Maharashtra',
  '29': '29-Karnataka',
  '32': '32-Kerala',
  '33': '33-Tamil Nadu',
  '36': '36-Telangana',
  '37': '37-Andhra Pradesh'
};

function getStateFromCode(code) {
  return STATE_CODES[code] || '';
}
