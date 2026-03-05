import { useState } from 'react';
// Asume que CustomSelect está en el mismo directorio o ajusta el import
import { CustomSelect } from '../../molecules/CustomSelect/CustomSelect';
import { HybridDatePicker } from '../../molecules/HybridDatePicker/HybridDatePicker';


export type FilterConfig = {
    key: string;
    label: string;
    type: 'text' | 'select' | 'boolean' | 'date';
    options?: { id: string | number, label: string }[];
};

interface Props {
    config: FilterConfig[];
    onFilterChange: (filters: Record<string, any>) => void;
}

export const SmartFilter = ({ config, onFilterChange }: Props) => {
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

    const handleChange = (key: string, value: any) => {
        const newFilters = { ...activeFilters, [key]: value };

        if (value === '' || value === null || value === undefined) {
            delete newFilters[key];
        }

        setActiveFilters(newFilters);
        onFilterChange(newFilters);
    };

    // Estilo solo para los inputs nativos restantes (texto y fecha)
    const baseInputStyles = "w-full bg-slate-50 border border-slate-200 p-2 pl-3 rounded-lg text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:shadow-none outline-none transition-all text-slate-700";

    return (
        <div className="bg-white p-5 rounded-lg shadow-[0_4px_24px_0_rgba(0,0,0,0.06)] border border-slate-100 mb-6">
            <div className="flex flex-wrap gap-4 items-end">

                {config.map((field) => {

                    // CASO 1: Búsqueda de Texto
                    if (field.type === 'text') {
                        return (
                            <div key={field.key} className="w-full md:w-64">
                                <label className="text-xs font-bold text-black-500 mb-1 block uppercase tracking-wide">
                                    {field.label}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className={baseInputStyles}
                                        placeholder={`Buscar...`}
                                        value={activeFilters[field.key] || ''} // Controlamos el input
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                    />
                                </div>
                            </div>
                        );
                    }

                    // CASO 2: Selectores (Usando CustomSelect)
                    if (field.type === 'select') {
                        return (
                            <div key={field.key} className="min-w-[160px]">
                                <label className="text-xs font-bold text-black-500 mb-1 block uppercase tracking-wide">
                                    {field.label}
                                </label>
                                <CustomSelect
                                    value={activeFilters[field.key]}
                                    onChange={(val) => handleChange(field.key, val)}
                                    options={field.options}
                                    placeholder="Todos"
                                />
                            </div>
                        );
                    }

                    // CASO 3: Booleanos (Usando CustomSelect adaptado)
                    if (field.type === 'boolean') {
                        return (
                            <div key={field.key} className="min-w-[120px]">
                                <label className="text-xs font-bold text-black-500 mb-1 block uppercase tracking-wide">
                                    {field.label}
                                </label>
                                <CustomSelect
                                    value={activeFilters[field.key]}
                                    onChange={(val) => handleChange(field.key, val)}
                                    // Pasamos el boolean como un array de options estándar para el CustomSelect
                                    options={[
                                        { id: 'true', label: 'Activos' },
                                        { id: 'false', label: 'Inactivos' }
                                    ]}
                                    placeholder="Todos"
                                />
                            </div>
                        );
                    }

                    // CASO 4: Fechas
                    if (field.type === 'date') {
                        return (
                            <div key={field.key} className="min-w-[150px]">
                                <label className="text-xs font-bold text-slate-500 mb-1 block uppercase tracking-wide">
                                    {field.label}
                                </label>
                                <HybridDatePicker
                                    value={activeFilters[field.key] || ''}
                                    onChange={(val) => handleChange(field.key, val)}
                                    placeholder="---"
                                />
                            </div>
                        );
                    }

                    return null;
                })}

                {/* Botón de Limpiar */}
                <div className="ml-auto">
                    <button
                        title="Limpiar filtros"
                        onClick={() => {
                            setActiveFilters({});
                            onFilterChange({});
                        }}
                        className="group w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 border border-blue-200 rounded-full transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                        <svg className="w-5 h-5 transition-transform duration-500 ease-in-out group-hover:-rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

            </div>
        </div>
    );
};