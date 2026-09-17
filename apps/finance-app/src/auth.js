// Comptroller Access Control List (ACL)
// Strictly authorized: Yash Soni (CEO), Samiran Sonowal (COO), Line Producers (Altamash, Prakash), Accounts / Finance

export const COMPTROLLER_AUTHORIZED_EMAILS = [
  // Executive Leadership
  'yash@studiotunnel.com',
  'samiran@studiotunnel.com',
  'samiransonowal@gmail.com',
  'samiransnwl@gmail.com',
  'contact@studiotunnel.com',
  'lab@studiotunnel.com',
  'natasha.cineloom@gmail.com',
  'natasha@studiotunnel.com',

  // Line Producers
  'ansarialtamash04@gmail.com',
  'tamashansari4@gmail.com',
  'tamash@studiotunnel.com',
  'prakash@studiotunnel.com',
  'prakashjai.tunnel@gmail.com',

  // Accounts & Finance
  'accounts@studiotunnel.com',
  'finance@studiotunnel.com'
];

export const COMPTROLLER_AUTHORIZED_USER_IDS = [
  'u1',   // Yash Soni
  'u3',   // Samiran Sonowal
  'u11',  // Altamash Ansari
  'u0_b', // Prakash Jaiswal
  'u13',  // Natasha Dodiya
  'accounts'
];

export const resolveEmailForAuth = (input) => {
  if (!input) return '';
  const trimmed = input.trim().toLowerCase();
  if (trimmed.includes('@')) return trimmed;

  const aliases = {
    'samiran': 'samiran@studiotunnel.com',
    'samiransonowal': 'samiran@studiotunnel.com',
    'u3': 'samiran@studiotunnel.com',
    'yash': 'yash@studiotunnel.com',
    'yashsoni': 'yash@studiotunnel.com',
    'u1': 'yash@studiotunnel.com',
    'tamash': 'tamash@studiotunnel.com',
    'altamash': 'ansarialtamash04@gmail.com',
    'u11': 'tamash@studiotunnel.com',
    'prakash': 'prakash@studiotunnel.com',
    'u0_b': 'prakash@studiotunnel.com',
    'natasha': 'natasha.cineloom@gmail.com',
    'natashadodiya': 'natasha.cineloom@gmail.com',
    'u13': 'natasha.cineloom@gmail.com',
    'accounts': 'accounts@studiotunnel.com',
    'finance': 'finance@studiotunnel.com'
  };

  return aliases[trimmed] || `${trimmed}@studiotunnel.com`;
};

export const isUserAuthorizedForComptroller = (user, userProfile) => {
  if (!user && !userProfile) return false;

  const email = (user?.email || userProfile?.email || '').toLowerCase().trim();
  const userId = userProfile?.id || '';
  const role = (userProfile?.role || '').toLowerCase();

  // Check email match
  if (email && COMPTROLLER_AUTHORIZED_EMAILS.some(e => e.toLowerCase() === email)) {
    return true;
  }

  // Check user ID match
  if (userId && COMPTROLLER_AUTHORIZED_USER_IDS.includes(userId)) {
    return true;
  }

  // Check role match
  if (
    role.includes('ceo') ||
    role.includes('coo') ||
    role.includes('line producer') ||
    role.includes('admin') ||
    role.includes('accounts') ||
    role.includes('finance')
  ) {
    return true;
  }

  return false;
};
