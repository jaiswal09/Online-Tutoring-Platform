import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { User, Mail, Phone, BookOpen, IndianRupee, Clock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface ProfileData {
  name: string;
  contactNumber: string;
  // Student specific
  preferredSubjects?: string[];
  budgetMin?: number;
  budgetMax?: number;
  // Tutor specific
  subjectsTaught?: string[];
  experienceYears?: number;
  defaultHourlyRate?: number;
  availability?: any;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    contactNumber: '',
    preferredSubjects: [],
    budgetMin: 0,
    budgetMax: 0,
    subjectsTaught: [],
    experienceYears: 0,
    defaultHourlyRate: 0,
    availability: {}
  });

  useEffect(() => {
    if (user?.profile) {
      const profile = user.profile;
      setProfileData({
        name: profile.name || '',
        contactNumber: profile.contactNumber || '',
        // FIX: Ensure preferredSubjects is always an array
        preferredSubjects: Array.isArray(profile.preferredSubjects)
          ? profile.preferredSubjects
          : typeof profile.preferredSubjects === 'string' && profile.preferredSubjects
            ? profile.preferredSubjects.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
            : [],
        budgetMin: profile.budgetMin || 0,
        budgetMax: profile.budgetMax || 0,
        // FIX: Ensure subjectsTaught is always an array
        subjectsTaught: Array.isArray(profile.subjectsTaught)
          ? profile.subjectsTaught
          : typeof profile.subjectsTaught === 'string' && profile.subjectsTaught
            ? profile.subjectsTaught.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
            : [],
        experienceYears: profile.experienceYears || 0,
        defaultHourlyRate: profile.defaultHourlyRate || 0,
        availability: profile.availability
          ? typeof profile.availability === 'string'
            ? JSON.parse(profile.availability)
            : profile.availability
          : {}
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = user?.role === 'STUDENT' ? '/api/profiles/student' : '/api/profiles/tutor';
      
      const updateData = {
        name: profileData.name,
        contactNumber: profileData.contactNumber,
        ...(user?.role === 'STUDENT' && {
          preferredSubjects: profileData.preferredSubjects, // This will be an array
          budgetMin: profileData.budgetMin,
          budgetMax: profileData.budgetMax
        }),
        ...(user?.role === 'TUTOR' && {
          subjectsTaught: profileData.subjectsTaught, // This will be an array
          experienceYears: profileData.experienceYears,
          defaultHourlyRate: profileData.defaultHourlyRate,
          availability: profileData.availability
        })
      };

      await axios.put(endpoint, updateData);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectsChange = (value: string, field: 'preferredSubjects' | 'subjectsTaught') => {
    // This function correctly converts comma-separated string to an array
    const subjects = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    setProfileData(prev => ({
      ...prev,
      [field]: subjects
    }));
  };

  return (
    <Layout title="My Profile">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
            <p className="text-sm text-gray-600">Update your personal information and preferences</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email Address
                </label>
                <input
                  id="emailAddress"
                  type="email"
                  value={user?.email || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Contact Number
                </label>
                <input
                  id="contactNumber"
                  type="tel"
                  value={profileData.contactNumber}
                  onChange={(e) => setProfileData(prev => ({ ...prev, contactNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="userRole" className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <input
                  id="userRole"
                  type="text"
                  value={user?.role || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  disabled
                />
              </div>
            </div>

            {/* Student Specific Fields */}
            {user?.role === 'STUDENT' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Student Preferences</h3>
                
                <div>
                  <label htmlFor="preferredSubjects" className="block text-sm font-medium text-gray-700 mb-2">
                    <BookOpen className="inline h-4 w-4 mr-1" />
                    Preferred Subjects
                  </label>
                  <input
                    id="preferredSubjects"
                    type="text"
                    value={profileData.preferredSubjects?.join(', ') || ''} // This line is safe now
                    onChange={(e) => handleSubjectsChange(e.target.value, 'preferredSubjects')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Mathematics, Physics, Chemistry"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate subjects with commas</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="minBudget" className="block text-sm font-medium text-gray-700 mb-2">
                      <IndianRupee className="inline h-4 w-4 mr-1" />
                      Minimum Budget (₹)
                    </label>
                    <input
                      id="minBudget"
                      type="number"
                      value={profileData.budgetMin || ''}
                      onChange={(e) => setProfileData(prev => ({ ...prev, budgetMin: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label htmlFor="maxBudget" className="block text-sm font-medium text-gray-700 mb-2">
                      <IndianRupee className="inline h-4 w-4 mr-1" />
                      Maximum Budget (₹)
                    </label>
                    <input
                      id="maxBudget"
                      type="number"
                      value={profileData.budgetMax || ''}
                      onChange={(e) => setProfileData(prev => ({ ...prev, budgetMax: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tutor Specific Fields */}
            {user?.role === 'TUTOR' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Tutor Information</h3>
                
                <div>
                  <label htmlFor="subjectsTaught" className="block text-sm font-medium text-gray-700 mb-2">
                    <BookOpen className="inline h-4 w-4 mr-1" />
                    Subjects You Teach
                  </label>
                  <input
                    id="subjectsTaught"
                    type="text"
                    value={profileData.subjectsTaught?.join(', ') || ''} // This line is safe now
                    onChange={(e) => handleSubjectsChange(e.target.value, 'subjectsTaught')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Mathematics, Physics, Chemistry"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate subjects with commas</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="experienceYears" className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="inline h-4 w-4 mr-1" />
                      Experience (Years)
                    </label>
                    <input
                      id="experienceYears"
                      type="number"
                      value={profileData.experienceYears || ''}
                      onChange={(e) => setProfileData(prev => ({ ...prev, experienceYears: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-2">
                      <IndianRupee className="inline h-4 w-4 mr-1" />
                      Hourly Rate (₹)
                    </label>
                    <input
                      id="hourlyRate"
                      type="number"
                      value={profileData.defaultHourlyRate || ''}
                      onChange={(e) => setProfileData(prev => ({ ...prev, defaultHourlyRate: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-md shadow-sm transition duration-150 ease-in-out"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
