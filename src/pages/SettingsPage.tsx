import { useState } from 'react'
import { Sun, Moon, Monitor, Lock, Mail, CheckCircle2, Loader2, Send } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { TelegramSettingsCard } from '@/components/notifications/TelegramSettingsCard'
import { api } from '@/services/api'
import { cn } from '@/utils/cn'

const appearanceOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { showToast } = useToast()
  const [dataSharing, setDataSharing] = useState(true)
  const [sendingTestEmail, setSendingTestEmail] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true)
    try {
      const res = await api.sendEmailTestNotification()
      showToast('Email Sent', res.message || 'Test notification dispatched to your email.', 'success')
    } catch (err: any) {
      showToast('Email Error', err.message || 'Failed to dispatch test email.', 'warning')
    } finally {
      setSendingTestEmail(false)
    }
  }

  return (
    <div>
      <PageHeader crumbs={['MediAssist AI', 'Settings']} title="Settings" description="Manage your appearance, notifications, privacy, and account preferences." />

      <div className="space-y-6">
        {/* Email Notifications Card */}
        <Card className="animate-rise border-teal-200/80 bg-teal-50/20 shadow-2xs">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base text-ink">Email Notifications</CardTitle>
                  <CardDescription className="text-xs text-ink-soft">
                    Google Gmail SMTP service for clinical alerts and appointment updates
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="border-teal-300 bg-teal-50 text-teal-800 text-[11px] font-semibold gap-1">
                <CheckCircle2 className="h-3 w-3 text-teal-600" /> Connected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-teal-100 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications" className="font-semibold text-xs text-ink">Email Delivery Service</Label>
                  <p className="text-[11px] text-ink-soft mt-0.5">Send report summaries, appointment reminders, and urgent alerts</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={(v) => {
                    setEmailNotifications(v)
                    showToast(v ? 'Email notifications enabled' : 'Email notifications paused')
                  }}
                />
              </div>

              <div className="pt-2 border-t border-mist-100 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] text-ink-soft">
                  Sender: <strong className="text-ink">MeddiAssist &lt;rupesh.madhuvarsu2005@gmail.com&gt;</strong>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSendTestEmail}
                  disabled={sendingTestEmail}
                  className="h-8 text-xs border-teal-300 text-teal-800 hover:bg-teal-50 font-medium"
                >
                  {sendingTestEmail ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5 text-teal-600" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 mr-1.5 text-teal-600" />
                      Send Test Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Telegram Notifications Section */}
        <TelegramSettingsCard />

        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose how MediAssist AI looks on your device</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {appearanceOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => {
                  setTheme(value)
                  showToast('Theme updated', `Switched to ${label} mode.`)
                }}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-5 transition-colors',
                  theme === value ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/40 dark:border-teal-500' : 'border-mist-200 hover:bg-mist-50 dark:hover:bg-slate-800'
                )}
              >
                <Icon className={cn('h-6 w-6', theme === value ? 'text-teal-600 dark:text-teal-400' : 'text-ink-soft')} />
                <span className={cn('text-sm font-semibold', theme === value ? 'text-teal-700 dark:text-teal-300' : 'text-ink')}>{label}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>Control how your health data is used</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-mist-200 p-4">
              <div>
                <Label htmlFor="data-sharing">Data Sharing</Label>
                <p className="mt-0.5 text-xs text-ink-soft">Share anonymized data to help improve health insights</p>
              </div>
              <Switch
                id="data-sharing"
                checked={dataSharing}
                onCheckedChange={(v) => {
                  setDataSharing(v)
                  showToast(v ? 'Data sharing enabled' : 'Data sharing disabled')
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Lock className="h-4 w-4" /> Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>Update your account password.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="current-password">Current password</Label>
                    <Input id="current-password" type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password">New password</Label>
                    <Input id="new-password" type="password" placeholder="••••••••" />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => showToast('Password updated', 'Your password has been changed.')}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
