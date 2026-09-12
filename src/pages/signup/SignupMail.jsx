import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignup } from '../../context/SignupContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SignupMail = () => {
    const navigate = useNavigate();
    const { formData, updateFormData } = useSignup();
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [error, setError] = useState('');

    const domainSuffix = '@bnxmail.com';

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (formData.accountType !== 'BUSINESS' && formData.firstName && formData.lastName && formData.dob) {
                setLoadingSuggestions(true);
                try {
                    const res = await authAPI.getUsernameSuggestions({
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        dob: formData.dob,
                        mode: formData.accountType
                    });
                    if (res.data?.success && res.data.data) {
                        setSuggestions(res.data.data);
                    }
                } catch (err) {
                    console.error('Failed to fetch suggestions', err);
                } finally {
                    setLoadingSuggestions(false);
                }
            }
        };

        fetchSuggestions();
    }, [formData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!formData.username || formData.username.trim() === '') {
            setError('Please choose a valid email address');
            return;
        }

        if (formData.accountType === 'PERSONAL' || formData.accountType === 'CHILD') {
            const username = formData.username.trim();
            const letters = username.replace(/[^a-zA-Z]/g, '').length;
            const digits = username.replace(/[^0-9]/g, '').length;
                  console.log({
          username,
          letters,
          digits,
          length: username.length
      });
            if (username.length < 10) {
                setError('Email handle must be at least 10 characters long');
                return;
            }
            if (letters < 7 || digits < 3) {
                setError('Email handle must contain at least 7 letters and 3 numbers');
                return;
            }
        }

        // Proceed to Mobile Verify
        navigate('/signup/mobile-verify');
    };

    const selectSuggestion = (sugg) => {
        updateFormData({ username: sugg });
    };

    const handleBack = () => {
        if (formData.accountType === 'BUSINESS') navigate('/signup/business');
        else if (formData.accountType === 'CHILD') navigate('/signup/parent-verify');
        else navigate('/signup/profile');
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Choose your email address
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                    Pick a suggested handle or create your own.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
                    {error}
                </div>
            )}

            {loadingSuggestions && (
                <div className="text-center text-sm text-indigo-500 font-medium">Generating suggestions...</div>
            )}

            {!loadingSuggestions && suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center my-4">
                    {suggestions.map((sugg, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => selectSuggestion(sugg)}
                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 rounded-full text-sm font-semibold transition-colors"
                        >
                            {sugg}
                        </button>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Create a custom handle
                    </label>
                    <div className="flex items-center bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                        <input
                            type="text"
                            value={formData.username || ''}
                            onChange={(e) => updateFormData({ username: e.target.value })}
                            placeholder="e.g. johndoe123"
                            required
                            className="flex-1 px-4 py-3 bg-transparent outline-none dark:text-white"
                        />
                        <span className="px-4 text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-slate-800 h-full flex items-center border-l border-gray-200 dark:border-slate-600">
                            {domainSuffix}
                        </span>
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
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                    >
                        Next Step
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SignupMail;
