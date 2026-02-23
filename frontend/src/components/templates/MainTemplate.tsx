import { type ReactNode } from 'react';
// Cambiamos la importación del Navbar por el nuevo Sidebar
import { Navbar } from '../../components/organisms/Navbar'
interface MainTemplateProps {
    children: ReactNode;
}

export const MainTemplate = ({ children }: MainTemplateProps) => {
    return (
        // Añadimos 'flex' al contenedor principal
        <div className='flex min-h-screen bg-slate-50'>
            
            {/* El Sidebar estará fijo a la izquierda */}
            <Navbar />
            
            {/* Contenedor del contenido. 
              El 'ml-64' (margin-left: 16rem) empuja el contenido hacia la derecha 
              exactamente el mismo ancho que tiene el Sidebar (w-64).
              'flex-1' hace que ocupe todo el espacio restante.
            */}
            <div className='flex-1 ml-64 flex flex-col'>
                {/* Mantenemos tu max-w-7xl y mx-auto para que en pantallas 
                  ultrapanorámicas el contenido no se estire de forma fea, 
                  y añadimos w-full para que ocupe el espacio disponible.
                */}
                <main className='p-8 max-w-7xl mx-auto w-full flex-1'>
                    {children}
                </main>
            </div>

        </div>
    );
};