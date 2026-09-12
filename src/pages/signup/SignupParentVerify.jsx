import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignup } from '../../context/SignupContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SignupParentVerify = () => {
    const navigate = useNavigate();
    const { formData, updateFormData } = useSignup();
    const [step, setStep] = useState('EMAIL'); // EMAIL or OTP
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!formData.parentEmail) {
            toast.error('Parent email is required');
            return;
        }

        setLoading(true);
        try {
            await authAPI.sendParentOtp({ parentEmail: formData.parentEmail });
            toast.success('Consent code sent to parent email');
            setStep('OTP');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!formData.parentOtp) {
            toast.error('Please enter the OTP');
            return;
        }

        setLoading(true);
        try {
            await authAPI.verifyParentOtp({
                parentEmail: formData.parentEmail,
                otp: formData.parentOtp
            });
            toast.success('Parent verified successfully');
            navigate('/signup/mail');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Parent Verification
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                    Since the account is for a child, we need a parent's consent.
                </p>
            </div>

            {step === 'EMAIL' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                            Parent's Email Address
                        </label>
                        <input
                            type="email"
                            value={formData.parentEmail}
                            onChange={(e) => updateFormData({ parentEmail: e.target.value })}
                            required
                            placeholder="parent@example.com"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                        />
                    </div>

                    <div className="pt-4 flex justify-between">
                        <button
                            type="button"
                            onClick={() => navigate('/signup/child')}
                            className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                            Enter the Consent Code
                        </label>
                        <input
                            type="text"
                            value={formData.parentOtp}
                            onChange={(e) => updateFormData({ parentOtp: e.target.value })}
                            required
                            placeholder="6-digit code"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white text-center tracking-widest text-lg font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Code sent to {formData.parentEmail}. <button type="button" onClick={() => setStep('EMAIL')} className="text-indigo-600 hover:underline">Change email</button>
                        </p>
                    </div>

                    <div className="pt-4 flex justify-between">
                        <button
                            type="button"
                            onClick={() => setStep('EMAIL')}
                            className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default SignupParentVerify;
