import apiClient from "./apiClient.js";

export function getCurrentSalt () {
	return apiClient.get('/auth/salt');
}

export function createDatabase(salt, checksum) {
	return apiClient.post('/auth/create', { salt, checksum });
}

export function loginDatabase(checksum) {
	return apiClient.post('/auth/login', { checksum });
}