import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import logo from '../../assets/bnx-remove.png';

const SignupLayout = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen h-screen overflow-y-auto flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-12 px-4 sm:px-6 lg:px-8 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="max-w-xl w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 transition-all duration-500 hover:shadow-blue-500/10">
                <div className="text-center cursor-pointer" onClick={() => navigate('/signup/selection')}>
                    <img src={logo} alt="BNX Mail" className="mx-auto h-24 w-auto drop-shadow-md" />
                    <h2 className="mt-2 text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Create Account
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 font-medium">
                        Secure. Private. Professional.
                    </p>
                </div>
                
                {/* Content will be injected here via nested routes */}
                <Outlet />
            </div>
        </div>
    );
};

export default SignupLayout;
