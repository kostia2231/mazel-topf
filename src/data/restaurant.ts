export const restaurant = {
  name: 'Masel Topf',
  wordmark: 'masel topf',
  address: {
    street: 'Rykestraße 2',
    postalCode: '10405',
    city: 'Berlin',
  },
  phone: '+49 (0) 30 443 17 525',
  email: 'masel-topf@hotmail.com',
} as const;

/** Онлайн-заказ идёт на Wolt — внешняя площадка, не раздел сайта. */
export const orderOnlineUrl =
  'https://wolt.com/de/deu/berlin/restaurant/ma-sel-topf';

export const zenchefRestaurantId = '380952';

export const reservationUrl = `https://bookings.zenchef.com/results?rid=${zenchefRestaurantId}`;

export const cuisine = 'Israeli';
export const priceRange = '€€';

export const openingHours = [
  {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '12:00',
    closes: '23:59',
  },
  { days: ['Saturday', 'Sunday'], opens: '09:00', closes: '23:59' },
] as const;

export const phoneNumber = restaurant.phone.replace('(0)', '').replace(/[^\d+]/g, '');

export const phoneLink = `tel:${phoneNumber}`;
export const mailLink = `mailto:${restaurant.email}`;

export const socialLinks = [
  { label: 'Facebook', href: '#', icon: 'facebook' },
  { label: 'Tripadvisor', href: '#', icon: 'tripadvisor' },
  { label: 'Instagram', href: '#', icon: 'instagram' },
  { label: 'Google Maps', href: '#', icon: 'pin' },
] as const;
