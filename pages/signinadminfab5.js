import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  Link,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import Router from 'next/router';
import Cookie from 'js-cookie';

const PageWrapper = styled(Box)({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 16px',
  background: 'linear-gradient(135deg, #98eb61 0%, #64e4dd 25%, #34a6f1 50%, #2675db 75%, #4b0ac496 100%)',
});

const FormCard = styled(Paper)({
  width: '100%',
  maxWidth: 440,
  padding: 'clamp(24px, 6vw, 40px)',
  borderRadius: '20px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.12)',
  backgroundColor: 'rgba(255, 255, 255, 0.92)',
});

function Copyright() {
  return (
    <Box
      sx={{
        pt: 2.5,
        borderTop: '1px solid rgba(148, 163, 184, 0.2)',
        textAlign: 'center',
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', letterSpacing: '0.02em' }}
      >
        {'© '}
        <Link
          href="#"
          underline="none"
          sx={{
            color: '#2675db',
            fontWeight: 700,
            '&:hover': { color: '#185abc' },
          }}
        >
          Fab5 META
        </Link>{' '}
        {new Date().getFullYear()}
      </Typography>
    </Box>
  );
}

let user;
export { user };

export default function SignInAdminLocker() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errormsg, setErrormsg] = useState('');
  const [responseError, setResponseError] = useState('');

  useEffect(() => {
    Cookie.set('lockeradmin', '', { expires: new Date() });
  }, []);

  async function handleOnSubmit(e) {
    e.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setResponseError('Username and password are required.');
      return;
    }

    try {
      setResponseError('');
      setErrormsg('');
      setIsSubmitting(true);

      const response = await fetch('http://10.3.10.20:5001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUsername,
          password: trimmedPassword,
        }),
      });

      if (response.status === 200) {
        const responseVar = await response.json();
        const token = responseVar?.token;

        if (token && token !== 'Failed' && token.trim() !== '') {
          Cookie.set('lockeradmin', token, { expires: 1 });
          Router.push('/homefab5');
          return;
        }

        setErrormsg(typeof responseVar === 'string' ? responseVar : 'Invalid username or password.');
        setUsername('');
        setPassword('');
        return;
      }

      const errorText = await response.text();
      setResponseError(errorText || 'Login failed. Please try again.');
    } catch (error) {
      console.error(error);
      setResponseError('Unable to connect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageWrapper>
      <FormCard>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          align="center"
          sx={{
            fontWeight: 750,
            letterSpacing: '-0.04em',
            color: '#0f172a',
            mb: 1,
          }}
        >
          Locker Management System
        </Typography>

        <Typography variant="body2" align="center" sx={{ mb: 3, color: 'text.secondary' }}>
          Sign in to manage your locker account
        </Typography>

        <Box component="form" onSubmit={handleOnSubmit} noValidate>
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            required
            autoComplete="username"
            autoFocus
            sx={{ mb: 1.5 }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {responseError && (
            <Typography variant="body2" color="error.main" sx={{ mb: 1.5 }}>
              {responseError}
            </Typography>
          )}

          {errormsg && (
            <Typography variant="body2" color="error.main" sx={{ mb: 1.5 }}>
              {errormsg}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting}
            sx={{
              mt: 1,
              py: 1.25,
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none',
            }}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </Box>

        <Box mt={6}>
          <Copyright />
        </Box>
      </FormCard>
    </PageWrapper>
  );
}
