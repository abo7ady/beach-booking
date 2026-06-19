import Link from 'next/link';
import { Waves } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center">
            <Waves className="w-10 h-10 text-primary" />
          </div>
        </div>
        <h1 className="text-6xl font-extrabold text-foreground mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Looks like this page drifted out to sea
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors btn-press"
        >
          ← Back to Catalog
        </Link>
      </div>
    </div>
  );
}
