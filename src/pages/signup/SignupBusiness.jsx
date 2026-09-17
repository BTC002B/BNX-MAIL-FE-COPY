import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignup } from '../../context/SignupContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SignupBusiness = () => {
    const navigate = useNavigate();
    const { formData, updateFormData } = useSignup();
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1 = Flow selection, 2 = Details
    const [fetchingGstins, setFetchingGstins] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [gstinOptions, setGstinOptions] = useState([]);

    const handleFetchGstins = async () => {
        if (!formData.panNumber) {
            setError('Please enter a PAN Number to fetch GSTINs.');
            return;
        }
        
        setError('');
        setFetchingGstins(true);
        try {
            const res = await authAPI.fetchGstins(formData.panNumber);
            if (res.data?.data && res.data.data.length > 0) {
                setGstinOptions(res.data.data);
                if (res.data.data.length === 1) {
                    updateFormData({ gstin: res.data.data[0].gstin });
                }
                toast.success('GSTINs fetched successfully.');
            } else {
                setError('No active GSTINs found for this PAN.');
                setGstinOptions([]);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch GSTINs');
            setGstinOptions([]);
        } finally {
            setFetchingGstins(false);
        }
    };

    const handleVerifyPrimary = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.businessType === 'ORGANIZATION') {
            if (!formData.cin || !formData.panNumber || !formData.gstin) {
                setError('CIN, PAN, and GSTIN are required.');
                return;
            }
        } else {
            if (!formData.panNumber || !formData.gstin) {
                setError('PAN and GSTIN are required.');
                return;
            }
        }

        setVerifying(true);
        try {
            const payload = formData.businessType === 'ORGANIZATION' 
                ? { type: 'LARGE_BUSINESS', cin: formData.cin, pan: formData.panNumber, gstin: formData.gstin }
                : { type: 'GSTIN', gstin: formData.gstin };
            
            await authAPI.verifyBusiness(payload);
            toast.success('Business verified successfully!');
            navigate('/signup/mail');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Verification failed');
        } finally {
            setVerifying(false);
        }
    };

    const handleSecondarySubmit = (e) => {
        e.preventDefault();
        if (!formData.businessEmail) {
            setError('Work Email is required.');
            return;
        }
        navigate('/signup/mail');
    };

    // Render Step 1
    if (step === 1) {
        return (
            <div className="animate-fade-in space-y-6">
                <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        Join or Create
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                        Are you creating a new business account or joining an existing one?
                    </p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => { updateFormData({ businessFlow: 'primary' }); setStep(2); }}
                        className={`w-full p-6 text-left border-2 rounded-2xl transition-all ${
                            formData.businessFlow === 'primary' 
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                            : 'border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                        }`}
                    >
                        <h4 className="font-bold text-gray-800 dark:text-white">Create New Business</h4>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Set up a new organization. Identity verification required.</p>
                    </button>

                    <button
                        onClick={() => { updateFormData({ businessFlow: 'secondary' }); setStep(2); }}
                        className={`w-full p-6 text-left border-2 rounded-2xl transition-all ${
                            formData.businessFlow === 'secondary' 
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                            : 'border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                        }`}
                    >
                        <h4 className="font-bold text-gray-800 dark:text-white">Join Existing Business</h4>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Join your team using your work email address.</p>
                    </button>
                </div>

                <div className="pt-4 flex justify-start">
                    <button
                        type="button"
                        onClick={() => navigate('/signup/selection')}
                        className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        Back
                    </button>
                </div>
            </div>
        );
    }

    // Render Step 2 for Secondary Business
    if (formData.businessFlow === 'secondary') {
        return (
            <div className="animate-fade-in space-y-6">
                <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        Join Your Team
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                        Enter your work email address to join your organization.
                    </p>
                </div>
                
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSecondarySubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                            Work Email Address
                        </label>
                        <input
                            type="email"
                            value={formData.businessEmail}
                            onChange={(e) => updateFormData({ businessEmail: e.target.value })}
                            required
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                        />
                    </div>
                    
                    <div className="pt-4 flex justify-between">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
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
    }

    // Render Step 2 for Primary Business
    return (
        <div className="animate-fade-in space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Business Verification
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                    Verify your identity to create a new organization account.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
                    {error}
                </div>
            )}

            <form onSubmit={handleVerifyPrimary} className="space-y-4">
                <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => { updateFormData({ businessType: 'SOLE_PROPRIETORSHIP' }); setGstinOptions([]); setError(''); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${formData.businessType === 'SOLE_PROPRIETORSHIP' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        Sole Proprietorship
                    </button>
                    <button
                        type="button"
                        onClick={() => { updateFormData({ businessType: 'ORGANIZATION' }); setGstinOptions([]); setError(''); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${formData.businessType === 'ORGANIZATION' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        Organization
                    </button>
                </div>

                {formData.businessType === 'ORGANIZATION' && (
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                            CIN Number
                        </label>
                        <input
                            type="text"
                            value={formData.cin}
                            onChange={(e) => updateFormData({ cin: e.target.value.toUpperCase() })}
                            required
                            placeholder="e.g. U72900KA2020PTC123456"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white uppercase"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        PAN Number
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={formData.panNumber}
                            onChange={(e) => updateFormData({ panNumber: e.target.value.toUpperCase() })}
                            required
                            placeholder="e.g. ABCDE1234F"
                            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white uppercase"
                        />
                        <button
                            type="button"
                            onClick={handleFetchGstins}
                            disabled={fetchingGstins || !formData.panNumber}
                            className="px-4 py-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 text-sm font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
                        >
                            {fetchingGstins ? 'Fetching...' : 'Fetch GSTINs'}
                        </button>
                    </div>
                </div>

                {gstinOptions.length > 0 && (
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                            Select GSTIN
                        </label>
                        <select
                            value={formData.gstin}
                            onChange={(e) => updateFormData({ gstin: e.target.value })}
                            required
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                        >
                            <option value="">-- Select a GSTIN --</option>
                            {gstinOptions.map((option) => (
                                <option key={option.gstin} value={option.gstin}>
                                    {option.gstin} - {option.legalName || 'N/A'}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                            Owner First Name
                        </label>
                        <input
                            type="text"
                            value={formData.ownerFirstName}
                            onChange={(e) => updateFormData({ ownerFirstName: e.target.value })}
                            required
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                            Owner Last Name
                        </label>
                        <input
                            type="text"
                            value={formData.ownerLastName}
                            onChange={(e) => updateFormData({ ownerLastName: e.target.value })}
                            required
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Business Name
                    </label>
                    <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => updateFormData({ businessName: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                </div>

                <div className="pt-4 flex justify-between">
                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        Back
                    </button>
                    <button
                        type="submit"
                        disabled={verifying || gstinOptions.length === 0 || !formData.gstin}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50"
                    >
                        {verifying ? 'Verifying...' : 'Verify Identity'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SignupBusiness;
