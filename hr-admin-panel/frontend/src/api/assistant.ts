export const askAssistant = async (message: string): Promise<string> => {
  const token = localStorage.getItem('hr_token');
  if (!token) {
    throw new Error('SESSION_EXPIRED');
  }
  const response = await fetch('/api/assistant/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || 'Assistant request failed') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return payload.message;
};
