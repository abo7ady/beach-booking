'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Trash2, CheckCircle2, Video, Image as ImageIcon } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
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

  const [minCapacity, setMinCapacity] = useState(activity?.minCapacity?.toString() || '1');
  const [maxCapacity, setMaxCapacity] = useState(activity?.maxCapacity?.toString() || '');
  const [maxWeightLimit, setMaxWeightLimit] = useState(activity?.maxWeightLimit?.toString() || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Main Cover Image handling
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  // Unified Media Album state for Drag & Drop
  const [mediaAlbum, setMediaAlbum] = useState<any[]>(
    activity?.mediaAlbum?.map((m: any, i: number) => ({ ...m, publicId: `media-${i}` })) || []
  );
  
  // Keep track of raw files to append on submit
  const [newMediaFiles, setNewMediaFiles] = useState<File[]>([]);
  
  const [youtubeInput, setYoutubeInput] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(mediaAlbum);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setMediaAlbum(items);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) return setError('Title is required');
    if (!description.trim()) return setError('Description is required');
    if (!price.trim()) return setError('Price is required');
    if (isNaN(Number(price)) || Number(price) < 0) return setError('Price must be a valid positive number');
    if (!minCapacity.trim() || isNaN(Number(minCapacity)) || Number(minCapacity) < 1) return setError('Min Capacity must be a valid number >= 1');
    if (maxCapacity.trim() && (isNaN(Number(maxCapacity)) || Number(maxCapacity) < Number(minCapacity))) return setError('Max Capacity must be >= Min Capacity');

    if (!isEdit && !newImageFile) return setError('A cover image is required when creating a new activity.');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('durationMinutes', durationMinutes);
      formData.append('price', price);
      formData.append('minCapacity', minCapacity);
      if (maxCapacity.trim()) formData.append('maxCapacity', maxCapacity);
      if (maxWeightLimit.trim()) formData.append('maxWeightLimit', maxWeightLimit);

      const tagsArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
      tagsArray.forEach((tag) => formData.append('tags', tag));

      if (newImageFile) {
        formData.append('image', newImageFile);
      }

      newMediaFiles.forEach((file) => {
        formData.append('mediaFiles', file);
      });

      // Prepare mediaAlbum array stripping local id helpers
      const albumPayload = mediaAlbum.map(({ publicId, fileIndex, ...rest }) => rest);
      formData.append('mediaAlbum', JSON.stringify(albumPayload));

      if (isEdit) {
        await api.put(`/activities/${activity._id}`, formData, {
          headers: { 'Content-Type': undefined },
        });
      } else {
        await api.post('/activities', formData, {
          headers: { 'Content-Type': undefined },
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
    if (file) setNewImageFile(file);
  };

  const handleMediaFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      const startIndex = newMediaFiles.length;
      setNewMediaFiles(prev => [...prev, ...filesArr]);
      
      const newAlbumItems = filesArr.map((f, i) => ({
        publicId: `new-file-${startIndex + i}-${Date.now()}`,
        url: URL.createObjectURL(f),
        mediaType: 'image',
        fileIndex: startIndex + i // ref to newMediaFiles array if needed
      }));
      setMediaAlbum(prev => [...prev, ...newAlbumItems]);
    }
    e.target.value = ''; // Reset
  };

  const handleAddYoutubeLink = () => {
    if (!youtubeInput.trim()) return;
    setMediaAlbum(prev => [
      ...prev,
      { publicId: `yt-${Date.now()}`, url: youtubeInput.trim(), mediaType: 'video' }
    ]);
    setYoutubeInput('');
  };

  const removeMediaAlbumItem = (index: number) => {
    setMediaAlbum(prev => prev.filter((_, i) => i !== index));
    // Optional: We can leave the raw file in newMediaFiles, it just won't be in the payload mapping
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in"
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
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

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Price per person ($) *</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  required
                  className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
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
                  placeholder="ATV, Desert"
                  className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Min Capacity *</label>
                <input
                  type="number"
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(e.target.value)}
                  min="1"
                  required
                  className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Max Capacity</label>
                <input
                  type="number"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  min="1"
                  placeholder="Unlimited"
                  className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Max Weight (lbs/kg)</label>
                <input
                  type="number"
                  value={maxWeightLimit}
                  onChange={(e) => setMaxWeightLimit(e.target.value)}
                  min="1"
                  placeholder="Optional"
                  className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="font-semibold text-sm mb-3">Cover Image {isEdit ? '' : '*'}</h4>
            {isEdit && activity?.images && activity.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={activity.images[0]} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            <label className="flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-md border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary cursor-pointer transition-colors bg-muted/20">
              {newImageFile ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">{newImageFile.name}</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  {isEdit ? 'Replace cover image' : 'Select a cover image'}
                </>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={loading} />
            </label>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="font-semibold text-sm mb-3">Media Gallery (Images & Videos)</h4>

            {mediaAlbum.length > 0 && isMounted && (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="media-album" direction="horizontal" renderClone={(provided, snapshot, rubric) => {
                  const item = mediaAlbum[rubric.source.index];
                  return (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{ ...provided.draggableProps.style }}
                      className="w-24 h-24 rounded-xl overflow-hidden select-none border-2 border-blue-500 bg-background shadow-2xl flex items-center justify-center"
                    >
                      {item.mediaType === 'image' ? (
                        <img src={item.url} alt="Dragging..." className="w-full h-full object-cover" />
                      ) : (
                        <div className="bg-zinc-800 text-white text-xs font-semibold w-full h-full flex items-center justify-center">YT Link</div>
                      )}
                    </div>
                  );
                }}>
                  {(provided) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps} 
                      className="flex items-center gap-3 overflow-x-auto py-2"
                    >
                      {mediaAlbum.map((item, index) => (
                        <Draggable key={item.publicId || item.url} draggableId={item.publicId || item.url} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{ ...provided.draggableProps.style }}
                              className={`w-24 h-24 rounded-xl overflow-hidden select-none border relative group transition-shadow ${
                                snapshot.isDragging ? 'opacity-0' : 'opacity-100'
                              }`}
                            >
                              {item.mediaType === 'image' ? (
                                <img src={item.url} alt="Gallery" className="w-full h-full object-cover" />
                              ) : (
                                <div className="bg-zinc-900 text-white text-xs font-medium w-full h-full flex items-center justify-center">YT Link</div>
                              )}
                              
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); removeMediaAlbumItem(index); }} 
                                className="absolute top-1 right-1 bg-black/50 hidden group-hover:flex items-center justify-center text-white w-6 h-6 rounded-full z-20 hover:bg-red-500 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}

            {/* Media Selector */}
            <div className="bg-muted/30 p-4 rounded-lg border border-border mt-2">
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="radio" checked={mediaType === 'image'} onChange={() => setMediaType('image')} />
                  <ImageIcon className="w-4 h-4 text-blue-500" /> Image
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="radio" checked={mediaType === 'video'} onChange={() => setMediaType('video')} />
                  <Video className="w-4 h-4 text-red-500" /> YouTube Video
                </label>
              </div>

              {mediaType === 'image' ? (
                <label className="flex flex-col items-center justify-center gap-2 px-3 py-6 rounded-md border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary cursor-pointer transition-colors bg-white">
                  <Upload className="w-6 h-6" />
                  Select Images
                  <input type="file" accept="image/*" multiple onChange={handleMediaFilesChange} className="hidden" disabled={loading} />
                </label>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={youtubeInput}
                    onChange={(e) => setYoutubeInput(e.target.value)}
                    placeholder="Paste YouTube Video URL..."
                    className="flex-1 h-10 rounded-md border border-input bg-white px-3 text-sm"
                  />
                  <button type="button" onClick={handleAddYoutubeLink} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80">
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 btn-press mt-2"
          >
            {loading ? 'Saving Activity...' : isEdit ? 'Update Activity' : 'Create Activity'}
          </button>
        </form>
      </div>
    </div>
  );
}
