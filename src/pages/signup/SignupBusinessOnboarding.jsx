import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSignup } from '../../context/SignupContext';
import { businessAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SignupBusinessOnboarding = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { formData, updateFormData } = useSignup();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleNext = (e) => {
        e.preventDefault();
        setError('');

        if (step === 1) {
            if (!formData.businessType || !formData.industry || !formData.companySize) {
                setError('Please fill out the required fields.');
                return;
            }
            setStep(2);
        } else {
            if (!formData.acceptTerms) {
                setError('You must accept the terms and conditions to proceed.');
                return;
            }
            submitOnboarding();
        }
    };

    const submitOnboarding = async () => {
        setLoading(true);
        try {
            const payload = {
                businessType: formData.businessType,
                industry: formData.industry,
                companySize: formData.companySize,
                businessWebsite: formData.businessWebsite,
                businessAddress: formData.businessAddress,
                timeZone: formData.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: formData.language || 'en',
                companyLogo: formData.companyLogo,
                profilePhoto: formData.profilePhoto,
                acceptTerms: formData.acceptTerms
            };

            await businessAPI.onboard(payload);
            toast.success('Business onboarding complete!');
            
            // Force a full reload to the inbox so that user data is refreshed
            window.location.href = '/all-mail';
        } catch (err) {
            setError(err.response?.data?.message || 'Onboarding failed');
            setLoading(false);
        }
    };

    const handleFileUpload = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateFormData({ [field]: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-12 px-4 sm:px-6 lg:px-8 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="max-w-2xl w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 transition-all duration-500">
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Welcome to BNX Mail for Business</h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 font-medium">Let's get your organization set up.</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-slate-700 h-2 rounded-full mb-8 overflow-hidden">
                    <div 
                        className="bg-gradient-to-r from-indigo-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: step === 1 ? '50%' : '100%' }}
                    />
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl animate-shake text-sm font-medium mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleNext}>
                    {step === 1 ? (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Step 1: Business Profile</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Business Type *</label>
                                    <select
                                        value={formData.businessType}
                                        onChange={e => updateFormData({ businessType: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
                                        required
                                    >
                                        <option value="">Select type</option>
                                        <option value="LLC">LLC</option>
                                        <option value="Corporation">Corporation</option>
                                        <option value="Sole Proprietorship">Sole Proprietorship</option>
                                        <option value="Non-Profit">Non-Profit</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Industry *</label>
                                    <input
                                        type="text"
                                        value={formData.industry}
                                        onChange={e => updateFormData({ industry: e.target.value })}
                                        placeholder="e.g. Technology, Retail"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Company Size *</label>
                                    <select
                                        value={formData.companySize}
                                        onChange={e => updateFormData({ companySize: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
                                        required
                                    >
                                        <option value="">Select size</option>
                                        <option value="1-10">1-10 employees</option>
                                        <option value="11-50">11-50 employees</option>
                                        <option value="51-200">51-200 employees</option>
                                        <option value="201+">201+ employees</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Website URL</label>
                                    <input
                                        type="url"
                                        value={formData.businessWebsite}
                                        onChange={e => updateFormData({ businessWebsite: e.target.value })}
                                        placeholder="https://"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Business Address</label>
                                    <textarea
                                        value={formData.businessAddress}
                                        onChange={e => updateFormData({ businessAddress: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
                                        rows="2"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Step 2: Branding & Preferences</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Profile Picture (Owner)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => handleFileUpload(e, 'profilePhoto')}
                                        className="w-full p-2 text-sm text-gray-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 dark:file:bg-indigo-900/30 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50 cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Company Logo</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => handleFileUpload(e, 'companyLogo')}
                                        className="w-full p-2 text-sm text-gray-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 dark:file:bg-indigo-900/30 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50 cursor-pointer"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Time Zone</label>
                                    <select
                                        value={formData.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                                        onChange={e => updateFormData({ timeZone: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
                                    >
                                        <option value="UTC">UTC</option>
                                        <option value="America/New_York">America/New_York (EST)</option>
                                        <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                                        <option value="Europe/London">Europe/London (GMT)</option>
                                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Language</label>
                                    <select
                                        value={formData.language || 'en'}
                                        onChange={e => updateFormData({ language: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
                                    >
                                        <option value="en">English</option>
                                        <option value="es">Spanish</option>
                                        <option value="fr">French</option>
                                        <option value="de">German</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="mt-6 border-t border-gray-100 dark:border-slate-700 pt-6">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.acceptTerms}
                                        onChange={e => updateFormData({ acceptTerms: e.target.checked })}
                                        className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer" 
                                    />
                                    <span className="text-sm text-gray-600 dark:text-slate-400">
                                        I accept the <Link to="/terms" state={{ from: location.pathname }} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Terms of Service</Link> and <Link to="/privacy" state={{ from: location.pathname }} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</Link>.
                                    </span>
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 flex justify-between items-center">
                        {step === 2 && (
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="px-6 py-3 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white font-semibold transition-colors"
                            >
                                ← Back
                            </button>
                        )}
                        <div className={step === 1 ? "ml-auto" : ""}>
                            <button
                                type="submit"
                                disabled={loading}
                                className="py-4 px-8 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50"
                            >
                                {step === 1 ? 'Continue →' : (loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Finishing setup...</span>
                                    </div>
                                ) : 'Complete Onboarding →')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignupBusinessOnboarding;
