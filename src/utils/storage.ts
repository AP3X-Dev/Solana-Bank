import { User, Account, Transaction } from '../types';

export const storage = {
  getUsers: (): User[] => {
    return JSON.parse(localStorage.getItem('users') || '[]');
  },
  
  setUsers: (users: User[]) => {
    localStorage.setItem('users', JSON.stringify(users));
  },
  
  getAccounts: (): Account[] => {
    return JSON.parse(localStorage.getItem('accounts') || '[]');
  },
  
  setAccounts: (accounts: Account[]) => {
    localStorage.setItem('accounts', JSON.stringify(accounts));
  },
  
  getCurrentUser: (): User | null => {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
  },
  
  setCurrentUser: (user: User | null) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
};