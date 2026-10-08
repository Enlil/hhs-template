import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/hhs-logo.png';
import { Field } from '../components/Field';
import { Footer } from '../components/Footer';
import { APP_NAME } from '../lib/config';

// Visual only: no authentication, sessions, or API calls. Submitting just
// navigates to the dashboard so the rest of the starter UI is reachable.
export function LoginPage(): React.JSX.Element {
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    navigate('/dashboard');
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', px: 2, py: 4 }}>
        <Card sx={{ width: '100%', maxWidth: '28rem' }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 }, '&:last-child': { pb: { xs: 3, sm: 4 } } }}>
            <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, textAlign: 'center' }}>
              <Box component="img" src={logo} alt="Texas Health and Human Services" sx={{ height: '3.5rem', width: 'auto' }} />
              <Typography variant="h1" component="h1">
                Sign in to {APP_NAME}
              </Typography>
            </Box>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Field label="Email" type="email" name="email" placeholder="you@example.com" required />
              <Field label="Password" type="password" name="password" placeholder="••••••••" required />
              <Button type="submit" variant="contained" fullWidth sx={{ mt: 1 }}>
                Sign In
              </Button>
              <Link component="button" type="button" variant="body2" sx={{ alignSelf: 'center' }}>
                Forgot password?
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Box>
      <Footer />
    </Box>
  );
}
