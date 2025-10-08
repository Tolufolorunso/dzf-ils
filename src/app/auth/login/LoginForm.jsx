'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import styles from '../auth.module.css';

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: 'tolufolorunso',
    password: '12345',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.status) {
        setSuccess(data.message);
        setTimeout(() => router.push('/dashboard'), 1000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.authForm}>
      {error && (
        <Alert type='error' message={error} onClose={() => setError('')} />
      )}

      {success && (
        <Alert
          type='success'
          message={success}
          onClose={() => setSuccess('')}
        />
      )}

      <Input
        label='Username'
        name='username'
        type='text'
        value={formData.username}
        onChange={handleInputChange}
        placeholder='Enter your username'
        required
        autoComplete='username'
      />

      <Input
        label='Password'
        name='password'
        type='password'
        value={formData.password}
        onChange={handleInputChange}
        placeholder='Enter your password'
        required
        autoComplete='current-password'
      />

      <Button
        type='submit'
        variant='primary'
        disabled={loading}
        className={styles.submitButton}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
