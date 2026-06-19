'use client';

import { Activity } from '@/types';
import ActivityCard from './ActivityCard';
import ActivitySkeleton from './ActivitySkeleton';

interface ActivityGridProps {
  activities: Activity[];
  isLoading: boolean;
  onBook?: (activity: Activity) => void;
}

export default function ActivityGrid({
  activities,
  isLoading,
  onBook,
}: ActivityGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ActivitySkeleton key={i} />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🏖️</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No activities found
        </h3>
        <p className="text-muted-foreground text-sm">
          Try adjusting your search or check back later for new activities.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {activities.map((activity) => (
        <ActivityCard
          key={activity._id}
          activity={activity}
          onBook={onBook}
        />
      ))}
    </div>
  );
}
