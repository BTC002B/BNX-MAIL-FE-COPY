import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSignup } from '../../context/SignupContext';

const SignupSelection = () => {
    const navigate = useNavigate();
    const { formData, resetSignupForm, updateFormData } = useSignup();

    const handleSelect = (mode, route) => {
        if (formData.accountType !== mode) {
            resetSignupForm();
            updateFormData({ accountType: mode });
        }
        navigate(route);
    };

    return (
        <div className="flex flex-col gap-6 mt-8 animate-fade-in">
            <h3 className="text-xl font-bold text-center text-gray-800 dark:text-gray-100">
                Who is this account for?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => handleSelect('PERSONAL', '/signup/profile')}
                    className="p-6 bg-gray-50 hover:bg-indigo-50 dark:bg-slate-700 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 rounded-xl transition-all hover:scale-105 shadow-sm text-left group"
                >
                    <div className="text-3xl mb-3">👤</div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">For myself</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">Personal email account for your everyday needs.</p>
                </button>
                
                <button
                    onClick={() => handleSelect('CHILD', '/signup/child')}
                    className="p-6 bg-gray-50 hover:bg-emerald-50 dark:bg-slate-700 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 rounded-xl transition-all hover:scale-105 shadow-sm text-left group"
                >
                    <div className="text-3xl mb-3">👶</div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">For my child</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">Create a managed account for users under 18.</p>
                </button>

                <button
                    onClick={() => handleSelect('BUSINESS', '/signup/business')}
                    className="p-6 bg-gray-50 hover:bg-blue-50 dark:bg-slate-700 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 rounded-xl transition-all hover:scale-105 shadow-sm text-left group"
                >
                    <div className="text-3xl mb-3">🏢</div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">For business</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">Professional accounts linked to your organization.</p>
                </button>
            </div>

            <div className="mt-6 text-center text-sm font-medium">
                <span className="text-gray-500 dark:text-gray-400">Already have an account? </span>
                <Link to="/login" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                    Sign in here
                </Link>
            </div>
        </div>
    );
};

export default SignupSelection;
