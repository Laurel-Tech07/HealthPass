/* Frontend/assets/js/api.js */
const BASE_URL = 'http://localhost:5000/api';

async function fetchAPI(endpoint, method = 'GET', body = null, useStaffToken = false) {
  const token = useStaffToken ? localStorage.getItem('token') : localStorage.getItem('hp_token');
  
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  
  if (response.status === 401 || response.status === 403) {
    // If the token is bad, clear it and kick them to login
    localStorage.removeItem(useStaffToken ? 'token' : 'hp_token');
    window.location.href = useStaffToken ? '/admin/login.html' : '/login.html';
    throw new Error('Unauthorized');
  }
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

const HealthPassAPI = {
  getMe: async () => fetchAPI('/me'),
  getHistory: async () => fetchAPI('/me/history'),
  getVaccinations: async () => fetchAPI('/me/vaccinations'),
  getClinics: async (q = '', state = '') => fetchAPI(`/ai/clinics?q=${q}&state=${state}`),
  
  // Admin Routes
  getAdminOverview: async () => fetchAPI('/admin/overview', 'GET', null, true),
  getAdminAccounts: async () => fetchAPI('/admin/accounts', 'GET', null, true),
  getAdminPatients: async () => fetchAPI('/admin/patients', 'GET', null, true),
  getAdminClinics: async () => fetchAPI('/admin/clinics', 'GET', null, true),
};

window.HealthPassAPI = HealthPassAPI;