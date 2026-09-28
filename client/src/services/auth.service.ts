import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function fetchRegistrationStatus(): Promise<boolean> {
    const response = await axios.get<{ registrationAvailable: boolean }>(
        `${API_BASE_URL}/auth/status`,
    );
    return Boolean(response.data.registrationAvailable);
}
