import { NavLink } from 'react-router-dom';
import { CalendarDays, Home, List, BarChart, Users } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { to: '/admin', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/admin/events', icon: <CalendarDays size={20} />, label: 'Events' },
    { to: '/admin/users', icon: <Users size={20} />, label: 'Users' },
    { to: '/admin/analytics', icon: <BarChart size={20} />, label: 'Analytics' },
  ];

  return (
    <div className="hidden md:flex md:flex-col md:w-64 md:min-h-full bg-primary-800 text-white">
      <div className="flex items-center justify-center py-6 border-b border-primary-700">
        <CalendarDays className="h-8 w-8" />
        <span className="ml-2 text-xl font-bold">EventHub Admin</span>
      </div>
      <nav className="mt-8 flex-1 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-primary-700 text-white'
                  : 'text-primary-100 hover:bg-primary-700 hover:text-white'
              }`
            }
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-primary-700">
        <NavLink
          to="/"
          className="flex items-center text-sm font-medium text-primary-100 hover:text-white transition-colors"
        >
          <List size={20} className="mr-3" />
          Back to Site
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;