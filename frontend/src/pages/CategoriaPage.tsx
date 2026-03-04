import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCategorias } from '../hooks/inventario/useCategoria';
import { CategoriaForm } from '../components/organisms/Categoria/CategoriaForm';
import { CategoriaTable } from '../components/organisms/Categoria/CategoriaTable';
import { MainTemplate } from '../components/templates/MainTemplate';
import { Modal } from '../components/molecules/Modal';
import { Paginator } from '../components/molecules/Paginator';
import { SmartFilter, type FilterConfig } from '../components/organisms/SmartFilter/SmartFilter';
import { categoriaService } from '../services/categoria.service'; 
import { AddButton } from '../components/atoms/Button/AddButton';
import { type Categoria } from '../domain/models/Categoria';

const CategoriasPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});

    const { 
        categorias, loading, error, pagination,
        crearCategoria, eliminarCategoria, actualizarCategoria,
    } = useCategorias(currentFilters);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<Categoria | null>(null);
    const [fetchingSingle, setFetchingSingle] = useState(false); 

    const filterConfig: FilterConfig[] = useMemo(() => [
        { 
            key: 'search', 
            label: 'Buscar Nombre/Descripción', 
            type: 'text' 
        },
        { 
            key: 'activo', 
            label: 'Estado', 
            type: 'boolean' 
        },
    ], []);

    const handleFilterChange = (newFilters: Record<string, any>) => {
        setCurrentFilters(newFilters);
        pagination.goToPage(1); 
    };

    useEffect(() => {
        const editId = searchParams.get('editar');
        if (!editId) {
            setEditingCat(null)
            setIsModalOpen(false)
            return;
        }
        
        const idToFind = Number(editId);

        if (isModalOpen && editingCat?.id === idToFind) return;

        const categoriaEnLista = categorias.find(c => c.id === idToFind); 

        if (categoriaEnLista) {
            setEditingCat(categoriaEnLista);
            setIsModalOpen(true);
        } else {
            setFetchingSingle(true);
            categoriaService.getById(idToFind)
                .then((CatDesdeApi) => {
                    setEditingCat(CatDesdeApi);
                    setIsModalOpen(true);
                })
                .catch(() => setSearchParams({}))
                .finally(() => setFetchingSingle(false));
        }
    }, [searchParams, categorias.length]);

    const handleCreate = () => {
        setEditingCat(null);
        setIsModalOpen(true);
        setSearchParams({});
    };

    const handleEdit = (cat: Categoria) => {
        if (!cat.id) return; 
        setEditingCat(cat);
        setIsModalOpen(true);
        setSearchParams({ editar: cat.id.toString() });
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCat(null);
        setSearchParams({}); 
    };

    const handleSubmit = async (formData: Categoria) => {
        if (editingCat?.id) {
            await actualizarCategoria(editingCat.id, formData);
        } else {
            await crearCategoria(formData);
        }
        handleCloseModal();
    };

    return (
        <MainTemplate>
            <div className="max-w-6xl mx-auto p-6">
                
                <div className="flex bg-white p-6 rounded-xl shadow-[0_4px_24px_0_rgba(0,0,0,0.06)] border border-slate-100 justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        {/* Barra de acento lateral */}
                        <div className="w-1 h-12 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>

                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold text-slate-800 leading-none">
                                Maestro de categorias
                            </h1>
                            <span className="text-sm text-slate-400 mt-1 font-medium">
                                Gestiona tus categorias
                            </span>
                        </div>
                    </div>

                    <AddButton
                        label='Agregar categoria'
                        onClick={handleCreate}
                        className="shadow-[0_4px_12px_rgba(16,185,129,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] transition-transform active:scale-95"
                    />
                </div>

                <SmartFilter 
                    config={filterConfig} 
                    onFilterChange={handleFilterChange} 
                />

                {fetchingSingle && (
                    <div className="fixed top-20 right-6 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg shadow-lg border border-yellow-200 text-sm animate-pulse z-50">
                        ⏳ Cargando datos...
                    </div>
                )}
                
                {error && (
                    <div className="bg-red-100 text-red-700 p-4 mb-6 rounded border border-red-200">
                        {error}
                    </div>
                )}

                {loading && categorias.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 animate-pulse font-medium">
                        Cargando categorías...
                    </div>
                ) : (
                    <>
                        <CategoriaTable 
                            data={categorias} 
                            onDelete={eliminarCategoria} 
                            onEdit={handleEdit}
                        />
                        
                        <div className="mt-4">
                            <Paginator 
                                currentPage={pagination.page}
                                totalPages={pagination.totalPages}
                                onNext={pagination.nextPage}
                                onPrev={pagination.prevPage}
                                hasNext={pagination.hasNext}
                                hasPrev={pagination.hasPrev}
                            />
                        </div>
                    </>
                )}

                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title={editingCat ? "Editar Categoría" : "Registrar Nueva Categoría"}
                >
                     {fetchingSingle ? (
                        <div className="flex flex-col items-center justify-center p-8">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-2 text-sm text-gray-500">Recuperando información...</p>
                        </div>
                    ) : (
                        <CategoriaForm 
                            onSubmit={handleSubmit}
                            initialData={editingCat}
                            onCancel={handleCloseModal}
                        />
                    )}
                </Modal>
            </div>
        </MainTemplate>   
    );
};

export default CategoriasPage;