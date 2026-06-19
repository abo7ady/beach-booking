import { getStatusColor } from '@/lib/utils';

export default function BookingStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(status)}`}
    >
      {status}
    </span>
  );
}
