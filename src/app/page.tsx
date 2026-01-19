export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">CallCenter Pro</h1>
          <a 
            href="/login" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 text-gray-900">
            Streamline Your Call Center Operations
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            A comprehensive management system for tracking employee performance, managing call logs, and sharing critical data in real-time.
          </p>
          <a 
            href="/login" 
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700"
          >
            Get Started
          </a>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Employee Management</h3>
            <p className="text-gray-600">Manage up to 20 employees with role-based access control and activity tracking</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Call Analytics</h3>
            <p className="text-gray-600">Comprehensive call logs with status tracking, duration analysis, and performance metrics</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Secure Access</h3>
            <p className="text-gray-600">JWT-based authentication with encrypted passwords and role-based permissions</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Data Sharing</h3>
            <p className="text-gray-600">Share reports, call logs, and announcements directly with employees</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Real-Time Updates</h3>
            <p className="text-gray-600">Automatic synchronization of call records and notifications</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Call History</h3>
            <p className="text-gray-600">Complete call history with filters for date, status, and employee performance</p>
          </div>
        </div>
      </main>
    </div>
  );
}