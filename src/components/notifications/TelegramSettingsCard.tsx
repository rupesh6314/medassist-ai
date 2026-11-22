import { useState, useEffect } from 'react'
import {
  Send,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  RotateCw,
  Bell,
  Calendar,
  FileText,
  MessageSquare,
  Unlink,
  AlertCircle,
  ShieldCheck,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { api } from '@/services/api'
import { useToast } from '@/context/ToastContext'

interface TelegramPreferences {
  notifyAppointments: boolean
  notifyReports: boolean
  notifyMessages: boolean
  notifyMedicines?: boolean
  notifyDiet?: boolean
}

interface TelegramStatus {
  connected: boolean
  botConfigured: boolean
  botUsername: string
  chatId?: string
  username?: string | null
  firstName?: string | null
  connectedAt?: string
  timezone?: string
  preferences: TelegramPreferences
}

export function TelegramSettingsCard() {
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<TelegramStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Token Modal
  const [connectModalOpen, setConnectModalOpen] = useState(false)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [tokenData, setTokenData] = useState<{
    token: string
    botUsername: string
    deepLink: string
    webLink?: string
    expiresAt: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  // Disconnect Confirmation Modal
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  // Test Notification
  const [testingNotification, setTestingNotification] = useState(false)

  // Category Toggling
  const [updatingPref, setUpdatingPref] = useState<string | null>(null)

  const fetchStatus = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    try {
      const res = await api.getTelegramStatus()
      setStatus(res)
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve Telegram status')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleStartConnect = async () => {
    setTokenLoading(true)
    setError(null)
    try {
      const res = await api.generateTelegramToken()
      setTokenData({
        token: res.token,
        botUsername: res.botUsername,
        deepLink: res.deepLink,
        webLink: res.webLink,
        expiresAt: res.expiresAt,
      })
      setConnectModalOpen(true)
    } catch (err: any) {
      showToast('Connection Error', err.message || 'Failed to generate link token', 'danger')
    } finally {
      setTokenLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (!tokenData) return
    navigator.clipboard.writeText(`/start ${tokenData.token}`)
    setCopied(true)
    showToast('Command Copied', 'Paste "/start ..." into Telegram to connect.', 'success')
    setTimeout(() => setCopied(false), 2500)
  }

  const handleCheckConnection = async () => {
    try {
      const res = await api.getTelegramStatus()
      setStatus(res)
      if (res.connected) {
        setConnectModalOpen(false)
        showToast('Success', 'Your Telegram account is successfully connected!', 'success')
      } else {
        showToast('Not Connected Yet', 'Please click "Start" inside the Telegram bot, then verify.', 'info')
      }
    } catch {
      showToast('Error', 'Unable to check connection status', 'danger')
    }
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      await api.disconnectTelegram()
      showToast('Disconnected', 'Your Telegram account has been disconnected.', 'info')
      setDisconnectModalOpen(false)
      fetchStatus(false)
    } catch (err: any) {
      showToast('Disconnect Failed', err.message || 'Failed to disconnect', 'danger')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleTestNotification = async () => {
    setTestingNotification(true)
    try {
      const res = await api.sendTelegramTestNotification()
      showToast('Notification Sent', res.message || 'Test message delivered to Telegram!', 'success')
    } catch (err: any) {
      showToast('Test Failed', err.message || 'Failed to send test notification', 'danger')
    } finally {
      setTestingNotification(false)
    }
  }

  const handleTogglePreference = async (key: keyof TelegramPreferences, value: boolean) => {
    if (!status) return
    setUpdatingPref(key)
    const newPrefs = {
      ...status.preferences,
      [key]: value,
    }

    try {
      await api.updateTelegramPreferences({ [key]: value })
      setStatus({
        ...status,
        preferences: newPrefs,
      })
      showToast('Preferences Updated', 'Your notification settings were saved.', 'success')
    } catch (err: any) {
      showToast('Update Failed', err.message || 'Failed to update preference', 'danger')
    } finally {
      setUpdatingPref(null)
    }
  }

  if (loading) {
    return (
      <Card className="animate-rise border-mist-200 bg-white dark:bg-[#131f33]">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  const isConnected = Boolean(status?.connected)

  return (
    <>
      <Card className="animate-rise border-mist-200 bg-white dark:bg-[#131f33] shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/40 text-[#0F766E] dark:text-teal-400">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-ink dark:text-slate-100">
                  Telegram Notifications
                  {isConnected ? (
                    <Badge className="bg-[#0F766E] text-white hover:bg-[#0B5A54] text-xs font-medium">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-mist-300 text-ink-soft dark:text-slate-400 text-xs">
                      Not Connected
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-ink-soft dark:text-slate-400">
                  Receive real-time alerts for appointments, medical reports, and doctor messages via official Telegram Bot.
                </CardDescription>
              </div>
            </div>

            {/* Quick Action Buttons in Header */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestNotification}
                    disabled={testingNotification}
                    className="h-8 text-xs font-medium text-[#0F766E] border-teal-200 hover:bg-teal-50 dark:border-teal-700 dark:hover:bg-teal-900/40"
                  >
                    {testingNotification ? (
                      <RotateCw className="mr-1.5 h-3 w-3 animate-spin" />
                    ) : (
                      <Bell className="mr-1.5 h-3 w-3" />
                    )}
                    Test Alert
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDisconnectModalOpen(true)}
                    className="h-8 text-xs font-medium text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40"
                  >
                    <Unlink className="mr-1.5 h-3 w-3" />
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={handleStartConnect}
                  disabled={tokenLoading}
                  className="h-8 text-xs font-medium bg-[#0F766E] hover:bg-[#0B5A54] text-white"
                >
                  {tokenLoading ? (
                    <RotateCw className="mr-1.5 h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="mr-1.5 h-3 w-3" />
                  )}
                  Connect Telegram
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Connected Details Bar */}
          {isConnected && status && (
            <div className="rounded-xl border border-teal-200 bg-teal-50/60 dark:border-teal-900/70 dark:bg-teal-950/20 p-3.5 sm:p-4 text-xs sm:text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#0F766E] dark:text-teal-400" />
                  <span className="font-semibold text-ink dark:text-slate-200">
                    Linked Account:
                  </span>
                  <span className="font-mono text-[#0F766E] dark:text-teal-400 font-medium">
                    {status.username || (status.firstName ? `${status.firstName}` : `Chat ID: ${status.chatId}`)}
                  </span>
                  {status.chatId && (
                    <span className="text-ink-soft dark:text-slate-400">({status.chatId})</span>
                  )}
                </div>
                {status.connectedAt && (
                  <span className="text-ink-soft dark:text-slate-400 text-[11px]">
                    Connected on {new Date(status.connectedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* If Disconnected: Step-by-Step Instructions */}
          {!isConnected && (
            <div className="rounded-xl border border-mist-200 bg-mist-50/70 dark:border-slate-800 dark:bg-slate-900/40 p-4 space-y-3">
              <div className="flex items-start gap-2 text-xs text-ink-soft dark:text-slate-400">
                <Info className="h-4 w-4 text-[#0F766E] dark:text-teal-400 shrink-0 mt-0.5" />
                <span>
                  Connect your personal Telegram account to receive instant notifications on your mobile or desktop device without keeping the browser open.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                <div className="rounded-lg border border-mist-200 bg-white dark:border-slate-800 dark:bg-slate-800/80 p-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-semibold text-[#0F766E] dark:text-teal-400 mb-1">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#0F766E] text-white text-[10px]">1</span>
                    Click Connect
                  </div>
                  <p className="text-ink-soft dark:text-slate-400 text-[11px]">Generate a single-use secure connection token.</p>
                </div>

                <div className="rounded-lg border border-mist-200 bg-white dark:border-slate-800 dark:bg-slate-800/80 p-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-semibold text-[#0F766E] dark:text-teal-400 mb-1">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#0F766E] text-white text-[10px]">2</span>
                    Open Bot
                  </div>
                  <p className="text-ink-soft dark:text-slate-400 text-[11px]">Open <b>@{status?.botUsername || 'MedAssistAIBot'}</b> directly in Telegram.</p>
                </div>

                <div className="rounded-lg border border-mist-200 bg-white dark:border-slate-800 dark:bg-slate-800/80 p-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-semibold text-[#0F766E] dark:text-teal-400 mb-1">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#0F766E] text-white text-[10px]">3</span>
                    Start &amp; Verify
                  </div>
                  <p className="text-ink-soft dark:text-slate-400 text-[11px]">Tap <b>Start</b>. Your account links instantly and securely.</p>
                </div>
              </div>

              <div className="pt-2 flex justify-start">
                <Button
                  onClick={handleStartConnect}
                  disabled={tokenLoading}
                  className="bg-[#0F766E] hover:bg-[#0B5A54] text-white text-xs font-medium h-9"
                >
                  {tokenLoading ? (
                    <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Connect Telegram Account Now
                </Button>
              </div>
            </div>
          )}

          {/* Notification Categories Settings */}
          {isConnected && status && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-slate-400">
                  Notification Preferences
                </span>
                <span className="text-[11px] text-ink-soft dark:text-slate-400">
                  Toggle individual notification types
                </span>
              </div>

              <div className="divide-y divide-mist-200 dark:divide-slate-800 rounded-xl border border-mist-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
                {/* 1. Doctor Appointments */}
                <div className="flex items-center justify-between p-3.5 hover:bg-mist-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <Label htmlFor="notify-appointments" className="text-xs sm:text-sm font-medium cursor-pointer text-ink dark:text-slate-100">
                        Doctor Appointments
                      </Label>
                      <p className="text-[11px] text-ink-soft dark:text-slate-400">
                        Upcoming consultation reminders, booking confirmations, and schedule updates
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="notify-appointments"
                    checked={status.preferences.notifyAppointments}
                    disabled={updatingPref === 'notifyAppointments'}
                    onCheckedChange={(val) => handleTogglePreference('notifyAppointments', val)}
                  />
                </div>

                {/* 2. Medical Report Processing */}
                <div className="flex items-center justify-between p-3.5 hover:bg-mist-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/40 text-[#0F766E] dark:text-teal-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <Label htmlFor="notify-reports" className="text-xs sm:text-sm font-medium cursor-pointer text-ink dark:text-slate-100">
                        Medical Report Processing
                      </Label>
                      <p className="text-[11px] text-ink-soft dark:text-slate-400">
                        Alerts when uploaded lab reports and clinical trends have finished processing
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="notify-reports"
                    checked={status.preferences.notifyReports}
                    disabled={updatingPref === 'notifyReports'}
                    onCheckedChange={(val) => handleTogglePreference('notifyReports', val)}
                  />
                </div>

                {/* 3. Doctor-Patient Messages */}
                <div className="flex items-center justify-between p-3.5 hover:bg-mist-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <Label htmlFor="notify-messages" className="text-xs sm:text-sm font-medium cursor-pointer text-ink dark:text-slate-100">
                        Doctor-Patient Messages
                      </Label>
                      <p className="text-[11px] text-ink-soft dark:text-slate-400">
                        Confidential alerts when your consulting doctor sends a consultation message
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="notify-messages"
                    checked={status.preferences.notifyMessages}
                    disabled={updatingPref === 'notifyMessages'}
                    onCheckedChange={(val) => handleTogglePreference('notifyMessages', val)}
                  />
                </div>
              </div>

              {/* Privacy Footer Note */}
              <div className="flex items-center gap-1.5 text-[11px] text-ink-soft dark:text-slate-400 pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-[#0F766E] dark:text-teal-400" />
                <span>
                  MedAssist AI strictly safeguards patient privacy. Diagnostic values and confidential clinical notes are never exposed over Telegram.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connection Instructions Modal */}
      <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-[#131f33] border-mist-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg text-ink dark:text-slate-100">
              <Send className="h-5 w-5 text-[#0F766E] dark:text-teal-400" />
              Connect Telegram Account
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-ink-soft dark:text-slate-400">
              Link your Telegram account to start receiving automated healthcare alerts.
            </DialogDescription>
          </DialogHeader>

          {tokenData && (
            <div className="space-y-4 py-2 text-xs sm:text-sm">
              <div className="rounded-xl border border-teal-200 bg-teal-50/70 dark:border-teal-900 dark:bg-teal-950/30 p-3.5 space-y-3">
                <div className="font-semibold text-[#0F766E] dark:text-teal-400 flex items-center justify-between">
                  <span>Fast Connection Options</span>
                  <span className="text-[11px] font-normal text-ink-soft dark:text-slate-400">Expires in 15 mins</span>
                </div>
                <p className="text-xs text-ink-soft dark:text-slate-300">
                  Choose how you want to open Telegram to start the bot with your unique single-use token:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {/* Option 1: Telegram Web (Browser) */}
                  <a
                    href={tokenData.webLink || `https://web.telegram.org/a/#?tgaddr=${encodeURIComponent(`tg://resolve?domain=${tokenData.botUsername}&start=${tokenData.token}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0F766E] hover:bg-[#0B5A54] text-white py-2.5 px-3 font-medium text-xs shadow-xs transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open in Telegram Web
                  </a>

                  {/* Option 2: Telegram App / Desktop */}
                  <a
                    href={tokenData.deepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#0F766E]/40 text-[#0F766E] dark:text-teal-400 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 py-2.5 px-3 font-medium text-xs transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Open in Telegram App
                  </a>
                </div>

                <div className="rounded-md bg-white/70 dark:bg-slate-800/60 p-2 text-[11px] text-ink-soft dark:text-slate-400 flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#0F766E] dark:text-teal-400" />
                  <span>
                    No Telegram app installed on your PC? Use <b>Open in Telegram Web</b> or scan/open on your phone.
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-ink dark:text-slate-300">
                  Or manually send this command in Telegram to <b>@{tokenData.botUsername}</b>:
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={`/start ${tokenData.token}`}
                    className="flex-1 font-mono text-xs bg-mist-50 dark:bg-slate-800 border border-mist-200 dark:border-slate-700 rounded-lg px-3 py-2 text-ink dark:text-slate-200 select-all"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="h-8 text-xs shrink-0"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-2.5 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
                <span>
                  After tapping <b>Start</b> in Telegram, click the verification button below to update your status.
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConnectModalOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleCheckConnection}
              className="bg-[#0F766E] hover:bg-[#0B5A54] text-white text-xs"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              I've Started the Bot — Check Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation Modal */}
      <Dialog open={disconnectModalOpen} onOpenChange={setDisconnectModalOpen}>
        <DialogContent className="max-w-sm bg-white dark:bg-[#131f33] border-mist-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-rose-600 dark:text-rose-400">
              <Unlink className="h-5 w-5" />
              Disconnect Telegram?
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-soft dark:text-slate-400">
              Are you sure you want to disconnect Telegram notifications? You will stop receiving automated alerts for your appointments, medical report updates, and doctor messages on Telegram.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDisconnectModalOpen(false)}
              disabled={disconnecting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-xs"
            >
              {disconnecting ? <RotateCw className="mr-1.5 h-3 w-3 animate-spin" /> : null}
              Confirm Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
