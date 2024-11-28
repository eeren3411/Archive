import axios from "axios";

const apiClient = axios.create({
	baseURL: `${window.location.origin}/api`,
	timeout: 10000
});

export default apiClient;