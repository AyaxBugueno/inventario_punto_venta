import {type ReactNode } from 'react';

interface Props {
    title: string;
    value: string | number;
    icon: ReactNode;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
}

export const StatCard = ({ title, value, icon, subtitle }: Props) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
                {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
            </div>
        </div>
    );
};