const PRODUCT_MAP = {
  'Casual / Streetwear': ['T-shirts', 'Hoodies', 'Sneakers', 'Jeans', 'Caps'],
  'Formal / Business': ['Blazers', 'Dress Shirts', 'Chinos', 'Dress Shoes', 'Ties'],
  'Sporty / Athletic': ['Activewear', 'Running Shoes', 'Track Pants', 'Sports Bras', 'Gym Bags'],
  'Trendy / Fashion-Forward': ['Statement Pieces', 'Accessories', 'Trending Brands', 'Limited Editions'],
  'Classic / Minimalist': ['Basics', 'Neutral Tones', 'Quality Essentials', 'Timeless Cuts'],
  'Bohemian / Artistic': ['Flowy Dresses', 'Prints', 'Layered Pieces', 'Handmade Accessories'],
  'Luxury / Designer': ['Premium Collections', 'Designer Brands', 'Accessories', 'Exclusive Items'],
  'Outdoor / Rugged': ['Jackets', 'Hiking Boots', 'Cargo Pants', 'Weatherproof Gear'],
};

const APPROACH_TIPS = {
  happy: 'Customer seems in a good mood — great time to suggest new arrivals or promotions.',
  neutral: 'Customer is browsing calmly — let them explore, offer help if they pause.',
  surprised: 'Something caught their eye — approach to offer more info on what they noticed.',
  sad: 'Customer may appreciate a warm, gentle approach — offer assistance without pressure.',
  fearful: 'Customer seems uncertain — a friendly greeting and guided help could go a long way.',
  disgusted: 'Give some space, check in only if they seem to need help.',
  angry: 'Give space and avoid being pushy — check in briefly only if they look for help.',
};

function getApproachTip(dominantExpression) {
  return APPROACH_TIPS[dominantExpression.label] || APPROACH_TIPS.neutral;
}

function getDemographicHint(age, gender) {
  const genderLabel = gender.charAt(0).toUpperCase() + gender.slice(1);

  if (age < 20) {
    return `${genderLabel}, ~${age} years — likely drawn to trend-driven and youthful styles.`;
  }
  if (age < 30) {
    return `${genderLabel}, ~${age} years — likely interested in current trends and versatile pieces.`;
  }
  if (age < 40) {
    return `${genderLabel}, ~${age} years — may value quality, fit, and style that transitions from casual to professional.`;
  }
  if (age < 55) {
    return `${genderLabel}, ~${age} years — likely prefers classic, professional, or refined casual styles.`;
  }
  return `${genderLabel}, ~${age} years — may appreciate comfort, timeless classics, and quality fabrics.`;
}

export function generateSuggestions(faceData, clipData) {
  const topStyle = clipData?.styles?.[0] || null;
  const topOccasion = clipData?.occasions?.[0] || null;

  const productSuggestions = topStyle
    ? (PRODUCT_MAP[topStyle.label] || [])
    : [];

  return {
    styleProfile: topStyle,
    occasion: topOccasion,
    productSuggestions,
    approachTip: getApproachTip(faceData.dominantExpression),
    demographicHint: getDemographicHint(faceData.age, faceData.gender),
  };
}
