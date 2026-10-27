/**
 * Converts numbers into French and Arabic currency text for Algerian Dinars (DZD).
 */

const frenchUnits = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
const frenchTeens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const frenchTens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];

function convertHundredsFrench(n: number): string {
  let str = '';
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;

  if (hundreds > 0) {
    if (hundreds === 1) {
      str += 'cent';
    } else {
      str += frenchUnits[hundreds] + ' cent';
      if (remainder === 0) str += 's';
    }
    if (remainder > 0) str += ' ';
  }

  if (remainder > 0) {
    if (remainder < 10) {
      str += frenchUnits[remainder];
    } else if (remainder < 20) {
      str += frenchTeens[remainder - 10];
    } else {
      const ten = Math.floor(remainder / 10);
      const unit = remainder % 10;
      if (ten === 7) {
        str += 'soixante-' + (unit === 1 ? 'et-onze' : frenchTeens[unit]);
      } else if (ten === 9) {
        str += 'quatre-vingt-' + frenchTeens[unit];
      } else {
        str += frenchTens[ten];
        if (unit === 1) {
          str += ' et un';
        } else if (unit > 1) {
          str += '-' + frenchUnits[unit];
        }
      }
    }
  }

  return str.trim();
}

export function numberToFrenchWords(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zéro Dinar Algérien';
  if (rounded < 0) return 'Moins ' + numberToFrenchWords(-rounded);

  const millions = Math.floor(rounded / 1000000);
  const thousands = Math.floor((rounded % 1000000) / 1000);
  const remainder = rounded % 1000;

  const parts: string[] = [];

  if (millions > 0) {
    if (millions === 1) {
      parts.push('un million');
    } else {
      parts.push(convertHundredsFrench(millions) + ' millions');
    }
  }

  if (thousands > 0) {
    if (thousands === 1) {
      parts.push('mille');
    } else {
      parts.push(convertHundredsFrench(thousands) + ' mille');
    }
  }

  if (remainder > 0) {
    parts.push(convertHundredsFrench(remainder));
  }

  const result = parts.join(' ');
  // Capitalize first letter
  const formatted = result.charAt(0).toUpperCase() + result.slice(1);
  return formatted + ' Dinars Algériens';
}

// Arabic number converter
const arabicUnits = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
const arabicTens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const arabicHundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

function convertUnderThousandArabic(n: number): string {
  const h = Math.floor(n / 100);
  const remainder = n % 100;
  const parts: string[] = [];

  if (h > 0) {
    parts.push(arabicHundreds[h]);
  }

  if (remainder > 0) {
    if (remainder <= 10) {
      parts.push(arabicUnits[remainder]);
    } else if (remainder === 11) {
      parts.push('أحد عشر');
    } else if (remainder === 12) {
      parts.push('اثنا عشر');
    } else if (remainder < 20) {
      parts.push(arabicUnits[remainder - 10] + ' عشر');
    } else {
      const u = remainder % 10;
      const t = Math.floor(remainder / 10);
      if (u > 0) {
        parts.push(arabicUnits[u] + ' و' + arabicTens[t]);
      } else {
        parts.push(arabicTens[t]);
      }
    }
  }

  return parts.join(' و');
}

export function numberToArabicWords(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'صفر دينار جزائري';
  if (rounded < 0) return 'سالب ' + numberToArabicWords(-rounded);

  const millions = Math.floor(rounded / 1000000);
  const thousands = Math.floor((rounded % 1000000) / 1000);
  const remainder = rounded % 1000;

  const parts: string[] = [];

  if (millions > 0) {
    if (millions === 1) parts.push('مليون');
    else if (millions === 2) parts.push('مليونان');
    else parts.push(convertUnderThousandArabic(millions) + ' ملايين');
  }

  if (thousands > 0) {
    if (thousands === 1) parts.push('ألف');
    else if (thousands === 2) parts.push('ألفان');
    else if (thousands >= 3 && thousands <= 10) parts.push(convertUnderThousandArabic(thousands) + ' آلاف');
    else parts.push(convertUnderThousandArabic(thousands) + ' ألف');
  }

  if (remainder > 0) {
    parts.push(convertUnderThousandArabic(remainder));
  }

  return parts.join(' و') + ' دينار جزائري فقط لا غير';
}

export function formatDZD(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' DZD';
}
