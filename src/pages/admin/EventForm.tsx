import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Calendar, MapPin, Users, Info, ImagePlus, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface EventFormData {
  title: string;
  description: string;
  location: string;
  event_date: string;
  total_seats: number;
}

const EventForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const isEditMode = Boolean(id);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<EventFormData>();

  useEffect(() => {
    if (isEditMode) {
      const fetchEvent = async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) throw error;
          
          if (data) {
            // Format date to YYYY-MM-DDTHH:MM
            const eventDate = new Date(data.event_date);
            const formattedDate = eventDate.toISOString().slice(0, 16);
            
            setValue('title', data.title);
            setValue('description', data.description);
            setValue('location', data.location);
            setValue('event_date', formattedDate);
            setValue('total_seats', data.total_seats);
            setImageUrl(data.image_url);
          }
        } catch (error) {
          console.error('Error fetching event:', error);
          toast.error('Failed to load event data');
        } finally {
          setLoading(false);
        }
      };
      
      fetchEvent();
    }
  }, [id, isEditMode, setValue]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile || !user) return null;
    
    try {
      setUploading(true);
      
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `event-images/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(filePath, imageFile);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('events').getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Image upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    if (!user) {
      toast.error('You must be logged in to create an event');
      return;
    }

    try {
      setLoading(true);
      
      // Upload image if there's a new one
      let finalImageUrl = imageUrl;
      if (imageFile) {
        finalImageUrl = await uploadImage();
      }
      
      const eventData = {
        title: data.title,
        description: data.description,
        location: data.location,
        event_date: new Date(data.event_date).toISOString(),
        total_seats: data.total_seats,
        available_seats: isEditMode ? undefined : data.total_seats, // Only set for new events
        image_url: finalImageUrl,
        creator_id: user.id,
      };
      
      if (isEditMode) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', id);
        
        if (error) throw error;
        
        toast.success('Event updated successfully');
      } else {
        // Create new event
        const { error } = await supabase
          .from('events')
          .insert({ ...eventData, created_at: new Date().toISOString() });
        
        if (error) throw error;
        
        toast.success('Event created successfully');
        reset(); // Clear form
        setImageUrl(null);
        setImageFile(null);
      }
      
      navigate('/admin/events');
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast.error(error.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditMode ? 'Edit Event' : 'Create New Event'}
      </h1>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Event Title <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="title"
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  {...register('title', { required: 'Title is required' })}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  {...register('description', { required: 'Description is required' })}
                ></textarea>
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="location"
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Event venue or address"
                    {...register('location', { required: 'Location is required' })}
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="event_date" className="block text-sm font-medium text-gray-700">
                  Date & Time <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="event_date"
                    type="datetime-local"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    {...register('event_date', { required: 'Date and time are required' })}
                  />
                  {errors.event_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.event_date.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="total_seats" className="block text-sm font-medium text-gray-700">
                  Total Seats <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="total_seats"
                    type="number"
                    min="1"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    {...register('total_seats', { 
                      required: 'Total seats are required',
                      min: {
                        value: 1,
                        message: 'Must have at least 1 seat'
                      },
                      valueAsNumber: true,
                    })}
                  />
                  {errors.total_seats && (
                    <p className="mt-1 text-sm text-red-600">{errors.total_seats.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Event Image
                </label>
                <div className="mt-1 flex items-center">
                  <div
                    className={`flex-shrink-0 h-24 w-24 rounded-md overflow-hidden bg-gray-100 border border-gray-200 ${
                      !imageUrl ? 'flex items-center justify-center' : ''
                    }`}
                  >
                    {imageUrl ? (
                      <img src={imageUrl} alt="Event preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlus className="h-8 w-8 text-gray-300" />
                    )}
                  </div>
                  <div className="ml-4 flex flex-col">
                    <label
                      htmlFor="image-upload"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      {uploading ? (
                        <>
                          <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" />
                          Uploading...
                        </>
                      ) : (
                        'Choose image'
                      )}
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={uploading}
                    />
                    <p className="mt-1 text-xs text-gray-500">JPG, PNG, or GIF up to 10MB</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    After {isEditMode ? 'updating' : 'creating'} the event, you'll be able to see it listed in the events management page.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/admin/events')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 inline" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditMode ? 'Update Event' : 'Create Event'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;