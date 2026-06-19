import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(new Date(date));
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'new': return 'bg-blue-100 text-blue-800';
    case 'contacted': return 'bg-yellow-100 text-yellow-800';
    case 'confirmed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function generateContactLinks(user: any) {
  if (typeof user === 'string' || !user) return {};
  
  const cleanHandle = (handle?: string) => handle?.replace('@', '').trim();
  const cleanPhone = (phone?: string) => phone?.replace(/\+/g, '').trim();

  return {
    whatsapp: user.phone ? `https://wa.me/${cleanPhone(user.phone)}` : null,
    telegram: user.telegram ? `https://t.me/${cleanHandle(user.telegram)}` : null,
    instagram: user.instagram ? `https://instagram.com/${cleanHandle(user.instagram)}` : null,
    snapchat: user.snapchat ? `https://snapchat.com/add/${cleanHandle(user.snapchat)}` : null,
    messenger: user.messenger ? `https://m.me/${cleanHandle(user.messenger)}` : null,
  };
}
