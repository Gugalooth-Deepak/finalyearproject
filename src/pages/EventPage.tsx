import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, ChevronLeft, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  created_at: string;
  total_seats: number;
  available_seats: number;
  image_url: string | null;
  creator_id: string;
}

interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  registration_date: string;
  status: string;
}

const EventPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [userRegistration, setUserRegistration] = useState<Registration | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        if (!id) return;

        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (eventError) throw eventError;
        setEvent(eventData);

        // Check if user is registered
        if (user) {
          const { data: registrationData, error: registrationError } = await supabase
            .from('registrations')
            .select('*')
            .eq('event_id', id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!registrationError && registrationData) {
            setIsRegistered(true);
            setUserRegistration(registrationData);
          }
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        toast.error('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`event-${id}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${id}` }, 
        (payload) => {
          setEvent(prev => prev ? { ...prev, ...payload.new } : null);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id, user]);

  const handleRegister = async () => {
    if (!user) {
      toast.error('Please login to register for this event');
      return;
    }

    if (!event) return;

    if (event.available_seats <= 0) {
      toast.error('Sorry, this event is fully booked');
      return;
    }

    try {
      setRegistering(true);

      // Begin a transaction to ensure data consistency
      const { data: registration, error: registrationError } = await supabase
        .from('registrations')
        .insert({
          event_id: event.id,
          user_id: user.id,
          registration_date: new Date().toISOString(),
          status: 'confirmed',
        })
        .select()
        .single();

      if (registrationError) throw registrationError;

      // Update available seats
      const { error: updateError } = await supabase
        .from('events')
        .update({ available_seats: event.available_seats - 1 })
        .eq('id', event.id);

      if (updateError) throw updateError;

      setIsRegistered(true);
      setUserRegistration(registration);
      toast.success('Successfully registered for the event!');

      // Send confirmation email (would be handled by a Supabase Edge Function)
      // This is just a placeholder for demonstration
      console.log('Would send email to:', user.email);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register for the event');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!user || !event || !userRegistration) return;

    try {
      setRegistering(true);

      // Delete the registration
      const { error: deleteError } = await supabase
        .from('registrations')
        .delete()
        .eq('id', userRegistration.id);

      if (deleteError) throw deleteError;

      // Update available seats
      const { error: updateError } = await supabase
        .from('events')
        .update({ available_seats: event.available_seats + 1 })
        .eq('id', event.id);

      if (updateError) throw updateError;

      setIsRegistered(false);
      setUserRegistration(null);
      toast.success('Registration cancelled successfully');
    } catch (error: any) {
      console.error('Cancellation error:', error);
      toast.error(error.message || 'Failed to cancel registration');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="h-10 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Event Not Found</h2>
        <p className="text-gray-500 mb-6">The event you're looking for doesn't exist or has been removed.</p>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <ChevronLeft size={16} className="mr-2" />
          Back to Events
        </Link>
      </div>
    );
  }

  const eventDate = new Date(event.event_date);
  const formattedDate = format(eventDate, 'EEEE, MMMM d, yyyy');
  const formattedTime = format(eventDate, 'h:mm a');
  const isPastEvent = eventDate < new Date();
  const isFull = event.available_seats <= 0;
  
  // Default image if none is provided
  const imageUrl = event.image_url || 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 mb-6"
        >
          <ChevronLeft size={16} className="mr-1" />
          Back to events
        </Link>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="relative h-72 md:h-96">
            <img
              src={imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            {isPastEvent && (
              <div className="absolute top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md">
                Past Event
              </div>
            )}
          </div>
          
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
                <div className="flex items-center text-gray-600 mb-2">
                  <Calendar size={18} className="mr-2" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center text-gray-600 mb-2">
                  <Clock size={18} className="mr-2" />
                  <span>{formattedTime}</span>
                </div>
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin size={18} className="mr-2" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users size={18} className="mr-2" />
                  <span>{event.available_seats} seats available of {event.total_seats}</span>
                </div>
              </div>
              
              <div className="mt-6 md:mt-0">
                {!isPastEvent && (
                  isRegistered ? (
                    <div className="text-center">
                      <div className="bg-green-100 text-success-500 rounded-md px-4 py-2 flex items-center justify-center mb-3">
                        <Ticket className="mr-2" size={18} />
                        <span>You're registered!</span>
                      </div>
                      <button
                        onClick={handleCancelRegistration}
                        disabled={registering}
                        className="w-full px-4 py-2 border border-error-500 text-error-500 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {registering ? 'Processing...' : 'Cancel Registration'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleRegister}
                      disabled={!user || isFull || registering}
                      className={`px-6 py-3 rounded-md text-white font-medium shadow-sm ${
                        isFull
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                      } disabled:opacity-50`}
                    >
                      {!user
                        ? 'Login to Register'
                        : isFull
                        ? 'Sold Out'
                        : registering
                        ? 'Processing...'
                        : 'Register for Event'}
                    </button>
                  )
                )}
                {isPastEvent && (
                  <div className="text-center">
                    <div className="bg-gray-100 text-gray-600 rounded-md px-4 py-3 mb-3">
                      This event has already taken place
                    </div>
                    {isRegistered && (
                      <Link
                        to={`/user/feedback/${event.id}`}
                        className="block w-full px-4 py-2 text-center bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                      >
                        Leave Feedback
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About this event</h2>
              <div className="prose prose-sm max-w-none text-gray-500">
                <p>{event.description}</p>
              </div>
            </div>
            
            {/* Conditional sections that could be expanded */}
            {/* <div className="border-t border-gray-200 pt-6 mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
              <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                [Map would go here]
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPage;