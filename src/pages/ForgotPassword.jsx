import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import logo from "../assets/bnx-remove.png";
import { MdEmail, MdPhone, MdArrowBack, MdLock, MdCheckCircle } from 'react-icons/md';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [identifier, setIdentifier] = useState('');
    const [options, setOptions] = useState(null);
    const [selectedMethod, setSelectedMethod] = useState('');
    const [otp, setOtp] = useState('');
    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const handleGetOptions = async (e) => {
        e.preventDefault();
        if (!identifier) return toast.error("Please enter your email or username");
        
        setLoading(true);
        try {
            const res = await authAPI.getForgotPasswordOptions(identifier);
            if (res.data && res.data.success === false) {
                toast.error(res.data.message || "Failed to find account");
                return;
            }
            
            if (res.data.success) {
                const { recoveryEmail, phoneNumber } = res.data.data;
                if (!recoveryEmail && !phoneNumber) {
                    toast.error("No recovery methods found for this account. Please contact support.");
                    return;
                }
                setOptions(res.data.data);
                setStep(2);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "User not found");
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async (method) => {
        setSelectedMethod(method);
        setLoading(true);
        try {
            const res = await authAPI.sendOTP({ identifier, method });
            if (res.data && res.data.success === false) {
                toast.error(res.data.message || "Failed to send OTP");
                return;
            }

            if (res.data.success) {
                toast.success(`OTP sent to your ${method.toLowerCase()}`);
                setStep(3);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (otp.length < 6) return toast.error("Please enter a valid 6-digit OTP");

        setLoading(true);
        try {
            const res = await authAPI.verifyOTP({ identifier, otp });
            if (res.data && res.data.success === false) {
                toast.error(res.data.message || "Invalid or expired OTP");
                return;
            }

            toast.success("OTP Verified successfully");
            setStep(4);
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid or expired OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            return toast.error("Passwords do not match");
        }
        if (passwords.newPassword.length < 8) {
            return toast.error("Password must be at least 8 characters");
        }

        setLoading(true);
        try {
            const res = await authAPI.resetPassword({
                identifier,
                otp,
                newPassword: passwords.newPassword
            });
            if (res.data && res.data.success === false) {
                toast.error(res.data.message || "Failed to reset password");
                return;
            }

            if (res.data.success || res.status === 200) {
                toast.success("Password reset successfully! Please login.");
                navigate('/login');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <form onSubmit={handleGetOptions} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                Email or Username
                            </label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
                                placeholder="Enter your email or username"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                        >
                            {loading ? "Searching..." : "Find Account →"}
                        </button>
                    </form>
                );
            case 2:
                return (
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-slate-400 text-sm mb-6 text-center">
                            Select a method to receive your verification code:
                        </p>
                        {options?.recoveryEmail && (
                            <button
                                onClick={() => handleSendOTP('EMAIL')}
                                disabled={loading}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-gray-200 dark:border-slate-600 rounded-xl transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full">
                                        <MdEmail size={24} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900 dark:text-white">Email</p>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">{options.recoveryEmail}</p>
                                    </div>
                                </div>
                                <div className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Send Code →
                                </div>
                            </button>
                        )}
                        {options?.phoneNumber && (
                            <button
                                onClick={() => handleSendOTP('PHONE')}
                                disabled={loading}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-gray-200 dark:border-slate-600 rounded-xl transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full">
                                        <MdPhone size={24} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900 dark:text-white">Phone</p>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">{options.phoneNumber}</p>
                                    </div>
                                </div>
                                <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Send Code →
                                </div>
                            </button>
                        )}
                    </div>
                );
            case 3:
                return (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        <div className="text-center">
                            <p className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                                We've sent a code to your <strong>{selectedMethod.toLowerCase()}</strong>.
                            </p>
                            <input
                                type="text"
                                maxLength="6"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                className="w-48 text-center text-3xl tracking-widest px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all font-mono"
                                placeholder="000000"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                        >
                            {loading ? "Verifying..." : "Verify Code →"}
                        </button>
                        <button 
                            type="button"
                            onClick={() => setStep(2)}
                            className="w-full text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                        >
                            Change Method
                        </button>
                    </form>
                );
            case 4:
                return (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                        >
                            {loading ? "Resetting..." : "Reset Password →"}
                        </button>
                    </form>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-12 px-4 sm:px-6 lg:px-8 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700">
                <div className="text-center">
                    <img src={logo} alt="BNX Mail" className="mx-auto h-20 w-auto mb-4" />
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        {step === 4 ? "New Password" : "Reset Password"}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 font-medium">
                        {step === 1 && "Enter your details to find your account."}
                        {step === 2 && "Choose how you want to receive your code."}
                        {step === 3 && "Check your inbox for the verification code."}
                        {step === 4 && "Choose a strong, secure password."}
                    </p>
                </div>

                <div className="mt-8">
                    {renderStep()}
                </div>

                <div className="text-center pt-6 border-t border-gray-100 dark:border-slate-700">
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : navigate('/login')}
                        className="flex items-center justify-center gap-2 mx-auto text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                        <MdArrowBack />
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
