import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, Filter, MoreVertical, Edit, Trash, Eye, 
  Calendar, MapPin, Users, AlertCircle, CheckCircle 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

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
}

const ManageEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: false });
        
        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    // Subscribe to realtime events
    const subscription = supabase
      .channel('events-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'events' }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEvents(prevEvents => [payload.new as Event, ...prevEvents]);
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

  const handleDeleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Event deleted successfully');
      setEvents(events.filter(event => event.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const toggleMenu = (id: string) => {
    setActiveMenu(activeMenu === id ? null : id);
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Manage Events</h1>
        <Link
          to="/admin/events/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search events..."
                className="block w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Filter className="mr-2 h-4 w-4 text-gray-500" />
              Filter
            </button>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse divide-y divide-gray-200">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/5"></div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredEvents.map((event) => {
              const eventDate = new Date(event.event_date);
              const isPastEvent = eventDate < new Date();
              return (
                <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">{event.title}</h3>
                      <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap space-y-1 sm:space-y-0 sm:space-x-4">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar size={14} className="mr-1 text-gray-400" />
                          {format(new Date(event.event_date), 'MMM d, yyyy • h:mm a')}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPin size={14} className="mr-1 text-gray-400" />
                          {event.location}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Users size={14} className="mr-1 text-gray-400" />
                          {event.available_seats} / {event.total_seats} seats available
                        </div>
                        <div className="flex items-center">
                          {isPastEvent ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              <AlertCircle size={12} className="mr-1" />
                              Past
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle size={12} className="mr-1" />
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => toggleMenu(event.id)}
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {activeMenu === event.id && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                          <div className="py-1">
                            <Link
                              to={`/events/${event.id}`}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Eye size={16} className="mr-2" />
                              View Event
                            </Link>
                            <Link
                              to={`/admin/events/edit/${event.id}`}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit size={16} className="mr-2" />
                              Edit Event
                            </Link>
                            <button
                              onClick={() => {
                                toggleMenu(event.id);
                                handleDeleteEvent(event.id);
                              }}
                              className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            >
                              <Trash size={16} className="mr-2" />
                              Delete Event
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? `No events matching "${searchTerm}"` : 'Get started by creating a new event'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Link
                  to="/admin/events/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageEvents;