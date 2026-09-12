import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignup } from '../../context/SignupContext';
import { authAPI, emailAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SignupPasswordSetup = () => {
    const navigate = useNavigate();
    const { formData, updateFormData } = useSignup();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            // 1. Build Register Payload
            let payload = {
                mode: formData.accountType === 'CHILD' ? 'PERSONAL' : formData.accountType,
                username: formData.username,
                password: formData.password,
                phoneNumber: formData.recoveryPhone || null,
            };

            if (formData.accountType === 'PERSONAL' || formData.accountType === 'CHILD') {
                payload = {
                    ...payload,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    dob: formData.dob,
                    parentEmail: formData.parentEmail || null,
                };
            } else {
                payload = {
                    ...payload,
                    businessName: formData.businessName,
                    businessType: formData.businessType,
                    registrationNumber: formData.registrationNumber,
                    ownerFirstName: formData.ownerFirstName,
                    ownerLastName: formData.ownerLastName,
                };
            }

            // 2. Call Auth Register
            const registerRes = await authAPI.register(payload);
            const tempToken = registerRes.data?.data?.tempToken;

            if (!tempToken) {
                throw new Error("Registration failed to return a temporary token");
            }

            // 3. Create the email mailbox with the tempToken for ALL account types
            await emailAPI.createEmail({
                emailName: formData.username,
                password: formData.password,
            }, tempToken);

            toast.success('Account created successfully! Please log in.');
            navigate('/login');

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Secure your account
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                    Set a strong password for your new account.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Password
                    </label>
                    <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => updateFormData({ password: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                </div>

                <div className="pt-4 flex justify-between">
                    <button
                        type="button"
                        onClick={() => navigate('/signup/mobile-verify')}
                        className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        Back
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50"
                    >
                        {loading ? 'Creating Account...' : 'Complete Setup'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SignupPasswordSetup;
