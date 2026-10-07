import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/hhs-logo.png';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Footer } from '../components/Footer';
import { Input } from '../components/Input';
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
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <img src={logo} alt="Texas Health and Human Services" className="h-14 w-auto" />
            <h1 className="text-lg font-semibold text-text">Sign in to {APP_NAME}</h1>
          </div>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input label="Email" type="email" name="email" placeholder="you@example.com" required />
            <Input label="Password" type="password" name="password" placeholder="••••••••" required />
            <Button type="submit" className="mt-2 w-full">
              Sign In
            </Button>
            <button type="button" className="text-sm text-primary hover:underline">
              Forgot password?
            </button>
          </form>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
