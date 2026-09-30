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
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');

    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        setError('');

        if (!formData.parentEmail) {
            const err = 'Parent email is required';
            setError(err);
            toast.error(err);
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.sendParentOtp({ parentEmail: formData.parentEmail });
            if (response.data && response.data.success === false) {
                const errMsg = response.data.message || 'Failed to send OTP';
                setError(errMsg);
                toast.error(errMsg);
                return;
            }
            toast.success('Consent code sent to parent email');
            setError('');
            setStep('OTP');
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Failed to send OTP';
            setError(errMsg);
            toast.error(errMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setResending(true);
        try {
            const response = await authAPI.sendParentOtp({ parentEmail: formData.parentEmail });
            if (response.data && response.data.success === false) {
                const errMsg = response.data.message || 'Failed to resend OTP';
                setError(errMsg);
                toast.error(errMsg);
                return;
            }
            toast.success('Consent code resent to parent email');
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Failed to resend OTP';
            setError(errMsg);
            toast.error(errMsg);
        } finally {
            setResending(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');

        const otp = (formData.parentOtp || '').trim();

        if (!otp) {
            const msg = 'Please enter the consent code.';
            setError(msg);
            toast.error(msg);
            return;
        }

        if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
            const msg = 'Invalid OTP. Please enter the correct OTP.';
            setError(msg);
            toast.error(msg);
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.verifyParentOtp({
                parentEmail: formData.parentEmail,
                otp: otp
            });

            if (response.data && response.data.success === false) {
                const msg = 'Invalid OTP. Please enter the correct OTP.';
                setError(msg);
                toast.error(msg);
                return;
            }

            toast.success('Parent verified successfully');
            navigate('/signup/mail');
        } catch (err) {
            const serverMsg = err.response?.data?.message || '';
            const msg = (
                serverMsg.toLowerCase().includes('invalid') || 
                serverMsg.toLowerCase().includes('incorrect') || 
                serverMsg.toLowerCase().includes('wrong') || 
                serverMsg.toLowerCase().includes('mismatch') || 
                serverMsg.toLowerCase().includes('expired') || 
                !serverMsg
            )
                ? 'Invalid OTP. Please enter the correct OTP.'
                : serverMsg;
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setError('');
        if (step === 'OTP') {
            setStep('EMAIL');
            return;
        }
        
        navigate('/signup/child');
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

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium animate-fadeIn flex items-center justify-between">
                    <span>{error}</span>
                    <button 
                        type="button" 
                        onClick={() => setError('')} 
                        className="text-red-400 hover:text-red-600 dark:hover:text-red-200 ml-2 font-bold"
                    >
                        ✕
                    </button>
                </div>
            )}

            {step === 'EMAIL' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                            Parent's Email Address
                        </label>
                        <input
                            type="email"
                            value={formData.parentEmail || ''}
                            onChange={(e) => {
                                setError('');
                                updateFormData({ parentEmail: e.target.value });
                            }}
                            required
                            placeholder="parent@example.com"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                        />
                    </div>

                    <div className="pt-4 flex justify-between">
                        <button
                            type="button"
                            onClick={handleBack}
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
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            value={formData.parentOtp || ''}
                            onChange={(e) => {
                                const cleanDigits = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setError('');
                                updateFormData({ parentOtp: cleanDigits });
                            }}
                            required
                            placeholder="123456"
                            className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-slate-600 focus:ring-indigo-500'} rounded-xl focus:ring-2 outline-none dark:text-white text-center tracking-widest text-lg font-mono transition-all`}
                        />
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 mt-2 px-1">
                            <span>
                                Code sent to <span className="font-semibold text-gray-700 dark:text-gray-300">{formData.parentEmail}</span>.
                            </span>
                            <div className="flex items-center gap-2">
                                <button 
                                    type="button" 
                                    disabled={resending}
                                    onClick={handleResendOtp} 
                                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium disabled:opacity-50"
                                >
                                    {resending ? 'Resending...' : 'Resend Code'}
                                </button>
                                <span>•</span>
                                <button 
                                    type="button" 
                                    onClick={() => { setError(''); setStep('EMAIL'); }} 
                                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                                >
                                    Change email
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-between">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (formData.parentOtp || '').length !== 6}
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
