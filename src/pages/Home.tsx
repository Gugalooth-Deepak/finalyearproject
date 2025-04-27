import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, MapPin, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import EventCard from '../components/EventCard';
import { formatDistanceToNow } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  available_seats: number;
  total_seats: number;
  image_url: string | null;
}

const Home = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: true });
        
        // Only get future events
        query = query.gte('event_date', new Date().toISOString());
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
    
    // Subscribe to realtime changes
    const subscription = supabase
      .channel('events-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'events' }, 
        (payload) => {
          // Handle the payload to update our events list
          if (payload.eventType === 'INSERT') {
            setEvents(prevEvents => [...prevEvents, payload.new as Event]);
          } else if (payload.eventType === 'UPDATE') {
            setEvents(prevEvents =>
              prevEvents.map(event =>
                event.id === payload.new.id ? { ...event, ...payload.new } : event
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setEvents(prevEvents =>
              prevEvents.filter(event => event.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Hero section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 animate-fade-in">
              Discover Amazing Events
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto opacity-90 mb-8 animate-slide-up">
              Find and join local events, workshops, and meetups that match your interests. 
              Register in seconds and connect with like-minded people.
            </p>
            <div className="max-w-xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden animate-scale-in">
              <div className="p-2 flex items-center">
                <div className="p-2 text-gray-400">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Search for events..."
                  className="flex-1 p-2 outline-none text-gray-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event listing section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Upcoming Events</h2>
            <p className="mt-1 text-gray-500">Discover and register for these exciting events</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-2">
            <button className="px-4 py-2 border border-primary-500 text-primary-600 rounded-md hover:bg-primary-50 transition-colors">
              All
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
              Today
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
              This Week
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mb-4">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-gray-500">
              {searchTerm ? `No events matching "${searchTerm}"` : 'No upcoming events at the moment'}
            </p>
          </div>
        )}
      </div>

      {/* Featured section */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose EventHub?</h2>
            <p className="mt-4 text-gray-500">
              Our platform makes it easy to discover, create, and manage events of any size
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-primary-100 h-12 w-12 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Easy Event Creation</h3>
              <p className="text-gray-500">
                Create and manage events with just a few clicks. Add all the details your attendees need.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-primary-100 h-12 w-12 rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Discover Local Events</h3>
              <p className="text-gray-500">
                Find events happening near you. Filter by date, location, and category to find your perfect event.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-primary-100 h-12 w-12 rounded-full flex items-center justify-center mb-4">
                <User className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Simple Registration</h3>
              <p className="text-gray-500">
                Register for events with one click. Receive confirmation emails and reminders about upcoming events.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;