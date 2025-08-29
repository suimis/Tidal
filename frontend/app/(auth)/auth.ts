/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, prefer-const, react/no-unescaped-entities */
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/GPT/',
  validateStatus: (status) => status < 500,
  withCredentials: true,
});

export async function signIn(formdata: FormData): Promise<any> {
  try {
    const response = await api.post('validate', formdata, {
      headers: {
        'Content-Type': 'multipart/form-data', // 明确指定表单类型
      },
      maxRedirects: 0,
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export async function changePassword(formdata: FormData): Promise<any> {
  try {
    const response = await api.post('validate', formdata, {
      headers: {
        'Content-Type': 'multipart/form-data', // 明确指定表单类型
      },
      maxRedirects: 0,
    });
    console.log('Response:', response.data);
    return response;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export async function logout(): Promise<any> {
  try {
    const response = await api.post('logout');
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
