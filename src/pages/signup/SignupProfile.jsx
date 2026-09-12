import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignup } from '../../context/SignupContext';

const SignupProfile = () => {
    const navigate = useNavigate();
    const { formData, updateFormData } = useSignup();
    const [error, setError] = useState('');

    const calculateAge = (dobString) => {
        const dob = new Date(dobString);
        const diffMs = Date.now() - dob.getTime();
        const ageDt = new Date(diffMs);
        return Math.abs(ageDt.getUTCFullYear() - 1970);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!formData.firstName || !formData.lastName || !formData.dob) {
            setError('All fields are required');
            return;
        }

        const age = calculateAge(formData.dob);

        if (age < 5) {
            setError('You must be at least 5 years old to create an account.');
            return;
        }

        if (age < 18) {
            // Auto-route to Child Flow
            updateFormData({ accountType: 'CHILD' });
            alert("You are under 18. Automatically routing to the child account setup.");
            navigate('/signup/child-verify'); // Will implement the child verify step next
            return;
        }

        // Proceed to Mail setup
        navigate('/signup/mail');
    };

    return (
        <div className="animate-fade-in space-y-6">
            <h3 className="text-xl font-bold text-center text-gray-800 dark:text-gray-100">
                Personal Details
            </h3>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                            First Name
                        </label>
                        <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => updateFormData({ firstName: e.target.value })}
                            required
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                            Last Name
                        </label>
                        <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => updateFormData({ lastName: e.target.value })}
                            required
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Date of Birth
                    </label>
                    <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => updateFormData({ dob: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                </div>

                <div className="pt-4 flex justify-between">
                    <button
                        type="button"
                        onClick={() => navigate('/signup/selection')}
                        className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        Back
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                    >
                        Next Step
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SignupProfile;
