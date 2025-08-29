'use server';

export interface LoginActionState {
  status: 'idle' | 'success' | 'fail';
}
