import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = 'http://localhost:3333/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [privileges, setPrivileges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchMe();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchMe = async () => {
        try {
            const res = await axios.get(`${API_URL}/auth/me`);
            setUser(res.data.data.user);
            setPrivileges(res.data.data.privileges);
        } catch (err) {
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await axios.post(`${API_URL}/auth/login`, { email, password });
        const { token, user: userData, privileges: userPrivs } = res.data.data;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        setPrivileges(userPrivs);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setPrivileges([]);
    };

    const checkPrivilege = (module, action) => {
        const wildcardPriv = privileges.find(p => p.ref_modulo === '*');
        if (wildcardPriv && wildcardPriv[action]) return true;
        const privilege = privileges.find(p => p.ref_modulo === module);
        return privilege?.[action] === true;
    };

    const canRead = (module) => checkPrivilege(module, 'read');
    const canWrite = (module) => checkPrivilege(module, 'write');
    const canExec = (module) => checkPrivilege(module, 'exec');

    const isAdmin = privileges.some(p => p.ref_modulo === '*' && p.read);

    return (
        <AuthContext.Provider value={{
            user, privileges, loading, login, logout,
            canRead, canWrite, canExec, isAdmin,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
