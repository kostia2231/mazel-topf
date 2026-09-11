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

export const phoneLink = `tel:${restaurant.phone.replace(/[^\d+]/g, '')}`;
export const mailLink = `mailto:${restaurant.email}`;

export const socialLinks = [
  { label: 'Facebook', href: '#', icon: 'facebook' },
  { label: 'Tripadvisor', href: '#', icon: 'tripadvisor' },
  { label: 'Instagram', href: '#', icon: 'instagram' },
  { label: 'Google Maps', href: '#', icon: 'pin' },
] as const;
