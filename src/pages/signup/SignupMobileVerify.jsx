import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignup } from '../../context/SignupContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const SignupMobileVerify = () => {
    const navigate = useNavigate();
    const { formData, updateFormData } = useSignup();
    const [step, setStep] = useState('MOBILE'); // MOBILE or OTP
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!formData.mobileNumber) {
            toast.error('Mobile number is required');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.sendMobileOtp({ mobile: formData.mobileNumber });
            
            // Handle if backend returns 200 OK but success is false
            if (response.data && response.data.success === false) {
                toast.error(response.data.message || 'Failed to send OTP');
                return;
            }

            toast.success('OTP sent to your mobile number');
            setStep('OTP');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!formData.mobileOtp) {
            toast.error('Please enter the OTP');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.verifyMobileOtp({
                mobile: formData.mobileNumber,
                otp: formData.mobileOtp
            });

            // Handle if backend returns 200 OK but success is false
            if (response.data && response.data.success === false) {
                toast.error(response.data.message || 'Invalid OTP');
                return;
            }
            
            updateFormData({ 
                mobileVerified: true, 
                recoveryPhone: formData.mobileNumber 
            });
            
            toast.success('Mobile number verified successfully');
            navigate('/signup/password-setup');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 'OTP') {
            setStep('MOBILE');
            return;
        }
        
        navigate('/signup/mail');
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Mobile Verification
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                    Verify your mobile number to secure your account.
                </p>
            </div>

            {step === 'MOBILE' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                            Mobile Number
                        </label>
                        <PhoneInput
                            country={'us'}
                            value={formData.mobileNumber}
                            onChange={(phone) => updateFormData({ mobileNumber: '+' + phone })}
                            enableSearch={true}
                            containerClass="!w-full"
                            inputClass="!w-full !px-4 !py-3 !pl-[50px] !bg-gray-50 dark:!bg-slate-700 !border !border-gray-200 dark:!border-slate-600 !rounded-xl focus:!ring-2 focus:!ring-indigo-500 !outline-none dark:!text-white !h-[50px] !text-base"
                            buttonClass="!bg-transparent !border-none !left-1"
                            dropdownClass="!bg-white dark:!bg-slate-800 !text-gray-800 dark:!text-white !border-gray-200 dark:!border-slate-600 !rounded-xl shadow-xl"
                            searchClass="!bg-gray-50 dark:!bg-slate-700 !border-gray-200 dark:!border-slate-600 !text-gray-800 dark:!text-white !rounded-lg"
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
                            Enter the 6-digit OTP
                        </label>
                        <input
                            type="text"
                            value={formData.mobileOtp || ''}
                            onChange={(e) => updateFormData({ mobileOtp: e.target.value })}
                            required
                            placeholder="123456"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white text-center tracking-widest text-lg font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Code sent to {formData.mobileNumber}. <button type="button" onClick={() => setStep('MOBILE')} className="text-indigo-600 hover:underline">Change number</button>
                        </p>
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
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default SignupMobileVerify;
