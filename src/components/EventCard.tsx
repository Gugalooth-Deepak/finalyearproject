import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';

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

interface EventCardProps {
  event: Event;
}

const EventCard = ({ event }: EventCardProps) => {
  const eventDate = new Date(event.event_date);
  const formattedDate = format(eventDate, 'MMM d, yyyy • h:mm a');
  const isPastEvent = eventDate < new Date();
  
  // Default image if none is provided
  const imageUrl = event.image_url || 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-lg">
      <div className="relative">
        <img
          src={imageUrl}
          alt={event.title}
          className="h-48 w-full object-cover"
        />
        {isPastEvent && (
          <div className="absolute top-2 right-2 bg-gray-800 text-white px-3 py-1 text-xs rounded-full">
            Past Event
          </div>
        )}
        {!isPastEvent && event.available_seats === 0 && (
          <div className="absolute top-2 right-2 bg-error-500 text-white px-3 py-1 text-xs rounded-full">
            Sold Out
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-gray-900 line-clamp-1">
            {event.title}
          </h3>
        </div>
        <p className="text-gray-500 mb-4 line-clamp-2">
          {event.description}
        </p>
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600">
            <Calendar size={16} className="mr-2" />
            <span className="text-sm">{formattedDate}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <MapPin size={16} className="mr-2" />
            <span className="text-sm">{event.location}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Users size={16} className="mr-2" />
            <span className="text-sm">
              {event.available_seats} seats available
            </span>
          </div>
        </div>
        <Link
          to={`/events/${event.id}`}
          className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          View Event
        </Link>
      </div>
    </div>
  );
};

export default EventCard;