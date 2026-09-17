import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignup } from '../../context/SignupContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SignupBusiness = () => {
    const navigate = useNavigate();
    const { formData, updateFormData } = useSignup();
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1 = Type selection, 2 = Verification details
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
        if (!formData.ownerFirstName || !formData.ownerLastName || !formData.businessName || !formData.registrationNumber) {
            setError('All fields are required.');
            return;
        }
        navigate('/signup/mail');
    };

    // If we are in primary flow but at step 2, we just render the verification form directly
    // without the top toggle, or we can keep the top toggle. The design usually hides the toggle on the next step.
    if (step === 2 && formData.businessFlow === 'primary') {
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
                                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white uppercase"
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
                                className="flex-1 px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white uppercase"
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
                                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
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
                                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
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
                                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
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
                            className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                        />
                    </div>

                    <div className="pt-4 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={verifying || gstinOptions.length === 0 || !formData.gstin}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
                        >
                            {verifying ? 'Verifying...' : 'Verify Identity'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6">
            <div className="text-center mb-6">
                <h3 className="text-gray-500 dark:text-slate-400 mt-2">
                    Enter business details
                </h3>
            </div>

            {/* Toggle primary vs secondary */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                    type="button"
                    onClick={() => updateFormData({ businessFlow: 'secondary' })}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        formData.businessFlow === 'secondary'
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                >
                    <span className={`font-bold text-lg ${formData.businessFlow === 'secondary' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                        Secondary
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-400 mt-1">Standard flow</span>
                </button>
                <button
                    type="button"
                    onClick={() => updateFormData({ businessFlow: 'primary' })}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        formData.businessFlow === 'primary'
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                >
                    <span className={`font-bold text-lg ${formData.businessFlow === 'primary' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                        Primary
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-400 mt-1">Verified account</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-4">
                    {error}
                </div>
            )}

            {formData.businessFlow === 'secondary' ? (
                /* Secondary Flow Form */
                <form onSubmit={handleSecondarySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="First Name"
                            value={formData.ownerFirstName}
                            onChange={(e) => updateFormData({ ownerFirstName: e.target.value })}
                            required
                            className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                        />
                        <input
                            type="text"
                            placeholder="Last Name"
                            value={formData.ownerLastName}
                            onChange={(e) => updateFormData({ ownerLastName: e.target.value })}
                            required
                            className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                        />
                    </div>
                    <input
                        type="text"
                        placeholder="Business Name"
                        value={formData.businessName}
                        onChange={(e) => updateFormData({ businessName: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                    <input
                        type="text"
                        placeholder="Business ID Number"
                        value={formData.registrationNumber}
                        onChange={(e) => updateFormData({ registrationNumber: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                    
                    <div className="pt-8 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => navigate('/signup/selection')}
                            className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg transition-all"
                        >
                            Next
                        </button>
                    </div>
                </form>
            ) : (
                /* Primary Flow - Type Selection */
                <div className="space-y-4">
                    <p className="text-center text-sm font-medium text-gray-700 dark:text-slate-300 mb-6">
                        Choose your business size to continue verification
                    </p>
                    
                    <button
                        onClick={() => { updateFormData({ businessType: 'SOLE_PROPRIETORSHIP' }); setStep(2); }}
                        className="w-full flex items-center p-5 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all text-left group bg-white dark:bg-slate-800"
                    >
                        <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl mr-4 group-hover:scale-110 transition-transform">
                            S
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-lg">Sole Proprietorship</h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Verify instantly using your GSTIN</p>
                        </div>
                    </button>

                    <button
                        onClick={() => { updateFormData({ businessType: 'ORGANIZATION' }); setStep(2); }}
                        className="w-full flex items-center p-5 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all text-left group bg-white dark:bg-slate-800"
                    >
                        <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl mr-4 group-hover:scale-110 transition-transform">
                            L
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-lg">Organization</h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Verify via CIN, PAN, and GSTIN details</p>
                        </div>
                    </button>
                    
                    <div className="pt-8 flex justify-start">
                        <button
                            type="button"
                            onClick={() => navigate('/signup/selection')}
                            className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                        >
                            Back
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SignupBusiness;
