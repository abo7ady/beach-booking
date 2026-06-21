'use client';

import { useState } from 'react';
import { X, Upload, Trash2, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { Activity } from '@/types';

interface ActivityFormProps {
  activity?: Activity;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ActivityForm({ activity, onClose, onSuccess }: ActivityFormProps) {
  const isEdit = !!activity;
  const [title, setTitle] = useState(activity?.title || '');
  const [description, setDescription] = useState(activity?.description || '');
  const [durationMinutes, setDurationMinutes] = useState(activity?.durationMinutes?.toString() || '60');
  const [tags, setTags] = useState(activity?.tags?.join(', ') || '');
  const [price, setPrice] = useState(activity?.price?.toString() || '');
  const [maxPeople, setMaxPeople] = useState(activity?.maxPeople?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Image handling
  const [imageUploading, setImageUploading] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) return setError('Title is required');
    if (!description.trim()) return setError('Description is required');
    if (!price.trim()) return setError('Price is required');
    if (isNaN(Number(price)) || Number(price) < 0) return setError('Price must be a valid positive number');
    if (!maxPeople.trim()) return setError('Max Capacity is required');
    if (isNaN(Number(maxPeople)) || Number(maxPeople) <= 0) return setError('Max Capacity must be a valid positive number');
    if (!isEdit && !newImageFile) return setError('An image is required when creating a new activity.');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('durationMinutes', durationMinutes);
      formData.append('price', price);
      formData.append('maxPeople', maxPeople);
      
      const tagsArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
      tagsArray.forEach((tag) => formData.append('tags', tag));

      if (newImageFile) {
        formData.append('image', newImageFile);
      }

      if (isEdit) {
        await api.put(`/activities/${activity._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/activities', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save activity.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImageFile(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-foreground">
            {isEdit ? 'Edit Activity' : 'New Activity'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full text-muted-foreground hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. ATV Desert Adventure"
              className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the activity..."
              rows={3}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Duration (min)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                min="1"
                className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="ATV, Desert (comma-separated)"
                className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Price (EGP) *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                placeholder="e.g. 500"
                required
                className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Max Capacity (people) *</label>
              <input
                type="number"
                value={maxPeople}
                onChange={(e) => setMaxPeople(e.target.value)}
                min="1"
                placeholder="e.g. 10"
                required
                className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Image {isEdit ? '' : '*'}</label>
            {isEdit && activity?.images && activity.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {activity.images.map((img, i) => (
                  <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-border">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            
            <label className="flex flex-col items-center justify-center gap-2 px-3 py-6 rounded-md border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary cursor-pointer transition-colors bg-muted/20">
              {newImageFile ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">{newImageFile.name} queued for upload</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6" />
                  {imageUploading ? 'Uploading...' : isEdit ? 'Upload another image' : 'Click to select an image'}
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={imageUploading || loading}
              />
            </label>
            {!isEdit && !newImageFile && (
              <p className="text-xs text-muted-foreground mt-1 text-center">An image is required to create an activity.</p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading || imageUploading}
            className="w-full h-10 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 btn-press mt-2"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Activity' : 'Create Activity'}
          </button>
        </form>
      </div>
    </div>
  );
}
