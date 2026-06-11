import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../../components/useAuth'

export default function TeacherAccountPage() {
  const { user } = useAuth()
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState('')
  const [careerDirection, setCareerDirection] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setBio(user?.extra?.bio || '')
    setInterests(user?.extra?.interests?.join(', ') || '')
    setCareerDirection(user?.extra?.career_direction || '')
  }, [user])

  const saveProfile = (event: FormEvent) => {
    event.preventDefault()
    setMessage('')
    setError('Profile update is not supported by the current backend API.')
  }

  const savePassword = (event: FormEvent) => {
    event.preventDefault()
    setMessage('')
    setError('Password change is not supported by the current backend API.')
    setOldPassword('')
    setNewPassword('')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Account Settings</h1>
        <p className="mt-1 text-sm text-slate-500">{user?.name} / {user?.username}</p>
      </div>

      {(error || message) && (
        <div className={`rounded-lg px-3 py-2 text-sm ${error ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
          {error || message}
        </div>
      )}

      <form onSubmit={saveProfile} className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-800">Profile</h2>
        <label className="mb-1 block text-sm font-medium text-slate-700">Career Direction</label>
        <input
          value={careerDirection}
          onChange={(event) => setCareerDirection(event.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
        <label className="mb-1 block text-sm font-medium text-slate-700">Interests</label>
        <input
          value={interests}
          onChange={(event) => setInterests(event.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
        <label className="mb-1 block text-sm font-medium text-slate-700">Bio</label>
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          rows={4}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
        <button className="rounded-lg bg-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
          Save Profile
        </button>
      </form>

      <form onSubmit={savePassword} className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-800">Change Password</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Old Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>
        <button className="mt-4 rounded-lg bg-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
          Change Password
        </button>
      </form>
    </div>
  )
}
