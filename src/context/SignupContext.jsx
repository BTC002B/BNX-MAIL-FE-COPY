import React, { createContext, useContext, useState } from 'react';

const SignupContext = createContext();

export const useSignup = () => {
    return useContext(SignupContext);
};

export const SignupProvider = ({ children }) => {
    const defaultState = {
        // Account Type
        accountType: 'PERSONAL', // PERSONAL, CHILD, BUSINESS

        // Common Auth
        username: '',
        password: '',
        confirmPassword: '',

        // Personal / Child Details
        firstName: '',
        lastName: '',
        dob: '',
        parentEmail: '',
        parentOtp: '',
        mobileNumber: '',
        mobileVerified: false,
        recoveryPhone: '',
        tempToken: '', // Token returned after POST /api/auth/register

        // Business Details
        businessName: '',
        businessType: '',
        registrationNumber: '',
        ownerFirstName: '',
        ownerLastName: '',
        domain: '',

        // Business Onboarding
        industry: '',
        companySize: '',
        businessWebsite: '',
        businessAddress: '',
        timeZone: '',
        language: '',
        companyLogo: null,
        profilePhoto: null,
        acceptTerms: false,

        // New Business Verification Fields
        businessFlow: 'secondary',
        businessType: 'SOLE_PROPRIETORSHIP',
        panNumber: '',
        cin: '',
        gstin: '',
        businessEmail: ''
    };

    const [formData, setFormData] = useState(defaultState);

    const updateFormData = (data) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    const resetSignupForm = () => {
        setFormData(defaultState);
    };

    return (
        <SignupContext.Provider value={{ formData, updateFormData, resetSignupForm }}>
            {children}
        </SignupContext.Provider>
    );
};
