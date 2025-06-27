import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { BookOpen, Mail, Lock, User, Phone, IndianRupee, Book, GraduationCap, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
// FIX: Corrected import path for AuthContext. Assuming it's two levels up from RegisterPage.tsx,
// e.g., if RegisterPage is in 'src/pages/Auth/RegisterPage.tsx' and AuthContext is in 'src/contexts/AuthContext.tsx'
// Update the import path below to the correct relative path for your project structure.
// For example, if AuthContext is in 'src/contexts/AuthContext.tsx', use '../contexts/AuthContext'.
// If it's in 'src/context/AuthContext.tsx', use '../context/AuthContext'.
// If you are unsure, check your folder structure and adjust accordingly.
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

// Define the shape of the form data
interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  name: string;
  contactNumber?: string;
  preferredSubjects?: string; // Changed to string for comma-separated input
  budgetMin?: number;
  budgetMax?: number;
  subjectsTaught?: string; // Changed to string for comma-separated input
  experienceYears?: number;
  defaultHourlyRate?: number;
}

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { register: registerUser } = useAuth(); // Destructure registerUser from useAuth
  const navigate = useNavigate();
  const { 
    register, 
    handleSubmit, 
    watch, 
    setValue, // Added setValue to programmatically update form fields
    formState: { errors } 
  } = useForm<RegisterFormData>({
    // Set default role based on URL search params or 'student'
    defaultValues: {
      role: searchParams.get('role') || 'student'
    }
  });

  // Watch for changes in selected role and password fields
  const selectedRole = watch('role');
  const password = watch('password');

  // Handle form submission
  const onSubmit = async (data: RegisterFormData) => {
    // Client-side password confirmation
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true); // Start loading state
    try {
      // Prepare profile data based on selected role
      const profileData: any = {
        name: data.name,
        contactNumber: data.contactNumber,
      };

      if (data.role === 'student') {
        profileData.preferredSubjects = data.preferredSubjects ? data.preferredSubjects.split(',').map(s => s.trim()) : [];
        profileData.budgetMin = data.budgetMin;
        profileData.budgetMax = data.budgetMax;
      } else if (data.role === 'tutor') {
        profileData.subjectsTaught = data.subjectsTaught ? data.subjectsTaught.split(',').map(s => s.trim()) : [];
        profileData.experienceYears = data.experienceYears || 0;
        profileData.defaultHourlyRate = data.defaultHourlyRate || 0;
        profileData.availability = {}; // Initialize availability object for tutors
      }

      // Call the registerUser function from AuthContext
      const userData = await registerUser({
        email: data.email,
        password: data.password,
        role: data.role,
        profileData
      });

      toast.success('Registration successful! Redirecting...');
      
      // Redirect based on the role received from the backend
      if (userData?.role === 'ADMIN') { // Use optional chaining for safety
        navigate('/admin/dashboard');
      } else if (userData?.role === 'TUTOR') {
        navigate('/tutor/dashboard');
      } else if (userData?.role === 'STUDENT') {
        navigate('/student/dashboard');
      } else {
        navigate('/'); // Fallback if role is not recognized
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      // Display a more user-friendly error message
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false); // End loading state
    }
  };

  // Input field component for consistent styling
  const InputField: React.FC<{
    label: string;
    name: keyof RegisterFormData;
    type: string;
    icon: React.ElementType;
    placeholder: string;
    error?: string;
    isOptional?: boolean;
    register: any; // react-hook-form register function
    watch?: any; // react-hook-form watch function
  }> = ({ label, name, type, icon: Icon, placeholder, error, isOptional = false, register: formRegister }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-gray-700">
        {label} {isOptional && <span className="text-gray-500 font-normal text-xs">(Optional)</span>}
      </label>
      <div className="mt-2 relative rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          id={name}
          type={type}
          {...formRegister(name, { 
            required: isOptional ? false : `${label} is required`,
            // Add specific validation for email and password if needed
            ...(name === 'email' && { pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' } }),
            ...(name === 'password' && { minLength: { value: 6, message: 'Password must be at least 6 characters' } }),
          })}
          className={`block w-full pl-10 pr-3 py-2 border ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          } rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-400 sm:text-sm transition duration-200 ease-in-out transform`}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : undefined}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600 font-medium" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 50 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl space-y-8 border border-blue-200"
      >
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <BookOpen className="h-16 w-16 text-blue-600 animate-pulse-slow" /> {/* Creative icon with subtle animation */}
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Create Your SchoolSync Account
          </h2>
          <p className="mt-2 text-sm text-gray-600 max-w-sm mx-auto">
            Join our community to connect with resources or share your knowledge.
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
            >
              sign in to an existing account
            </Link>
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Role Selection */}
          <div className="bg-blue-50 p-4 rounded-lg shadow-inner">
            <label className="block text-sm font-bold text-gray-800 mb-3">
              I want to register as a:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label 
                className={`flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out border-2 ${
                  selectedRole === 'student' ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                <input
                  {...register('role', { required: 'Please select a role' })}
                  type="radio"
                  value="student"
                  className="hidden" // Hide default radio button
                />
                <GraduationCap className="h-5 w-5 mr-2" />
                <span className="font-semibold text-sm">Student</span>
              </label>
              <label 
                className={`flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out border-2 ${
                  selectedRole === 'tutor' ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                <input
                  {...register('role', { required: 'Please select a role' })}
                  type="radio"
                  value="tutor"
                  className="hidden" // Hide default radio button
                />
                <Book className="h-5 w-5 mr-2" />
                <span className="font-semibold text-sm">Tutor</span>
              </label>
            </div>
            {errors.role && <p className="mt-2 text-xs text-red-600 font-medium text-center">{errors.role.message}</p>}
          </div>

          {/* Basic Information Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
              label="Full Name" 
              name="name" 
              type="text" 
              icon={User} 
              placeholder="John Doe" 
              register={register} 
              error={errors.name?.message} 
            />
            <InputField 
              label="Email Address" 
              name="email" 
              type="email" 
              icon={Mail} 
              placeholder="you@example.com" 
              register={register} 
              error={errors.email?.message} 
            />
            <InputField 
              label="Phone Number" 
              name="contactNumber" 
              type="tel" 
              icon={Phone} 
              placeholder="e.g., +91 9876543210" 
              register={register} 
              isOptional 
            />
            <InputField 
              label="Create Password" 
              name="password" 
              type="password" 
              icon={Lock} 
              placeholder="••••••••" 
              register={register} 
              error={errors.password?.message} 
            />
            <InputField 
              label="Confirm Password" 
              name="confirmPassword" 
              type="password" 
              icon={Lock} 
              placeholder="••••••••" 
              register={register} 
              error={errors.confirmPassword?.message} 
            />
          </div>

          {/* Role-specific fields */}
          {selectedRole === 'student' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3 }}
              className="space-y-6 border-t pt-6 border-gray-200"
            >
              <h3 className="text-lg font-bold text-gray-800">Student Preferences</h3>
              <InputField 
                label="Preferred Subjects (comma-separated)" 
                name="preferredSubjects" 
                type="text" 
                icon={Book} 
                placeholder="Math, Science, English" 
                register={register} 
                isOptional 
              />
              <div className="grid grid-cols-2 gap-6">
                <InputField 
                  label="Budget Min (₹)" 
                  name="budgetMin" 
                  type="number" 
                  icon={IndianRupee} 
                  placeholder="200" 
                  register={register} 
                  isOptional 
                />
                <InputField 
                  label="Budget Max (₹)" 
                  name="budgetMax" 
                  type="number" 
                  icon={IndianRupee} 
                  placeholder="500" 
                  register={register} 
                  isOptional 
                />
              </div>
            </motion.div>
          )}

          {selectedRole === 'tutor' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3 }}
              className="space-y-6 border-t pt-6 border-gray-200"
            >
              <h3 className="text-lg font-bold text-gray-800">Tutor Details</h3>
              <InputField 
                label="Subjects You Teach (comma-separated)" 
                name="subjectsTaught" 
                type="text" 
                icon={Book} 
                placeholder="Algebra, Physics, Literature" 
                register={register} 
                isOptional 
              />
              <div className="grid grid-cols-2 gap-6">
                <InputField 
                  label="Experience (Years)" 
                  name="experienceYears" 
                  type="number" 
                  icon={Activity} 
                  placeholder="3" 
                  register={register} 
                  isOptional 
                />
                <InputField 
                  label="Default Hourly Rate (₹)" 
                  name="defaultHourlyRate" 
                  type="number" 
                  icon={IndianRupee} 
                  placeholder="250" 
                  register={register} 
                  isOptional 
                />
              </div>
            </motion.div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-6 border border-transparent rounded-lg shadow-xl text-lg font-semibold text-white 
                         bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                         disabled:opacity-60 disabled:cursor-not-allowed transition duration-300 ease-in-out transform hover:scale-105"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
