export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Call Center Management
        </h1>
        <p className="text-gray-600 text-center mb-8">
          A comprehensive solution for managing call center operations.
        </p>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Features:</h3>
            <ul className="text-blue-700 text-sm mt-2 space-y-1">
              <li>• Employee Management</li>
              <li>• Call Logging & Tracking</li>
              <li>• Data Sharing</li>
              <li>• File Management</li>
            </ul>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Contact admin for access credentials
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}