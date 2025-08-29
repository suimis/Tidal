'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/GPT/',
  validateStatus: (status) => status < 500,
});

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function getApplications() {
  const response = await api.get('/getApps');
  return response;
}
