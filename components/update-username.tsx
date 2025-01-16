'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { updateUsername } from '@/lib/auth-utils'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'

interface UpdateUsernameProps {
  onClose?: () => void;
}

export function UpdateUsername({ onClose }: UpdateUsernameProps) {
  const [newUsername, setNewUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [user] = useAuthState(auth)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newUsername.trim() || isLoading) return

    setIsLoading(true)
    try {
      const result = await updateUsername(newUsername.trim())
      if (result.success) {
        toast.success('Username updated successfully')
        setNewUsername('')
        if (onClose) {
          onClose()
        }
      } else {
        toast.error(result.error || 'Failed to update username')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Update Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="newUsername" className="block text-sm font-medium">
            New Username
          </label>
          <Input
            id="newUsername"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder={user?.displayName || 'Enter new username'}
            required
            disabled={isLoading}
            className="bg-background"
          />
        </div>
        <Button 
          type="submit" 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Updating...' : 'Update Username'}
        </Button>
      </form>
    </div>
  )
}

