import axios from "axios";

const API = axios.create({
    // En desarrollo, usar el proxy de Vite. En producción, usar la URL completa
    baseURL: import.meta.env.MODE === 'development' ? '' : 'http://localhost:4000',
    withCredentials: true
});

API.interceptors.response.use(
    response => response, 
    error => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('user');
            window.location.href = '/auth';
        }
        return Promise.reject(error);
    }
);

export default API;