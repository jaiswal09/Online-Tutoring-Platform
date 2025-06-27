import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Users, BookOpen, IndianRupee, TrendingUp, Plus, Eye, AlertCircle, BarChart3, Activity } from 'lucide-react';
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
        toast.success('Dashboard data loaded successfully! 📊');
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

      toast.success('Assignment created successfully! 🎉');
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
      'PENDING_OFFER': 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300',
      'TUTOR_ACCEPTED': 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300',
      'TUTOR_DECLINED': 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300',
      'PAYMENT_PENDING': 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300',
      'IN_PROGRESS': 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300',
      'COMPLETED': 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300',
      'CANCELED': 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300'
    };

    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'} animate-fadeInUp`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout title="Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center animate-fadeInUp">
            <div className="spinner w-12 h-12 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-8">
        {/* Error Message */}
        {error && (
          <div className="card bg-red-50 border-red-200 p-4 animate-fadeInUp">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button
                  onClick={fetchData}
                  className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors duration-300"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 animate-fadeInUp">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'users', name: `Users (${users.length})`, icon: Users },
              { id: 'assignments', name: `Assignments (${assignments.length})`, icon: BookOpen },
              { id: 'payments', name: 'Payments', icon: IndianRupee }
            ].map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-300 animate-slideInLeft stagger-${index + 1} ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'} transition-colors duration-300`} />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card card-hover p-6 animate-fadeInUp stagger-1">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12% from last month
                    </p>
                  </div>
                </div>
              </div>

              <div className="card card-hover p-6 animate-fadeInUp stagger-2">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalAssignments}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +8% from last month
                    </p>
                  </div>
                </div>
              </div>

              <div className="card card-hover p-6 animate-fadeInUp stagger-3">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Assignments</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeAssignments}</p>
                    <p className="text-xs text-blue-600 flex items-center mt-1">
                      <Activity className="h-3 w-3 mr-1" />
                      Currently active
                    </p>
                  </div>
                </div>
              </div>

              <div className="card card-hover p-6 animate-fadeInUp stagger-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <IndianRupee className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Platform Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">₹{(stats.totalRevenue ?? 0).toFixed(2)}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +15% from last month
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="card p-6 animate-fadeInUp stagger-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  User Breakdown
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Students</span>
                    <span className="font-bold text-blue-600">{stats.totalStudents}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Tutors</span>
                    <span className="font-bold text-green-600">{stats.totalTutors}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Pending Payments</span>
                    <span className="font-bold text-yellow-600">{stats.pendingPayments}</span>
                  </div>
                </div>
              </div>

              <div className="card p-6 animate-fadeInUp stagger-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-purple-600" />
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab('assignments')}
                    className="w-full text-left px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-300 hover:scale-105 hover:shadow-md"
                  >
                    <div className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Assignment
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="w-full text-left px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-lg hover:from-green-100 hover:to-green-200 transition-all duration-300 hover:scale-105 hover:shadow-md"
                  >
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Users
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="w-full text-left px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all duration-300 hover:scale-105 hover:shadow-md"
                  >
                    <div className="flex items-center">
                      <IndianRupee className="h-4 w-4 mr-2" />
                      View Payments
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab Content */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            {/* Students Section */}
            <div className="card animate-fadeInUp">
              <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Students ({students.length})
                </h2>
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
                      {students.map((student, index) => (
                        <tr key={student.id} className={`hover:bg-gray-50 transition-colors duration-300 animate-fadeInUp stagger-${(index % 6) + 1}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {student.name?.charAt(0) || 'S'}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {student.name || 'No name'}
                                </div>
                              </div>
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
                  <Users className="mx-auto h-12 w-12 text-gray-400 animate-float" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Students will appear here once they register.
                  </p>
                </div>
              )}
            </div>

            {/* Tutors Section */}
            <div className="card animate-fadeInUp stagger-2">
              <div className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-green-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                  Tutors ({tutors.length})
                </h2>
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
                      {tutors.map((tutor, index) => (
                        <tr key={tutor.id} className={`hover:bg-gray-50 transition-colors duration-300 animate-fadeInUp stagger-${(index % 6) + 1}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {tutor.name?.charAt(0) || 'T'}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {tutor.name || 'No name'}
                                </div>
                              </div>
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
                            <div className="text-sm font-medium text-green-600">₹{tutor.defaultHourlyRate || 0}/hr</div>
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
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 animate-float" />
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
          <div className="space-y-8">
            <div className="flex justify-between items-center animate-fadeInUp">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                Assignment Management
              </h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                disabled={students.length === 0 || tutors.length === 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </button>
            </div>

            {/* Warning if no students or tutors */}
            {(students.length === 0 || tutors.length === 0) && (
              <div className="card bg-yellow-50 border-yellow-200 p-4 animate-fadeInUp">
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
              <div className="card p-6 animate-scaleIn">
                <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-blue-600" />
                  Create New Assignment
                </h3>
                <form onSubmit={handleCreateAssignment} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="animate-slideInLeft stagger-1">
                      <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                      <select
                        id="studentId"
                        value={formData.studentId}
                        onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                        className="input-modern"
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

                    <div className="animate-slideInRight stagger-1">
                      <label htmlFor="tutorId" className="block text-sm font-medium text-gray-700 mb-2">Tutor</label>
                      <select
                        id="tutorId"
                        value={formData.tutorId}
                        onChange={(e) => setFormData({...formData, tutorId: e.target.value})}
                        className="input-modern"
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

                    <div className="animate-slideInLeft stagger-2">
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                      <input
                        type="text"
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        className="input-modern"
                        placeholder="e.g., Mathematics"
                        required
                      />
                    </div>

                    <div className="animate-slideInRight stagger-2">
                      <label htmlFor="totalFeeToStudent" className="block text-sm font-medium text-gray-700 mb-2">Total Fee to Student (₹)</label>
                      <input
                        type="number"
                        id="totalFeeToStudent"
                        step="0.01"
                        value={formData.totalFeeToStudent}
                        onChange={(e) => setFormData({...formData, totalFeeToStudent: e.target.value})}
                        className="input-modern"
                        placeholder="500.00"
                        required
                      />
                    </div>

                    <div className="animate-slideInLeft stagger-3">
                      <label htmlFor="adminSetTutorFee" className="block text-sm font-medium text-gray-700 mb-2">Tutor's Fee (₹)</label>
                      <input
                        type="number"
                        id="adminSetTutorFee"
                        step="0.01"
                        value={formData.adminSetTutorFee}
                        onChange={(e) => setFormData({...formData, adminSetTutorFee: e.target.value})}
                        className="input-modern"
                        placeholder="400.00"
                        required
                      />
                    </div>

                    <div className="flex items-end animate-slideInRight stagger-3">
                      <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                        <div className="text-sm font-medium text-green-800">
                          Platform Commission: ₹
                          {formData.totalFeeToStudent && formData.adminSetTutorFee 
                            ? (parseFloat(formData.totalFeeToStudent) - parseFloat(formData.adminSetTutorFee)).toFixed(2)
                            : '0.00'
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 animate-fadeInUp stagger-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      Create Assignment
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Assignments List */}
            <div className="card animate-fadeInUp">
              <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-purple-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
                  All Assignments
                </h3>
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
                      {assignments.map((assignment, index) => (
                        <tr key={assignment.id} className={`hover:bg-gray-50 transition-colors duration-300 animate-fadeInUp stagger-${(index % 6) + 1}`}>
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
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 animate-float" />
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
          <div className="card animate-fadeInUp">
            <div className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-green-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <IndianRupee className="h-5 w-5 mr-2 text-green-600" />
                Payment Monitoring
              </h2>
            </div>
            
            <div className="p-6">
              <div className="text-center py-12">
                <IndianRupee className="mx-auto h-12 w-12 text-gray-400 animate-float" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Payment monitoring</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Payment details and UPI/Stripe integration will be implemented here.
                </p>
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    💡 Coming soon: Real-time payment tracking, transaction history, and automated reconciliation
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;