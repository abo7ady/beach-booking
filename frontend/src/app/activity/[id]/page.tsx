'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Clock, Tag, Waves, Heart } from 'lucide-react';
import Link from 'next/link';
import { useActivity } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import BookingModal from '@/components/booking/BookingModal';
import TrendingBadge from '@/components/activity/TrendingBadge';

export default function ActivityDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { activity, isLoading } = useActivity(id);
  const { isAuthenticated, isAdmin, requireAuth } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites();
  const [showBooking, setShowBooking] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="skeleton h-96 rounded-xl" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
            <div className="skeleton h-10 w-40 rounded-md mt-6" />
          </div>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <div className="text-6xl mb-4">🏖️</div>
        <h2 className="text-xl font-semibold mb-2">Activity not found</h2>
        <Link href="/" className="text-primary hover:underline">← Back to catalog</Link>
      </div>
    );
  }

  const favorited = isAuthenticated && isFavorited(activity._id);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const allMedia = [
    ...(activity.images?.length ? [{ url: activity.images[0], type: 'image' }] : []),
    ...(activity.mediaAlbum?.map((m: any) => ({ url: m.url, type: m.mediaType })) || [])
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
        {/* Image Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted bg-black flex items-center justify-center">
            {allMedia[selectedMedia] ? (
              allMedia[selectedMedia].type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center">
                  {getYoutubeId(allMedia[selectedMedia].url) ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${getYoutubeId(allMedia[selectedMedia].url)}?autoplay=1&mute=1`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      style={{ aspectRatio: '4/3' }}
                      className="w-full h-full object-cover"
                    ></iframe>
                  ) : (
                    <video 
                      src={allMedia[selectedMedia].url} 
                      controls 
                      autoPlay 
                      muted 
                      className="w-full h-full object-contain" 
                      style={{ aspectRatio: '4/3' }}
                    />
                  )}
                </div>
              ) : (
                <img
                  src={allMedia[selectedMedia].url}
                  alt={activity.title}
                  className="w-full h-full object-contain"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Waves className="w-16 h-16 text-muted-foreground/20" />
              </div>
            )}
            {activity.isTrending && (
              <div className="absolute top-3 left-3 z-10 pointer-events-none">
                <TrendingBadge />
              </div>
            )}
          </div>

          {allMedia.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allMedia.map((media, i) => {
                const ytId = media.type === 'video' ? getYoutubeId(media.url) : null;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedMedia(i)}
                    className={cn(
                      'w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors relative bg-black',
                      i === selectedMedia ? 'border-primary' : 'border-transparent hover:border-border'
                    )}
                  >
                    {media.type === 'video' && ytId ? (
                      <img src={`https://img.youtube.com/vi/${ytId}/default.jpg`} alt="Video Thumbnail" className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <img src={media.url} alt="" className="w-full h-full object-cover" />
                    )}
                    {media.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
                          <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-white border-b-4 border-b-transparent ml-0.5" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {activity.title}
            </h1>
            <p className="text-primary font-bold text-xl mb-4">
              ${activity.price} / person
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {activity?.durationMinutes || 60} minutes
            </span>
            {activity?.tags?.length > 0 && (
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                {activity.tags.join(', ')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <span className="text-sm text-muted-foreground block mb-1">Group Size</span>
              <span className="font-medium text-foreground">
                {activity?.minCapacity || 1} - {activity?.maxCapacity || 'Unlimited'} persons
              </span>
            </div>
            {activity?.maxWeightLimit && activity.maxWeightLimit > 0 && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <span className="text-sm text-muted-foreground block mb-1">Max Weight</span>
                <span className="font-medium text-foreground">
                  {activity.maxWeightLimit} kg
                </span>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2">About this experience</h3>
            <p className="text-muted-foreground leading-relaxed">{activity?.description || 'No description available.'}</p>
          </div>

          {/* Actions */}
          {!isAdmin && (
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => requireAuth(() => setShowBooking(true))}
                className="flex-1 h-11 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors btn-press"
              >
                Book Now
              </button>
              <button
                onClick={() => requireAuth(() => toggleFavorite(activity._id))}
                className={cn(
                  'h-11 w-11 rounded-md border flex items-center justify-center transition-colors',
                  favorited
                    ? 'border-rose-200 bg-rose-50 text-rose-500'
                    : 'border-border hover:bg-accent text-muted-foreground'
                )}
              >
                <Heart className={cn('w-5 h-5', favorited && 'fill-rose-500')} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <BookingModal
          activity={activity}
          onClose={() => setShowBooking(false)}
          onSuccess={() => setShowBooking(false)}
        />
      )}
    </div>
  );
}
