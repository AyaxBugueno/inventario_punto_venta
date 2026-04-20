import axios from 'axios';




const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    withCredentials: true, 
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config; 
        
        
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/logout/')) {
            originalRequest._retry = true; 

            try {
                await axios.post(
                    'http://localhost:8000/api/token/refresh/',
                    {}, 
                    { withCredentials: true }
                );

                return api(originalRequest);
                
            } catch (refreshError) {
                console.error("Falló la renovación de sesión:", refreshError);
                // Intentar logout para limpiar cookies
                try {
                    await api.post('/logout/');
                } catch (logoutError) {
                    console.error("Error en logout:", logoutError);
                }
                localStorage.removeItem('username');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
                
            }
        }
            
            

        return Promise.reject(error);
    }
);

export default api;