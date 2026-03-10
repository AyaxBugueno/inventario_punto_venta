// src/pages/ProductosPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProductos } from '../hooks/inventario/useProducto';
import { ProductoForm } from '../components/organisms/Producto/ProductoForm';
import { ProductoTable } from '../components/organisms/Producto/ProductoTable';
import { MainTemplate } from '../components/templates/MainTemplate';
import { Modal } from '../components/molecules/Modal';
import { Paginator } from '../components/molecules/Paginator';
import { SmartFilter, type FilterConfig } from '../components/organisms/SmartFilter/SmartFilter';
import { productoService } from '../services/producto.service';
import { AddButton } from '../components/atoms/Button/AddButton';
import { type Producto } from '../domain/models/Producto';
import { categoriaService } from '../services/categoria.service';
// Importamos el nuevo Organismo del Kardex
import { KardexModal } from '../components/organisms/Kardex/Kardex';
import { AjusteStockModal } from '../components/molecules/AjustarStockModal/AjustarStockModal';


const ProductosPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // 1. ESTADO PARA FILTROS
    const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});

    // 2. ESTADO PARA CATEGORÍAS
    const [categorias, setCategorias] = useState<any[]>([]);

    // 3. HOOK DE PRODUCTOS (Recibe filtros)
    const {
        productos, loading, error, pagination,
        crearProducto, eliminarProducto, actualizarProducto, clearError,refetch
    } = useProductos(currentFilters);

    // Estados del Modal de Formulario (Crear/Editar)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProd, setEditingProd] = useState<Producto | null>(null);
    const [fetchingSingle, setFetchingSingle] = useState(false);

    // ==========================================
    // NUEVOS ESTADOS PARA EL KARDEX
    // ==========================================
    const [isKardexOpen, setIsKardexOpen] = useState(false);
    const [selectedProductKardex, setSelectedProductKardex] = useState<Producto | null>(null);

    const [isAjusteStockOpen, setIsAjusteStockOpen] = useState(false);
    const [productoParaAjuste, setProductoParaAjuste] = useState<Producto | null>(null);

    const handleOpenAjusteStock = (producto: Producto) => {
        setProductoParaAjuste(producto);
        setIsAjusteStockOpen(true);
    };

    // 4. EFECTO PARA CARGAR CATEGORÍAS
    useEffect(() => {
        categoriaService.getAll()
            .then((data) => {
                if (data && data.results) {
                    setCategorias(data.results);
                }
                else if (Array.isArray(data)) {
                    setCategorias(data);
                }
            })
            .catch((err) => console.error("Error cargando categorías:", err));
    }, []);

    // ---------------------------------------------
    // 5. CONFIGURACIÓN DEL SMART FILTER
    // ---------------------------------------------
    const filterConfig: FilterConfig[] = useMemo(() => {
        const categoriasSeguras = Array.isArray(categorias) ? categorias : [];

        return [
            { key: 'search', label: 'Buscar (Nombre/SKU)', type: 'text' },
            { key: 'activo', label: 'Estado', type: 'boolean' },
            {
                key: 'categoria',
                label: 'Categoría',
                type: 'select',
                options: categoriasSeguras.map(cat => ({
                    id: cat.id,
                    label: cat.nombre
                }))
            }
        ];
    }, [categorias]);

    const handleFilterChange = (newFilters: Record<string, any>) => {
        setCurrentFilters(newFilters);
        pagination.goToPage(1);
    };

    // ---------------------------------------------
    // 6. LÓGICA DE URL Y MODALES 
    // ---------------------------------------------
    useEffect(() => {
        const editId = searchParams.get('editar');
        if (!editId) {
            setEditingProd(null);
            setIsModalOpen(false);
            return;
        }

        const idToFind = Number(editId);

        if (isModalOpen && editingProd?.id === idToFind) return;

        const productoEnLista = productos.find(p => p.id === idToFind);

        if (productoEnLista) {
            setEditingProd(productoEnLista);
            setIsModalOpen(true);
        } else {
            setFetchingSingle(true);
            productoService.getById(idToFind)
                .then((ProductoDesdeApi) => {
                    setEditingProd(ProductoDesdeApi);
                    setIsModalOpen(true);
                })
                .catch(() => setSearchParams({}))
                .finally(() => setFetchingSingle(false));
        }
    }, [searchParams, productos.length]);

    // Handlers del Formulario
    const handleCreate = () => {
        setEditingProd(null);
        setIsModalOpen(true);
        setSearchParams({});
    };

    const handleEdit = (prod: Producto) => {
        if (!prod.id) return;
        setEditingProd(prod);
        setIsModalOpen(true);
        setSearchParams({ editar: prod.id.toString() });
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProd(null);
        setSearchParams({});
    };

    const handleSubmit = async (formData: Producto) => {
        try {
            if (editingProd?.id) {
                await actualizarProducto(editingProd.id, formData);
            } else {
                await crearProducto(formData);
            }
            handleCloseModal();
        } catch (error: any) {
            if (error.response?.status === 400) {
                throw error;
            }
            alert("Ocurrió un error inesperado.");
        }
    };

    // Handler del Kardex
    const handleViewKardex = (prod: Producto) => {
        setSelectedProductKardex(prod);
        setIsKardexOpen(true);
    };

    return (
        <MainTemplate>
            <div className="max-w-6xl mx-auto p-6">
                <div className="flex bg-[#ffffff] p-6 rounded-sm shadow-[0_4px_24px_0_rgba(0,0,0,0.06)]  justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        {/* Barra de acento lateral */}
                        <div className="w-1 h-12 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>

                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold text-slate-800 leading-none">
                                Maestro de productos
                            </h1>
                            <span className="text-sm text-slate-400 mt-1 font-medium">
                                Visualiza y edita tu catálogo de productos
                            </span>
                        </div>
                    </div>

                    <AddButton
                        label='Agregar Producto'
                        onClick={handleCreate}
                        className="shadow-[0_4px_12px_rgba(16,185,129,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] transition-transform active:scale-95"
                    />
                </div>

                {/* Smart Filter */}
                <SmartFilter
                    config={filterConfig}
                    onFilterChange={handleFilterChange}
                />

                {/* Feedback de Carga/Error de Producto Individual */}
                {fetchingSingle && (
                    <div className="fixed top-20 right-6 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg shadow-lg border border-yellow-200 text-sm animate-pulse z-50">
                        ⏳ Cargando datos del producto...
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 mb-6 rounded-lg border border-red-200 flex justify-between items-start shadow-sm transition-all">
                        <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{error}</p>
                        </div>
                        <button
                            onClick={clearError}
                            className="text-red-500 hover:text-red-800 font-bold px-2 py-1 bg-red-100/50 hover:bg-red-200 rounded transition-colors"
                            title="Cerrar mensaje"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Tabla y Paginación */}
                {loading && productos.length === 0 ? (
                    <div className="p-10 text-center text-slate-500 animate-pulse font-medium">
                        Cargando catálogo...
                    </div>
                ) : (
                    <>
                        <ProductoTable
                            data={productos}
                            onDelete={eliminarProducto}
                            onEdit={handleEdit}
                            onViewKardex={handleViewKardex}
                            onAjustarStock={handleOpenAjusteStock} // Pasamos el handler aquí
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

                {/* Modal de Formulario (Crear/Editar) */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title={editingProd ? "Editar Producto" : "Registrar Nuevo Producto"}
                >
                    {fetchingSingle ? (
                        <div className="flex flex-col items-center justify-center p-8">
                            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-sm font-bold text-slate-500">Recuperando información...</p>
                        </div>
                    ) : (
                        <ProductoForm
                            onSubmit={handleSubmit}
                            initialData={editingProd}
                            onCancel={handleCloseModal}
                            categorias={categorias}
                        />
                    )}
                </Modal>

                {/* Modal del Kardex */}
                <KardexModal 
                    isOpen={isKardexOpen}
                    onClose={() => setIsKardexOpen(false)}
                    productoId={selectedProductKardex?.id || null}
                    productoNombre={selectedProductKardex?.nombre || ''}
                />
                <AjusteStockModal 
                isOpen={isAjusteStockOpen}
                onClose={() => setIsAjusteStockOpen(false)}
                producto={productoParaAjuste}
                onSuccess={() => {
                    
                    refetch(); 
                }}
/>

            </div>
        </MainTemplate>
    );
};

export default ProductosPage;