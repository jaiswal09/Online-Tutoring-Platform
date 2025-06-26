import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Users, BookOpen, IndianRupee, TrendingUp, Plus, Eye, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  profile: any;
}

interface Student {
  id: string;
  userId: string;
  name: string;
  email: string;
  contactNumber: string;
  preferredSubjects: string[];
  budgetMin: number;
  budgetMax: number;
}

interface Tutor {
  id: string;
  userId: string;
  name: string;
  email: string;
  contactNumber: string;
  subjectsTaught: string[];
  experienceYears: number;
  defaultHourlyRate: number;
}

interface Assignment {
  id: string;
  subject: string;
  totalFeeToStudent: number;
  adminSetTutorFee: number;
  platformCommission: number;
  status: string;
  createdAt: string;
  student: { name: string };
  tutor: { name: string };
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
  const [students, setStudents] = useState<Student[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching admin dashboard data...');
      
      // Fetch all necessary data concurrently
      const [usersRes, studentsRes, tutorsRes, assignmentsRes, statsRes] = await Promise.all([
        axios.get('/api/admin/users').catch(err => {
          console.error('Users fetch failed:', err);
          return { data: [] };
        }),
        axios.get('/api/admin/students').catch(err => {
          console.error('Students fetch failed:', err);
          return { data: [] };
        }),
        axios.get('/api/admin/tutors').catch(err => {
          console.error('Tutors fetch failed:', err);
          return { data: [] };
        }),
        axios.get('/api/admin/assignments').catch(err => {
          console.error('Assignments fetch failed:', err);
          return { data: [] };
        }),
        axios.get('/api/admin/stats').catch(err => {
          console.error('Stats fetch failed:', err);
          return { data: { totalUsers: 0, totalStudents: 0, totalTutors: 0, totalAssignments: 0, activeAssignments: 0, totalRevenue: 0, pendingPayments: 0 } };
        })
      ]);
      
      console.log('API Responses:', {
        users: usersRes.data?.length || 0,
        students: studentsRes.data?.length || 0,
        tutors: tutorsRes.data?.length || 0,
        assignments: assignmentsRes.data?.length || 0,
        stats: statsRes.data
      });
      
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
      setTutors(Array.isArray(tutorsRes.data) ? tutorsRes.data : []);
      setAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
      setStats(statsRes.data || {
        totalUsers: 0,
        totalStudents: 0,
        totalTutors: 0,
        totalAssignments: 0,
        activeAssignments: 0,
        totalRevenue: 0,
        pendingPayments: 0
      });
      
      // Show success message if data was loaded
      if (usersRes.data?.length > 0 || studentsRes.data?.length > 0 || tutorsRes.data?.length > 0) {
        toast.success('Dashboard data loaded successfully');
      }
      
    } catch (error: any) {
      console.error('Dashboard data fetch error:', error);
      setError('Failed to load dashboard data. Please check your connection and try again.');
      toast.error('Failed to load dashboard data');
      
      // Set empty defaults
      setUsers([]);
      setStudents([]);
      setTutors([]);
      setAssignments([]);
      setStats({
        totalUsers: 0,
        totalStudents: 0,
        totalTutors: 0,
        totalAssignments: 0,
        activeAssignments: 0,
        totalRevenue: 0,
        pendingPayments: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentId || !formData.tutorId || !formData.subject || 
        !formData.totalFeeToStudent || !formData.adminSetTutorFee) {
      toast.error('All fields are required');
      return;
    }

    try {
      await axios.post('/api/admin/assignments', {
        studentId: formData.studentId,
        tutorId: formData.tutorId,
        subject: formData.subject,
        totalFeeToStudent: parseFloat(formData.totalFeeToStudent),
        adminSetTutorFee: parseFloat(formData.adminSetTutorFee)
      });

      toast.success('Assignment created successfully!');
      setShowCreateForm(false);
      setFormData({
        studentId: '',
        tutorId: '',
        subject: '',
        totalFeeToStudent: '',
        adminSetTutorFee: ''
      });
      fetchData();
    } catch (error: any) {
      console.error('Assignment creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create assignment');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
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
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout title="Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button
                  onClick={fetchData}
                  className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Debug Information</h3>
          <div className="text-xs text-blue-700 space-y-1">
            <p>Users loaded: {users.length}</p>
            <p>Students loaded: {students.length}</p>
            <p>Tutors loaded: {tutors.length}</p>
            <p>Assignments loaded: {assignments.length}</p>
            <p>Stats loaded: {stats ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'users', name: `Users (${users.length})` },
              { id: 'assignments', name: `Assignments (${assignments.length})` },
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
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalAssignments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Assignments</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.activeAssignments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <IndianRupee className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Platform Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900">₹{(stats.totalRevenue ?? 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          <div className="space-y-6">
            {/* Students Section */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Students ({students.length})</h2>
              </div>
              
              {students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Budget Range
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subjects
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name || 'No name'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{student.contactNumber || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              ₹{student.budgetMin || 0} - ₹{student.budgetMax || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {Array.isArray(student.preferredSubjects) 
                                ? student.preferredSubjects.join(', ') || 'None'
                                : 'None'
                              }
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Students will appear here once they register.
                  </p>
                </div>
              )}
            </div>

            {/* Tutors Section */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Tutors ({tutors.length})</h2>
              </div>
              
              {tutors.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Experience
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subjects
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tutors.map((tutor) => (
                        <tr key={tutor.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {tutor.name || 'No name'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{tutor.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{tutor.contactNumber || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{tutor.experienceYears || 0} years</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">₹{tutor.defaultHourlyRate || 0}/hr</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {Array.isArray(tutor.subjectsTaught) 
                                ? tutor.subjectsTaught.join(', ') || 'None'
                                : 'None'
                              }
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No tutors found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Tutors will appear here once they register.
                  </p>
                </div>
              )}
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
                disabled={students.length === 0 || tutors.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </button>
            </div>

            {/* Warning if no students or tutors */}
            {(students.length === 0 || tutors.length === 0) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Cannot Create Assignments</h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      You need at least one student and one tutor to create assignments.
                      {students.length === 0 && ' No students found.'}
                      {tutors.length === 0 && ' No tutors found.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Create Assignment Form */}
            {showCreateForm && students.length > 0 && tutors.length > 0 && (
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
                          <option key={student.id} value={student.id}>
                            {student.name} ({student.email})
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
                          <option key={tutor.id} value={tutor.id}>
                            {tutor.name} ({tutor.email})
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
                      <label htmlFor="totalFeeToStudent" className="block text-sm font-medium text-gray-700">Total Fee to Student (₹)</label>
                      <input
                        type="number"
                        id="totalFeeToStudent"
                        step="0.01"
                        value={formData.totalFeeToStudent}
                        onChange={(e) => setFormData({...formData, totalFeeToStudent: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="500.00"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="adminSetTutorFee" className="block text-sm font-medium text-gray-700">Tutor's Fee (₹)</label>
                      <input
                        type="number"
                        id="adminSetTutorFee"
                        step="0.01"
                        value={formData.adminSetTutorFee}
                        onChange={(e) => setFormData({...formData, adminSetTutorFee: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="400.00"
                        required
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="text-sm text-gray-600">
                        Platform Commission: ₹
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
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition duration-150 ease-in-out"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition duration-150 ease-in-out"
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
              
              {assignments.length > 0 ? (
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
                              ₹{(assignment.totalFeeToStudent ?? 0).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-green-600">
                              ₹{(assignment.adminSetTutorFee ?? 0).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-blue-600">
                              ₹{(assignment.platformCommission ?? 0).toFixed(2)}
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
              ) : (
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
                <IndianRupee className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Payment monitoring</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Payment details and UPI/Stripe integration will be implemented here.
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