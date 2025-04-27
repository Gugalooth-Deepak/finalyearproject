import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Ticket, Star, ArrowUpRight, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Stats {
  totalEvents: number;
  totalRegistrations: number;
  totalUsers: number;
  avgFeedbackRating: number;
}

interface RecentEvent {
  id: string;
  title: string;
  event_date: string;
  available_seats: number;
  total_seats: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalEvents: 0,
    totalRegistrations: 0,
    totalUsers: 0,
    avgFeedbackRating: 0,
  });
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch total events
        const { count: eventsCount, error: eventsError } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true });
        
        // Fetch total registrations
        const { count: registrationsCount, error: registrationsError } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true });
        
        // Fetch total users
        const { count: usersCount, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        // Fetch average feedback rating
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('feedback')
          .select('rating');
        
        // Fetch recent events
        const { data: recentEventsData, error: recentEventsError } = await supabase
          .from('events')
          .select('id, title, event_date, available_seats, total_seats')
          .order('created_at', { ascending: false })
          .limit(5);
        
        // Calculate average rating
        let avgRating = 0;
        if (feedbackData && feedbackData.length > 0) {
          const sum = feedbackData.reduce((acc, item) => acc + item.rating, 0);
          avgRating = parseFloat((sum / feedbackData.length).toFixed(1));
        }
        
        setStats({
          totalEvents: eventsCount || 0,
          totalRegistrations: registrationsCount || 0,
          totalUsers: usersCount || 0,
          avgFeedbackRating: avgRating,
        });
        
        setRecentEvents(recentEventsData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, color }: { title: string; value: number | string; icon: React.ReactNode; color: string }) => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className={`rounded-full p-3 ${color}`}>
          {icon}
        </div>
        <div className="ml-5">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-1 text-2xl font-semibold text-gray-900">{value}</h3>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 h-32"></div>
          ))}
        </div>
        <div className="h-8 bg-gray-200 rounded w-1/4 mt-8"></div>
        <div className="bg-white rounded-lg shadow-sm p-6 h-64"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/admin/events/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Events"
          value={stats.totalEvents}
          icon={<Calendar className="h-6 w-6 text-white" />}
          color="bg-primary-600 text-white"
        />
        <StatCard
          title="Total Registrations"
          value={stats.totalRegistrations}
          icon={<Ticket className="h-6 w-6 text-white" />}
          color="bg-accent-500 text-white"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users className="h-6 w-6 text-white" />}
          color="bg-secondary-600 text-white"
        />
        <StatCard
          title="Avg. Feedback Rating"
          value={stats.avgFeedbackRating}
          icon={<Star className="h-6 w-6 text-white" />}
          color="bg-success-500 text-white"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Recent Events</h2>
          <Link
            to="/admin/events"
            className="text-sm font-medium text-primary-600 hover:text-primary-500 inline-flex items-center"
          >
            View all
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {recentEvents.length > 0 ? (
            recentEvents.map((event) => (
              <div key={event.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(event.event_date).toLocaleDateString()} • {event.available_seats} seats available
                  </p>
                </div>
                <Link
                  to={`/admin/events/edit/${event.id}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  Edit
                </Link>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events created yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new event.</p>
              <div className="mt-6">
                <Link
                  to="/admin/events/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;