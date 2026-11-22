import { useState } from 'react'
import {
  CreditCard,
  CheckCircle2,
  Lock,
  Smartphone,
  Building2,
  AlertCircle,
  ShieldCheck,
  RotateCw,
  Sparkles,
  Calendar,
  Clock,
  Stethoscope,
  QrCode,
  ArrowRight,
  Leaf,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toDDMMYYYY } from '@/services/appointmentService'

interface RazorpayPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (paymentReference: string, paymentMethod: string) => void
  doctorName: string
  fee: number
  appointmentDate: string
  appointmentTime: string
  appointmentType: 'online' | 'offline'
}

type PaymentMethod = 'card' | 'upi' | 'netbanking'

export function RazorpayPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  doctorName,
  fee,
  appointmentDate,
  appointmentTime,
  appointmentType,
}: RazorpayPaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444')
  const [cardExpiry, setCardExpiry] = useState('12/28')
  const [cardCvv, setCardCvv] = useState('888')
  const [cardName, setCardName] = useState('Test Patient')
  const [upiId, setUpiId] = useState('patient@okhdfcbank')
  const [selectedBank, setSelectedBank] = useState('HDFC Bank')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setProcessing(true)

    // Simulate authentic payment processing with organic ease
    setTimeout(() => {
      const dummyRef = `pay_med_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString().slice(-4)}`
      setProcessing(false)
      onSuccess(dummyRef, method)
    }, 1100)
  }

  const popularBanks = [
    { name: 'HDFC Bank', code: 'HDFC' },
    { name: 'State Bank of India', code: 'SBI' },
    { name: 'ICICI Bank', code: 'ICICI' },
    { name: 'Axis Bank', code: 'AXIS' },
  ]

  const popularUpiApps = ['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI']

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[88vh] flex flex-col p-0 border-0 rounded-3xl bg-[#FAFBF9] shadow-2xl overflow-hidden my-auto gap-0 [&>button]:text-white [&>button]:opacity-80 [&>button]:hover:opacity-100 [&>button]:hover:bg-white/10 [&>button]:top-5 [&>button]:right-5 [&>button]:z-20">
        {/* Organic Sage Botanical Header - Fixed top */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#0D5C54] via-[#115E59] to-[#043E38] p-5 sm:p-6 text-white">
          {/* Subtle natural glowing ambient patterns */}
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-teal-300/10 blur-xl pointer-events-none" />
          
          <div className="relative z-10 pr-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md shadow-inner text-emerald-200 border border-white/20">
                  <Leaf className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-base leading-tight text-white tracking-tight">
                      MediAssist Checkout
                    </h3>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200 border border-emerald-400/30">
                      <Sparkles className="h-2.5 w-2.5" /> Secure
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-100/80 mt-0.5">Clinical consultation payment confirmation</p>
                </div>
              </div>

              <Badge className="bg-white/10 text-emerald-100 border-white/20 text-[10px] font-mono uppercase tracking-wider backdrop-blur-xs">
                Test Sandbox
              </Badge>
            </div>

            {/* Total Fee Organic Card Banner */}
            <div className="mt-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-teal-100/90 font-medium">Total Amount Payable</span>
                <p className="text-[10px] text-teal-200/70">Inclusive of all medical taxes & service charges</p>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-xs font-semibold text-teal-200">INR</span>
                  <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white">
                    ₹{fee.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body with smooth scrolling */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4">
          {/* Doctor & Schedule Botanical Overview Card */}
          <div className="rounded-2xl bg-white border border-emerald-900/10 p-3.5 sm:p-4 shadow-xs hover:shadow-sm transition-shadow space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0 shadow-xs">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Consulting Specialist</p>
                  <p className="font-display font-bold text-slate-900 text-sm">Dr. {doctorName}</p>
                </div>
              </div>

              <Badge
                variant="outline"
                className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  appointmentType === 'online'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {appointmentType === 'online' ? '🌿 Online Video' : '🏥 In-Clinic'}
              </Badge>
            </div>

            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-teal-600" />
                <span className="font-medium text-slate-800">{toDDMMYYYY(appointmentDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-teal-600" />
                <span className="font-medium text-slate-800">{appointmentTime}</span>
              </div>
            </div>
          </div>

          {/* Natural Method Selector Tabs */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Choose Payment Method</label>
            <div className="grid grid-cols-3 gap-2 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  method === 'card'
                    ? 'bg-white text-teal-800 shadow-sm border border-emerald-900/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <CreditCard className={`h-4 w-4 ${method === 'card' ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>Card</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  method === 'upi'
                    ? 'bg-white text-teal-800 shadow-sm border border-emerald-900/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Smartphone className={`h-4 w-4 ${method === 'upi' ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>UPI / QR</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('netbanking')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  method === 'netbanking'
                    ? 'bg-white text-teal-800 shadow-sm border border-emerald-900/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Building2 className={`h-4 w-4 ${method === 'netbanking' ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>NetBanking</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Forms Per Method */}
          <form onSubmit={handlePay} className="space-y-4">
            {method === 'card' && (
              <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm space-y-3.5">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Card Number</label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">VISA</span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">MC</span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">RuPay</span>
                    </div>
                  </div>
                  <Input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4111 2222 3333 4444"
                    className="font-mono text-xs h-10 mt-1.5 bg-slate-50/50 border-slate-200 focus-visible:bg-white rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Expiry (MM/YY)</label>
                    <Input
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="font-mono text-xs h-10 mt-1.5 bg-slate-50/50 border-slate-200 focus-visible:bg-white rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">CVV Code</label>
                    <Input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      className="font-mono text-xs h-10 mt-1.5 bg-slate-50/50 border-slate-200 focus-visible:bg-white rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cardholder Name</label>
                  <Input
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Name on card"
                    className="text-xs h-10 mt-1.5 bg-slate-50/50 border-slate-200 focus-visible:bg-white rounded-xl"
                    required
                  />
                </div>
              </div>
            )}

            {method === 'upi' && (
              <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-teal-600" />
                    <span className="text-xs font-semibold text-slate-800">Scan & Pay via any UPI App</span>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Instant</Badge>
                </div>

                {/* Popular UPI Apps Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {popularUpiApps.map((app) => (
                    <div
                      key={app}
                      onClick={() => setUpiId(`user@${app.toLowerCase().replace(/\s+/g, '')}`)}
                      className="flex items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200/70 hover:border-teal-300 text-slate-700 hover:text-teal-700 text-[11px] font-medium cursor-pointer transition-colors"
                    >
                      {app}
                    </div>
                  ))}
                </div>

                <div className="pt-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Or Enter Virtual Payment Address (UPI ID)
                  </label>
                  <Input
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@bank"
                    className="text-xs h-10 font-mono mt-1.5 bg-slate-50/50 border-slate-200 focus-visible:bg-white rounded-xl"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">Sandbox simulation automatically verifies and approves this test payment.</p>
                </div>
              </div>
            )}

            {method === 'netbanking' && (
              <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm space-y-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Popular Banks</label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {popularBanks.map((b) => (
                      <button
                        key={b.name}
                        type="button"
                        onClick={() => setSelectedBank(b.name)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          selectedBank === b.name
                            ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-xs'
                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span>{b.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{b.code}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">All Other Banks</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full mt-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-800 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                    <option value="Punjab National Bank">Punjab National Bank</option>
                    <option value="Bank of Baroda">Bank of Baroda</option>
                    <option value="Canara Bank">Canara Bank</option>
                  </select>
                </div>
              </div>
            )}

            {/* Natural CTA Pay Button */}
            <div className="pt-1">
              <Button
                type="submit"
                disabled={processing}
                className="w-full bg-gradient-to-r from-teal-600 via-[#0F766E] to-emerald-600 hover:from-teal-700 hover:via-[#0B5A54] hover:to-emerald-700 text-white font-semibold text-sm h-11 sm:h-12 rounded-2xl shadow-lg shadow-teal-700/20 active:scale-[0.99] transition-all cursor-pointer"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <RotateCw className="h-4 w-4 animate-spin text-emerald-200" /> Confirming Secure Payment...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Lock className="h-4 w-4 text-emerald-200" />
                    <span>Pay ₹{fee.toFixed(2)} & Confirm Appointment</span>
                    <ArrowRight className="h-4 w-4 text-emerald-200" />
                  </span>
                )}
              </Button>
            </div>
          </form>

          {/* Bottom Security & Organic Trust Guarantee */}
          <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200/60 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
              <span>256-bit Encrypted Healthcare Transaction</span>
            </div>
            <span className="text-[10px] text-slate-400">100% Refund on Cancellation</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
