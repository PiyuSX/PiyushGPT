'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { loginWithEmail, registerWithEmail, loginWithGoogle, updateUsername } from '@/lib/auth-utils'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'

export function AuthForm() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showUsernameInput, setShowUsernameInput] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isRegistering) {
        if (!username.trim()) {
          toast.error('Username is required')
          return
        }
        const result = await registerWithEmail(email, password, username)
        if (result.success) {
          toast.success('Registered successfully')
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await loginWithEmail(email, password)
        if (result.success) {
          toast.success('Logged in successfully')
        } else {
          toast.error(result.error)
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const result = await loginWithGoogle()
      if (result.success) {
        toast.success('Logged in with Google successfully')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center text-foreground">
        {isRegistering ? 'Register for Piyush GPT' : 'Login to Piyush GPT'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {isRegistering && (
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground">
              Username
            </label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              className="mt-1"
              disabled={isLoading}
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isRegistering ? 'Register' : 'Login'}
        </Button>
      </form>
      <div className="text-center">
        <button
          onClick={() => {
            setIsRegistering(!isRegistering)
            setUsername('')
            setEmail('')
            setPassword('')
          }}
          className="text-sm text-blue-500 hover:underline"
          disabled={isLoading}
        >
          {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button
        onClick={handleGoogleLogin}
        variant="outline"
        className="w-full"
        disabled={isLoading}
      >
        <svg
          className="mr-2 h-4 w-4"
          aria-hidden="true"
          focusable="false"
          data-prefix="fab"
          data-icon="google"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 488 512"
        >
          <path
            fill="currentColor"
            d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
          ></path>
        </svg>
        Sign in with Google
      </Button>
    </div>
  )
}

