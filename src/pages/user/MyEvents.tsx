import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronLeft, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

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

interface Registration {
  id: string;
  event_id: string;
  status: string;
  registration_date: string;
  event: Event;
}

const MyEvents = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'upcoming', 'past'

  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('registrations')
          .select(`
            id,
            event_id,
            status,
            registration_date,
            event:events (
              id,
              title,
              description,
              location,
              event_date,
              available_seats,
              total_seats,
              image_url
            )
          `)
          .eq('user_id', user.id)
          .order('registration_date', { ascending: false });

        if (error) throw error;
        setRegistrations(data || []);
      } catch (error) {
        console.error('Error fetching registrations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [user]);

  const filteredRegistrations = registrations.filter(reg => {
    // Apply search filter
    const eventMatches = reg.event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply date filter
    const eventDate = new Date(reg.event.event_date);
    const isPastEvent = eventDate < new Date();
    
    if (activeFilter === 'upcoming' && isPastEvent) return false;
    if (activeFilter === 'past' && !isPastEvent) return false;
    
    return eventMatches;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          <ChevronLeft size={16} className="mr-1" />
          Back to events
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">My Events</h1>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search my events..."
                className="block w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <button 
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeFilter === 'all' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveFilter('all')}
              >
                All
              </button>
              <button 
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeFilter === 'upcoming' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveFilter('upcoming')}
              >
                Upcoming
              </button>
              <button 
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeFilter === 'past' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveFilter('past')}
              >
                Past
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse divide-y divide-gray-200">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-6">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : filteredRegistrations.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredRegistrations.map((registration) => {
              const event = registration.event;
              const eventDate = new Date(event.event_date);
              const isPastEvent = eventDate < new Date();
              
              return (
                <li key={registration.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                      <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                      <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap text-sm text-gray-500 gap-y-1 sm:gap-x-4">
                        <div className="flex items-center">
                          <Calendar size={16} className="mr-1 text-gray-400" />
                          {format(eventDate, 'MMM d, yyyy • h:mm a')}
                        </div>
                        <div>
                          Registered on {format(new Date(registration.registration_date), 'MMM d, yyyy')}
                        </div>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isPastEvent 
                            ? 'bg-gray-100 text-gray-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {isPastEvent ? 'Past Event' : 'Upcoming'}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link
                        to={`/events/${event.id}`}
                        className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        View Details
                      </Link>
                      {isPastEvent && (
                        <Link
                          to={`/user/feedback/${event.id}`}
                          className="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                        >
                          Leave Feedback
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? `No events matching "${searchTerm}"` 
                : activeFilter !== 'all'
                  ? `No ${activeFilter} events found`
                  : 'You haven\'t registered for any events yet'}
            </p>
            <div className="mt-6">
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                Browse Events
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEvents;