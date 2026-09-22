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

export const mapsUrl =
  'https://www.google.com/maps/search/?api=1&query=Masel+Topf+Rykestra%C3%9Fe+2+Berlin';

export const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/MaselTopf/', icon: 'facebook' },
  {
    label: 'Tripadvisor',
    href: 'https://www.tripadvisor.de/Restaurant_Review-g187323-d6780640-Reviews-Masel_Topf-Berlin.html',
    icon: 'tripadvisor',
  },
  { label: 'Instagram', href: 'https://www.instagram.com/maseltopf/', icon: 'instagram' },
  { label: 'Google Maps', href: mapsUrl, icon: 'pin' },
] as const;
