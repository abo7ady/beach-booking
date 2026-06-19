'use client';

import { User } from '@/types';
import { generateContactLinks } from '@/lib/utils';
import { MessageCircle, Send, Camera, Ghost, MessageSquare } from 'lucide-react';

interface ContactGridProps {
  user: User;
}

export default function ContactGrid({ user }: ContactGridProps) {
  const links = generateContactLinks(user);

  const contacts = [
    { key: 'whatsapp', url: links.whatsapp, icon: MessageCircle, bg: 'bg-[#25D366]', text: 'text-white', label: user.phone },
    { key: 'telegram', url: links.telegram, icon: Send, bg: 'bg-sky-500', text: 'text-white', label: user.telegram },
    { key: 'instagram', url: links.instagram, icon: Camera, bg: 'bg-gradient-to-br from-purple-500 to-rose-500', text: 'text-white', label: user.instagram },
    { key: 'messenger', url: links.messenger, icon: MessageSquare, bg: 'bg-blue-600', text: 'text-white', label: user.messenger },
    { key: 'snapchat', url: links.snapchat, icon: Ghost, bg: 'bg-yellow-400', text: 'text-black', label: user.snapchat },
  ];

  return (
    <div className="flex items-center gap-1">
      {contacts.map(({ key, url, icon: Icon, bg, text, label }) => {
        if (!url) return null;
        const isPreferred = user.preferredContact === key || (!user.preferredContact && key === 'whatsapp');
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${label || key} ${isPreferred ? '(Preferred)' : ''}`}
            className={`h-7 w-7 rounded-full flex items-center justify-center ${bg} ${text} text-xs hover:opacity-80 transition-all ${
              isPreferred ? 'ring-2 ring-primary ring-offset-1 scale-110 shadow-sm z-10' : ''
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </a>
        );
      })}
    </div>
  );
}
