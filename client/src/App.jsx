import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from "./pages/Auth.jsx";
import Dashboard from "./components/Dashboard.jsx";
import QRScanner from "./components/QRScanner.jsx";
import RecuperarWhatsapp from "./components/RecuperarWhatsapp.jsx";
import ResetPassword from "./components/ResetPassword.jsx";
import ProtectedRoute from './components/ProtectedRoute.jsx';
import CrearCarga from "./components/CrearCarga.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta raíz - redirecciona a /auth */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
        
        {/* Rutas públicas */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/recuperar-password" element={<RecuperarWhatsapp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Rutas protegidas que requieren autenticación */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Dashboard />} />
          <Route path="/tasks" element={<Dashboard />} />
          <Route path="/qr-scanner" element={<QRScanner />} />
          <Route path="/crear-carga" element={<CrearCarga />} />
        </Route>
        
        {/* Atrapa todas las rutas no definidas */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;