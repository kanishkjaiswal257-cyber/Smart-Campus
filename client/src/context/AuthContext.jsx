import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(sessionStorage.getItem("user")) || null;
        } catch {
            return null;
        }
    });

    const [token, setToken] = useState(
        () => sessionStorage.getItem("token") || ""
    );

    const login = (userData, jwtToken) => {
        sessionStorage.setItem("user", JSON.stringify(userData));
        sessionStorage.setItem("token", jwtToken);

        setUser(userData);
        setToken(jwtToken);
    };

    const logout = () => {
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");

        setUser(null);
        setToken("");
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}