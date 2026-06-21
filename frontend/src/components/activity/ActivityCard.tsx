'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Clock, Waves, Users } from 'lucide-react';
import { Activity } from '@/types';
import { formatPrice, cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import TrendingBadge from './TrendingBadge';

interface ActivityCardProps {
  activity: Activity;
  onBook?: (activity: Activity) => void;
}

export default function ActivityCard({ activity, onBook }: ActivityCardProps) {
  const { isAuthenticated, isAdmin, requireAuth } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites();
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [heartAnim, setHeartAnim] = useState(false);

  const favorited = isAuthenticated && isFavorited(activity._id);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(() => {
      setHeartAnim(true);
      toggleFavorite(activity._id);
      setTimeout(() => setHeartAnim(false), 300);
    });
  };

  const handleBook = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(() => {
      onBook?.(activity);
    });
  };

  const mainImage = activity.images?.[0];

  return (
    <Link
      href={`/activity/${activity._id}`}
      className="block rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden relative hover:shadow-md transition-shadow duration-300 group cursor-pointer animate-fade-in"
    >
      {/* Image */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted">
        {imgLoading && (
          <div className="absolute inset-0 animate-shimmer" />
        )}
        {mainImage && !imgError ? (
          <img
            src={mainImage}
            alt={activity.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onLoad={() => setImgLoading(false)}
            onError={() => { setImgError(true); setImgLoading(false); }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Waves className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Trending Badge */}
        {activity.isTrending && (
          <div className="absolute top-3 left-3 z-10">
            <TrendingBadge />
          </div>
        )}

        {/* Heart Button */}
        {!isAdmin && (
          <button
            onClick={handleHeartClick}
            className={cn(
              'absolute top-3 right-3 z-10 bg-white/80 backdrop-blur-sm rounded-full h-9 w-9 flex items-center justify-center hover:bg-white transition-all shadow-sm',
              heartAnim && 'animate-heart-beat'
            )}
          >
            <Heart
              className={cn(
                'w-5 h-5 transition-colors',
                favorited
                  ? 'stroke-rose-500 fill-rose-500'
                  : 'stroke-foreground fill-transparent'
              )}
            />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2">
        <h3 className="font-semibold text-base leading-tight text-foreground">
          {activity.title}
        </h3>
        <p className="text-muted-foreground text-sm line-clamp-2">
          {activity.description}
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-primary font-bold text-base">
            {formatPrice(activity.price || 0)}
          </span>
          <div className="flex items-center gap-3 text-muted-foreground text-xs font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {activity.durationMinutes} min
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {activity.maxPeople || 0} max
            </span>
          </div>
        </div>
        {!isAdmin && (
          <button
            onClick={handleBook}
            className="w-full mt-1 h-9 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors btn-press"
          >
            Book Now
          </button>
        )}
      </div>
    </Link>
  );
}
