/**
 * ============================================================================
 * STUDIO TUNNEL / CINELOOM POSTWORKS PVT. LTD.
 * FILE 1: 1_Utils.gs
 * ============================================================================
 * 
 * 💡 NOOB / ARTIST GUIDE:
 * Helper utility functions like converting numbers to Indian Rupees in words.
 */

/**
 * Converts any number (e.g. 90860.00) into Indian Currency Words:
 * 'Ninety Thousand Eight Hundred Sixty Rupees only'
 * 
 * @param {number} num - The number to convert
 * @returns {string} Currency in words
 */
function numberToIndianWords(num) {
  if (num === null || num === undefined || isNaN(num) || num === 0) return 'Zero Rupees only';
  
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
             'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertGroup(n) {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    } else if (n > 0) {
      str += a[n];
    }
    return str.trim();
  }

  const rounded = Math.round(num * 100) / 100;
  let rupees = Math.floor(rounded);
  let paise = Math.round((rounded - rupees) * 100);

  let result = '';

  if (rupees >= 10000000) { // Crores
    const cr = Math.floor(rupees / 10000000);
    result += convertGroup(cr) + ' Crore ';
    rupees %= 10000000;
  }
  if (rupees >= 100000) { // Lakhs
    const lakh = Math.floor(rupees / 100000);
    result += convertGroup(lakh) + ' Lakh ';
    rupees %= 100000;
  }
  if (rupees >= 1000) { // Thousands
    const th = Math.floor(rupees / 1000);
    result += convertGroup(th) + ' Thousand ';
    rupees %= 1000;
  }
  if (rupees > 0) {
    result += convertGroup(rupees);
  }

  result = result.trim() + ' Rupees';

  if (paise > 0) {
    result += ' and ' + convertGroup(paise) + ' Paise';
  }

  return result + ' only';
}

