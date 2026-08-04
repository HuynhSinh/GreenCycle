import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, X } from 'lucide-react';

const completePickupSchema = z.object({
  actualQuantity: z.coerce.number().positive('Actual quantity must be greater than 0'),
  note: z.string().optional(),
});

export default function CompletePickupModal({ pickup, open, onClose, onConfirm, isSubmitting }) {
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(completePickupSchema),
    defaultValues: {
      actualQuantity: '',
      note: '',
    },
  });

  useEffect(() => {
    if (open) return undefined;

    reset({ actualQuantity: '', note: '' });
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    setImageUrl('');
    return undefined;
  }, [open, reset]);

  if (!open || !pickup) return null;

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    setImageUrl(objectUrl);
  };

  const onSubmit = (values) => {
    onConfirm({
      status: 'COLLECTED',
      actualQuantity: values.actualQuantity,
      ...(values.note?.trim() ? { note: values.note.trim() } : {}),
      ...(imageUrl ? { imageUrl } : {}),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Complete Pickup</h3>
            <p className="text-sm text-slate-500">{pickup.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label htmlFor="actualQuantity" className="block text-sm font-medium text-slate-700 mb-1">
              Actual Quantity / Weight <span className="text-rose-500">*</span>
            </label>
            <input
              id="actualQuantity"
              type="number"
              step="any"
              min="0"
              {...register('actualQuantity')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 3.5"
            />
            {errors.actualQuantity && (
              <p className="mt-1 text-sm text-rose-600">{errors.actualQuantity.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-slate-700 mb-1">
              Pickup Note
            </label>
            <textarea
              id="note"
              rows={3}
              {...register('note')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional notes about the collection"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700 mb-1">Confirmation Image</span>
            <label className="flex flex-col items-center justify-center gap-2 w-full rounded-lg border border-dashed border-slate-300 px-4 py-6 cursor-pointer hover:bg-slate-50">
              <ImagePlus className="w-6 h-6 text-slate-400" />
              <span className="text-sm text-slate-500">Choose photo or take a picture</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Pickup confirmation preview"
                className="mt-3 h-32 w-full object-cover rounded-lg border border-slate-200"
              />
            )}
            <p className="mt-2 text-xs text-slate-400">
              Preview only — a local mock URL is sent with the request.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : 'Confirm & Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
