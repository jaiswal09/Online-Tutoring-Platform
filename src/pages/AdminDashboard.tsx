import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout'; // Path remains the same, assuming Layout.tsx is now in ../components/
import { Users, BookOpen, DollarSign, TrendingUp, Plus, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  profile: any; // Consider a more specific interface for profile based on role
}

interface Assignment {
  id: string;
  subject: string;
  totalFeeToStudent: number;
  adminSetTutorFee: number;
  platformCommission: number;
  status: string;
  createdAt: string;
  student: { name: string }; // Assuming student name is always present
  tutor: { name: string }; // Assuming tutor name is always present
}

interface Stats {
  totalUsers: number;
  totalStudents: number;
  totalTutors: number;
  totalAssignments: number;
  activeAssignments: number;
  totalRevenue: number;
  pendingPayments: number;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null); // stats can be null initially
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create assignment form state
  const [formData, setFormData] = useState({
    studentId: '',
    tutorId: '',
    subject: '',
    totalFeeToStudent: '',
    adminSetTutorFee: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all necessary data concurrently
      const [usersRes, assignmentsRes, statsRes] = await Promise.all([
        axios.get('/api/admin/users'),
        axios.get('/api/admin/assignments'),
        axios.get('/api/admin/stats')
      ]);
      
      // Ensure data is array before setting, fallback to empty array
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
      setStats(statsRes.data); // Set stats data
    } catch (error) {
      toast.error('Failed to load dashboard data');
      // Set to empty arrays or null on error to prevent further crashes
      setUsers([]); 
      setAssignments([]);
      setStats(null); 
    } finally {
      setLoading(false); // Always set loading to false after fetch attempt
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic form validation
    if (!formData.studentId || !formData.tutorId || !formData.subject || 
        !formData.totalFeeToStudent || !formData.adminSetTutorFee) {
      toast.error('All fields are required');
      return;
    }

    try {
      // Send new assignment data to the API
      await axios.post('/api/admin/assignments', {
        studentId: formData.studentId,
        tutorId: formData.tutorId,
        subject: formData.subject,
        totalFeeToStudent: parseFloat(formData.totalFeeToStudent),
        adminSetTutorFee: parseFloat(formData.adminSetTutorFee)
      });

      toast.success('Assignment created successfully!');
      setShowCreateForm(false); // Close form
      // Reset form fields
      setFormData({
        studentId: '',
        tutorId: '',
        subject: '',
        totalFeeToStudent: '',
        adminSetTutorFee: ''
      });
      fetchData(); // Refresh all dashboard data to show the new assignment
    } catch (error: any) {
      // Display error message from API or a generic one
      toast.error(error.response?.data?.message || 'Failed to create assignment');
    }
  };

  // Helper function to get status badge styling
  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = { // Define type for statusColors
      'PENDING_OFFER': 'bg-yellow-100 text-yellow-800',
      'TUTOR_ACCEPTED': 'bg-green-100 text-green-800',
      'TUTOR_DECLINED': 'bg-red-100 text-red-800',
      'PAYMENT_PENDING': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-purple-100 text-purple-800',
      'COMPLETED': 'bg-gray-100 text-gray-800',
      'CANCELED': 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')} {/* Replace underscores for better display */}
      </span>
    );
  };

  // Filter users by role for assignment creation dropdowns
  const students = users.filter(u => u.role === 'STUDENT');
  const tutors = users.filter(u => u.role === 'TUTOR');

  // Show a loading spinner while data is being fetched
  if (loading) {
    return (
      <Layout title="Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'users', name: 'Users' },
              { id: 'assignments', name: 'Assignments' },
              { id: 'payments', name: 'Payments' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && stats && ( // Ensure stats object exists before rendering
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Users Card */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>

              {/* Total Assignments Card */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalAssignments}</p>
                  </div>
                </div>
              </div>

              {/* Active Assignments Card */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Assignments</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.activeAssignments}</p>
                  </div>
                </div>
              </div>

              {/* Platform Revenue Card */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Platform Revenue</p>
                    {/* FIXED: Added nullish coalescing to safely call toFixed() */}
                    <p className="text-2xl font-semibold text-gray-900">${(stats.totalRevenue ?? 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Breakdown Section */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Students</span>
                    <span className="font-medium">{stats.totalStudents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tutors</span>
                    <span className="font-medium">{stats.totalTutors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending Payments</span>
                    <span className="font-medium">{stats.pendingPayments}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Section */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab('assignments')}
                    className="w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Create New Assignment
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    Manage Users
                  </button>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="w-full text-left px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    View Payments
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab Content */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profile
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.profile?.name || 'No name'} {/* Safely access profile.name */}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'STUDENT' 
                            ? 'bg-blue-100 text-blue-800'
                            : user.role === 'TUTOR'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.profile && ( // Only render profile details if profile exists
                          <div className="text-sm text-gray-500">
                            {user.role === 'STUDENT' && (
                              <span>Budget: ${user.profile.budgetMin ?? 0} - ${user.profile.budgetMax ?? 0}</span>
                            )}
                            {user.role === 'TUTOR' && (
                              <span>Rate: ${user.profile.defaultHourlyRate ?? 0}/hr</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Assignments Tab Content */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Assignment Management</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition duration-150 ease-in-out"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </button>
            </div>

            {/* Create Assignment Form */}
            {showCreateForm && (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Assignment</h3>
                <form onSubmit={handleCreateAssignment} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">Student</label>
                      <select
                        id="studentId"
                        value={formData.studentId}
                        onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select a student</option>
                        {students.map((student) => (
                          <option key={student.id} value={student.id}> {/* Changed to student.id for actual ID */}
                            {student.profile?.name} ({student.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="tutorId" className="block text-sm font-medium text-gray-700">Tutor</label>
                      <select
                        id="tutorId"
                        value={formData.tutorId}
                        onChange={(e) => setFormData({...formData, tutorId: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select a tutor</option>
                        {tutors.map((tutor) => (
                          <option key={tutor.id} value={tutor.id}> {/* Changed to tutor.id for actual ID */}
                            {tutor.profile?.name} ({tutor.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                      <input
                        type="text"
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Mathematics"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="totalFeeToStudent" className="block text-sm font-medium text-gray-700">Total Fee to Student ($)</label>
                      <input
                        type="number"
                        id="totalFeeToStudent"
                        step="0.01"
                        value={formData.totalFeeToStudent}
                        onChange={(e) => setFormData({...formData, totalFeeToStudent: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="50.00"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="adminSetTutorFee" className="block text-sm font-medium text-gray-700">Tutor's Fee ($)</label>
                      <input
                        type="number"
                        id="adminSetTutorFee"
                        step="0.01"
                        value={formData.adminSetTutorFee}
                        onChange={(e) => setFormData({...formData, adminSetTutorFee: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="40.00"
                        required
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="text-sm text-gray-600">
                        Platform Commission: $
                        {/* Calculate commission, default to '0.00' if values are not numbers */}
                        {formData.totalFeeToStudent && formData.adminSetTutorFee 
                          ? (parseFloat(formData.totalFeeToStudent) - parseFloat(formData.adminSetTutorFee)).toFixed(2)
                          : '0.00'
                        }
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md shadow-sm transition duration-150 ease-in-out"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition duration-150 ease-in-out"
                    >
                      Create Assignment
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Assignments List */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">All Assignments</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tutor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Fee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tutor Fee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commission
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.student.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.tutor.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.subject}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {/* Ensure totalFeeToStudent is a number before toFixed */}
                            ${(assignment.totalFeeToStudent ?? 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">
                            {/* Ensure adminSetTutorFee is a number before toFixed */}
                            ${(assignment.adminSetTutorFee ?? 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-blue-600">
                            {/* Ensure platformCommission is a number before toFixed */}
                            ${(assignment.platformCommission ?? 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(assignment.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(assignment.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {assignments.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create your first assignment to get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payments Tab Content */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Payment Monitoring</h2>
            </div>
            
            <div className="p-6">
              <div className="text-center py-12">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Payment monitoring</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Payment details and Stripe integration will be implemented here.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
