// AuthHeaderInjection.js
// This file will be injected into the main HTML page to ensure the auth headers are set properly

(function() {
    // Check if we need to fix authorization headers
    try {
        console.log('AuthHeaderInjection: Checking if auth headers need fixing...');
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('AuthHeaderInjection: No token found in localStorage');
            return;
        }
        
        // Get user data from localStorage
        const userData = localStorage.getItem('user');
        let user = null;
        
        if (userData) {
            try {
                user = JSON.parse(userData);
            } catch (e) {
                console.error('AuthHeaderInjection: Failed to parse user data', e);
            }
        }
        
        // Check if axios is available
        if (typeof axios !== 'undefined') {
            console.log('AuthHeaderInjection: Setting axios Authorization header');
            
            // Set the Authorization header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Override axios request interceptor to ensure header is always set
            axios.interceptors.request.use(
                (config) => {
                    // Always ensure Authorization header is set
                    config.headers['Authorization'] = `Bearer ${token}`;
                    return config;
                },
                (error) => {
                    return Promise.reject(error);
                }
            );
            
            // Add response interceptor to catch and log 403/401 errors
            axios.interceptors.response.use(
                (response) => {
                    return response;
                },
                (error) => {
                    // Log authentication errors
                    if (error.response) {
                        if (error.response.status === 403) {
                            console.error('AuthHeaderInjection: Access denied error', {
                                status: error.response.status,
                                data: error.response.data,
                                headers: error.response.headers,
                                url: error.response.config.url
                            });
                        } else if (error.response.status === 401) {
                            console.error('AuthHeaderInjection: Authentication failed', {
                                status: error.response.status,
                                data: error.response.data,
                                headers: error.response.headers,
                                url: error.response.config.url
                            });
                        }
                    }
                    return Promise.reject(error);
                }
            );
            
            console.log('AuthHeaderInjection: Axios interceptors installed');
        } else {
            console.warn('AuthHeaderInjection: Axios is not available');
        }
        
        // If we have user data, ensure isAdmin is set correctly
        if (user && !user.isAdmin && token) {
            // Decode token to check if it has admin privileges
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                
                const tokenData = JSON.parse(jsonPayload);
                
                if (tokenData.isAdmin === true && user.username === tokenData.username) {
                    console.log('AuthHeaderInjection: Fixing inconsistent admin status in localStorage');
                    user.isAdmin = true;
                    localStorage.setItem('user', JSON.stringify(user));
                }
            } catch (e) {
                console.error('AuthHeaderInjection: Failed to decode token', e);
            }
        }
        
        console.log('AuthHeaderInjection: Completed');
    } catch (e) {
        console.error('AuthHeaderInjection: Error in auth header injection', e);
    }
})();
