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
            await authAPI.sendMobileOtp({ mobile: formData.mobileNumber });
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
            await authAPI.verifyMobileOtp({
                mobile: formData.mobileNumber,
                otp: formData.mobileOtp
            });
            
            updateFormData({ 
                mobileVerified: true, 
                recoveryPhone: formData.mobileNumber 
            });
            
            toast.success('Mobile number verified successfully');
            navigate('/signup/mail');
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
        
        if (formData.accountType === 'CHILD') {
            navigate('/signup/child-verify');
        } else {
            navigate('/signup/profile');
        }
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
                            containerClass="!w-full relative group"
                            inputClass="!w-full !px-4 !py-3 !pl-[52px] !bg-gray-50 dark:!bg-slate-700 !border !border-gray-200 dark:!border-slate-600 !rounded-xl focus:!ring-2 focus:!ring-indigo-500 !outline-none dark:!text-white !h-[52px] !text-base transition-all duration-200 hover:!border-gray-300 dark:hover:!border-slate-500"
                            buttonClass="!bg-transparent !border-none !left-1 !w-[42px] !h-full !rounded-l-xl hover:!bg-gray-200/50 dark:hover:!bg-slate-600/50 transition-colors duration-200 !flex !items-center !justify-center"
                            dropdownClass="!w-[320px] !bg-white dark:!bg-slate-800 !border !border-gray-100 dark:!border-slate-700 !rounded-2xl shadow-2xl dark:!text-white !mt-2 overflow-hidden !z-50 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full"
                            searchClass="!bg-gray-50 dark:!bg-slate-900/50 !border !border-gray-200 dark:!border-slate-600 !rounded-xl !px-4 !py-2.5 !m-3 !w-[calc(100%-24px)] focus:!ring-2 focus:!ring-indigo-500/50 !outline-none dark:!text-white !text-sm transition-all"
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
