import { useRef, useState } from 'react'
import { UploadCloud, FileCheck2, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useToast } from '@/context/ToastContext'
import { api } from '@/services/api'

interface UploadZoneProps {
  onComplete: (newReport?: any) => void
}

export function UploadZone({ onComplete }: UploadZoneProps) {
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [stageText, setStageText] = useState('Extracting report data...')
  const [fileName, setFileName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const handleFileUpload = async (file: File) => {
    if (!consentAccepted) {
      showToast('Consent Required', 'Please review and accept the medical data privacy and informational disclaimer notice before uploading.', 'warning')
      setErrorMsg('You must check and agree to the consent notice before uploading your report.')
      return
    }

    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg']
    const validMimes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!validExtensions.includes(ext) && !validMimes.includes(file.type)) {
      showToast('Invalid File Type', 'Only PDF documents and medical report images (.pdf, .png, .jpg, .jpeg) are supported.', 'warning')
      setErrorMsg('Only PDF documents and images (.pdf, .png, .jpg, .jpeg) are supported.')
      return
    }

    setFileName(file.name)
    setStatus('uploading')
    setProgress(20)
    setStageText('Extracting report data...')
    setErrorMsg('')

    let currentStep = 1
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev < 90 ? prev + 8 : prev
        if (next >= 35 && currentStep === 1) {
          currentStep = 2
          setStageText('Analyzing extracted values...')
        } else if (next >= 65 && currentStep === 2) {
          currentStep = 3
          setStageText('Generating simplified explanation with local AI...')
        }
        return next
      })
    }, 400)

    try {
      const formData = new FormData()
      formData.append('reportFile', file)
      formData.append('type', file.name.replace(/\.[^/.]+$/, '').replace(/[\_\-]/g, ' '))

      const res = await api.uploadReport(formData)
      clearInterval(progressInterval)

      setProgress(100)
      setStageText('Report analysis complete')
      setStatus('done')
      showToast('Report analyzed successfully', `${file.name} was parsed and explained.`)
      window.dispatchEvent(new Event('medassist_reports_updated'))
      onComplete(res.report)
    } catch (err: any) {
      clearInterval(progressInterval)
      setStatus('idle')
      setErrorMsg(err.message || 'Failed to upload and parse report.')
      showToast('Upload Error', err.message || 'Failed to upload report.', 'warning')
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    handleFileUpload(files[0])
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragActive(true)
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragActive(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-8 px-6 text-center transition-colors',
        dragActive ? 'border-teal-500 bg-teal-50/70' : 'border-mist-200 bg-mist-50/60 hover:border-teal-300 hover:bg-mist-50'
      )}
    >
      {status === 'idle' && (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="font-display text-sm font-semibold text-ink">Drag & drop your medical report (PDF or Image) here</p>
          <p className="text-xs text-ink-soft">Supports PDF, PNG, JPG up to 25MB</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {/* Privacy & Consent Notice */}
          <div className="mt-3 max-w-md rounded-lg border border-teal-200 dark:border-teal-800/40 bg-teal-50/50 dark:bg-teal-950/20 p-3 text-left">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={(e) => {
                  setConsentAccepted(e.target.checked)
                  if (e.target.checked) setErrorMsg('')
                }}
                className="mt-0.5 h-4 w-4 rounded border-mist-300 text-teal-600 focus:ring-teal-500"
              />
              <span>
                <strong>Privacy & Clinical Consent:</strong> I acknowledge that uploaded files are processed in-memory (ephemeral) and discarded immediately after value extraction. Stored parameters are strictly for informational and clinical tracking, not a substitute for direct physician diagnosis.
              </span>
            </label>
          </div>

          <Button 
            variant={consentAccepted ? "default" : "outline"} 
            size="sm" 
            className="mt-2" 
            disabled={!consentAccepted}
            onClick={() => {
              if (!consentAccepted) {
                setErrorMsg('Please accept the consent notice first.')
                return
              }
              inputRef.current?.click()
            }}
          >
            Browse File
          </Button>

          {errorMsg && (
            <p className="mt-2 text-xs text-rose-500 font-medium">{errorMsg}</p>
          )}
        </>
      )}

      {status === 'uploading' && (
        <div className="w-full max-w-sm">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-teal-600" />
          <p className="text-sm font-semibold text-ink">{fileName}</p>
          <p className="mt-1 text-xs font-medium text-teal-700 animate-pulse">{stageText}</p>
          <Progress value={progress} className="mt-3" />
          <div className="mt-1 flex justify-between text-[11px] text-ink-soft">
            <span>Progress</span>
            <span className="font-mono font-medium">{Math.round(progress)}%</span>
          </div>
        </div>
      )}

      {status === 'done' && (
        <div>
          <FileCheck2 className="mx-auto mb-2 h-8 w-8 text-teal-600" />
          <p className="text-sm font-semibold text-ink">{fileName} analyzed & saved</p>
          <p className="text-xs text-teal-700 font-medium mt-0.5">Extracted values & AI explanation ready</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => {
              setStatus('idle')
              setFileName('')
              setErrorMsg('')
            }}
          >
            Upload another
          </Button>
        </div>
      )}
    </div>
  )
}
