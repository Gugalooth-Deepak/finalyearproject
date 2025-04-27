import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ChevronLeft, Star, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface FeedbackFormData {
  rating: number;
  comment: string;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
}

const Feedback = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [existingFeedback, setExistingFeedback] = useState<{ rating: number; comment: string } | null>(null);
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FeedbackFormData>();

  useEffect(() => {
    const fetchEventAndFeedback = async () => {
      if (!eventId || !user) return;

      try {
        setLoading(true);
        
        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('id, title, event_date')
          .eq('id', eventId)
          .single();
        
        if (eventError) throw eventError;
        setEvent(eventData);
        
        // Check if user has already submitted feedback
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('feedback')
          .select('id, rating, comment')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (feedbackError) throw feedbackError;
        
        if (feedbackData) {
          setExistingFeedback(feedbackData);
          setRating(feedbackData.rating);
          setValue('comment', feedbackData.comment);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndFeedback();
  }, [eventId, user, setValue]);

  const onSubmit = async (data: FeedbackFormData) => {
    if (!user || !eventId || !event) return;

    try {
      setSubmitting(true);
      
      const feedbackData = {
        event_id: eventId,
        user_id: user.id,
        rating: rating,
        comment: data.comment,
        created_at: new Date().toISOString(),
      };
      
      if (existingFeedback) {
        // Update existing feedback
        const { error } = await supabase
          .from('feedback')
          .update({ rating: rating, comment: data.comment })
          .eq('event_id', eventId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        toast.success('Feedback updated successfully');
      } else {
        // Create new feedback
        const { error } = await supabase
          .from('feedback')
          .insert(feedbackData);
        
        if (error) throw error;
        
        toast.success('Feedback submitted successfully');
      }
      
      navigate('/user/my-events');
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast.error(error.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRatingClick = (rating: number) => {
    setRating(rating);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Event Not Found</h2>
        <p className="mt-2 text-gray-500">The event you're looking for doesn't exist or has been removed.</p>
        <Link
          to="/user/my-events"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <ChevronLeft size={16} className="mr-2" />
          Back to My Events
        </Link>
      </div>
    );
  }

  const eventDate = new Date(event.event_date);
  const isPastEvent = eventDate < new Date();
  
  if (!isPastEvent) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Feedback Not Available</h2>
        <p className="mt-2 text-gray-500">You can only submit feedback after the event has taken place.</p>
        <Link
          to="/user/my-events"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <ChevronLeft size={16} className="mr-2" />
          Back to My Events
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
      <Link
        to="/user/my-events"
        className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
      >
        <ChevronLeft size={16} className="mr-1" />
        Back to my events
      </Link>
      
      <div className="mt-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Event Feedback: {event.title}
        </h1>
        <p className="mt-2 text-gray-500">
          Share your thoughts about this event. Your feedback helps organizers improve future events.
        </p>
      </div>
      
      <div className="mt-8 bg-white shadow-sm rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => handleRatingClick(starValue)}
                    onMouseEnter={() => setHoveredRating(starValue)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 first:pl-0 focus:outline-none"
                  >
                    <Star
                      fill={starValue <= (hoveredRating || rating) ? '#f59e0b' : 'none'}
                      stroke={starValue <= (hoveredRating || rating) ? '#f59e0b' : '#d1d5db'}
                      className="h-8 w-8 transition-colors"
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-500">
                  {rating === 0 ? 'Select a rating' : `${rating} star${rating !== 1 ? 's' : ''}`}
                </span>
              </div>
              {rating === 0 && (
                <p className="mt-1 text-sm text-red-600">Please select a rating</p>
              )}
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                Your Comments <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <textarea
                  id="comment"
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Share your experience with this event..."
                  {...register('comment', { required: 'Comment is required' })}
                ></textarea>
                {errors.comment && (
                  <p className="mt-1 text-sm text-red-600">{errors.comment.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || rating === 0}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 inline" />
                    Submitting...
                  </>
                ) : existingFeedback ? (
                  'Update Feedback'
                ) : (
                  'Submit Feedback'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Feedback;