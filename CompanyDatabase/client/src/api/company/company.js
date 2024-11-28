import apiClient from "../api-client.js";

export function getCompany(id) {
	return apiClient.get(`/companies?id=${id}`);
}

export function getCompanies() {
	return apiClient.get('/companies/bulk');
}

export function createCompany(data) {
	return apiClient.post('/companies', data);
}

export function createCompanies(data) {
	return apiClient.post('/companies/bulk', data);
}

export function updateCompany(id, data) {
	return apiClient.put(`/companies?id=${id}`, data);
}

export function updateCompanies(data) {
	return apiClient.put('/companies/bulk', data);
}

export function deleteCompany(id) {
	return apiClient.delete(`/companies?id=${id}`);
}

export function deleteCompanies(data) {
	return apiClient.delete('/companies/bulk', data);
}

export function rotateDatabase(salt, checksum, data, backup = false) {
	return apiClient.post(`/companies/rotate?backup=${backup}`, data, { headers: { 'x-salt': salt, 'x-checksum': checksum } });
}