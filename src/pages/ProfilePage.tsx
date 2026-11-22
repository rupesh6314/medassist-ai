import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Pencil,
  Save,
  Building,
  GraduationCap,
  Award,
  IndianRupee,
  MapPin,
  FileText,
  Stethoscope,
  Clock,
  Phone,
  Mail,
  User,
  HeartPulse,
  MessageSquare,
  Cigarette,
  Activity,
  Salad,
  AlertCircle,
  Plus,
  X,
  ShieldAlert,
  Ruler,
  Scale,
  CheckCircle2,
  Send,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { api } from '@/services/api'
import { cn } from '@/utils/cn'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const SMOKING_OPTIONS = ['Never', 'Former smoker', 'Current smoker', 'Occasional', 'Prefer not to say']
const ACTIVITY_OPTIONS = [
  { id: 'Sedentary', label: 'Sedentary (Little/no exercise)' },
  { id: 'Lightly active', label: 'Lightly active (1–3 days/wk)' },
  { id: 'Moderately active', label: 'Moderately active (3–5 days/wk)' },
  { id: 'Very active', label: 'Very active (6–7 days/wk)' }
]
const DIET_OPTIONS = ['Vegetarian', 'Eggetarian', 'Non-Vegetarian', 'Vegan', 'Other']
const ALLERGY_CHIPS = ['Dairy', 'Gluten', 'Peanuts', 'Tree nuts', 'Eggs', 'Fish', 'Shellfish', 'Soy', 'Mustard', 'Penicillin', 'Sulfa drugs', 'Pollen']
const COMMON_CONDITIONS = ['Diabetes Type 2', 'Hypertension', 'Asthma', 'Thyroid Disorder', 'High Cholesterol', 'Migraine', 'Arthritis']

const SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Psychotherapist',
  'Endocrinologist',
  'Diabetologist',
  'Dermatologist',
  'Neurologist',
  'Pediatrician',
  'Orthopedic Surgeon',
  'Gastroenterologist',
  'Pulmonologist',
  'Nephrologist',
  'Other'
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const { showToast } = useToast()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const isDoctor = user?.role === 'doctor'

  // Height unit state: 'cm' | 'ft'
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm')

  const [customAllergyInput, setCustomAllergyInput] = useState('')
  const [customConditionInput, setCustomConditionInput] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: 0,
    gender: '',
    bloodGroup: '',
    heightCm: 0,
    weightKg: 0,
    smokingHabit: '',
    activityLevel: '',
    dietaryPreference: '',
    allergies: [] as string[],
    existingConditions: [] as string[],
    feet: 0,
    inches: 0,
    // Doctor specific fields
    hospitalName: '',
    specialization: '',
    experienceYears: 0,
    qualification: '',
    medicalLicense: '',
    consultationFee: 500,
    clinicAddress: '',
    bio: '',
    consultationType: 'Both',
  })

  // Helper conversions
  const cmToFtIn = (cm: number) => {
    if (!cm || cm <= 0) return { feet: 0, inches: 0 }
    const totalInches = cm / 2.54
    const feet = Math.floor(totalInches / 12)
    const inches = Math.round(totalInches % 12)
    if (inches === 12) {
      return { feet: feet + 1, inches: 0 }
    }
    return { feet, inches }
  }

  const ftInToCm = (feet: number, inches: number) => {
    const totalInches = (Number(feet) || 0) * 12 + (Number(inches) || 0)
    return Math.round(totalInches * 2.54)
  }

  const toggleAllergy = (allergy: string) => {
    setFormData((prev) => {
      const exists = prev.allergies.includes(allergy)
      return {
        ...prev,
        allergies: exists ? prev.allergies.filter((a) => a !== allergy) : [...prev.allergies, allergy],
      }
    })
  }

  const addCustomAllergy = () => {
    const trimmed = customAllergyInput.trim()
    if (!trimmed) return
    if (!formData.allergies.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, allergies: [...prev.allergies, trimmed] }))
    }
    setCustomAllergyInput('')
  }

  const removeAllergy = (allergy: string) => {
    setFormData((prev) => ({ ...prev, allergies: prev.allergies.filter((a) => a !== allergy) }))
  }

  const toggleCondition = (condition: string) => {
    setFormData((prev) => {
      const exists = prev.existingConditions.includes(condition)
      return {
        ...prev,
        existingConditions: exists ? prev.existingConditions.filter((c) => c !== condition) : [...prev.existingConditions, condition],
      }
    })
  }

  const addCustomCondition = () => {
    const trimmed = customConditionInput.trim()
    if (!trimmed) return
    if (!formData.existingConditions.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, existingConditions: [...prev.existingConditions, trimmed] }))
    }
    setCustomConditionInput('')
  }

  const removeCondition = (condition: string) => {
    setFormData((prev) => ({ ...prev, existingConditions: prev.existingConditions.filter((c) => c !== condition) }))
  }

  useEffect(() => {
    if (user) {
      const blood = user.bloodGroup || user.blood_type || ''
      const height = user.heightCm || user.height_cm || 0
      const weight = user.weightKg || user.weight_kg || 0
      const smoking = user.smokingHabit || user.smoking_habit || ''
      const activity = user.activityLevel || user.activity_level || ''
      const diet = user.dietaryPreference || user.dietary_preference || ''
      
      const parseList = (val: any): string[] => {
        if (Array.isArray(val)) return val
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val)
            if (Array.isArray(parsed)) return parsed
          } catch {
            return val.split(',').map((s: string) => s.trim()).filter(Boolean)
          }
        }
        return []
      }

      const allergiesList = parseList(user.allergies)
      const conditionsList = parseList(user.existingConditions || (user as any).existing_conditions)
      const { feet, inches } = cmToFtIn(height)

      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        age: user.age || 0,
        gender: user.gender || '',
        bloodGroup: blood,
        heightCm: height,
        weightKg: weight,
        smokingHabit: smoking,
        activityLevel: activity,
        dietaryPreference: diet,
        allergies: allergiesList,
        existingConditions: conditionsList,
        feet,
        inches,
        hospitalName: user.hospitalName || (user as any).hospital_name || 'Apex Super Specialty Hospital',
        specialization: user.specialization || 'General Physician',
        experienceYears: user.experienceYears || (user as any).experience_years || 8,
        qualification: user.qualification || 'MBBS, MD',
        medicalLicense: user.medicalLicense || (user as any).medical_license || 'MCI-84920',
        consultationFee: user.consultationFee || (user as any).consultation_fee || 500,
        clinicAddress: user.clinicAddress || (user as any).clinic_address || 'MediAssist Health Center, Suite 302, Medical City',
        bio: user.bio || 'Experienced healthcare specialist dedicated to evidence-based medical consulting and personalized patient care.',
        consultationType: user.consultationType || (user as any).consultation_type || 'Both',
      })
    }
  }, [user])

  const handleHeightCmChange = (cmVal: number) => {
    const { feet, inches } = cmToFtIn(cmVal)
    setFormData((prev) => ({
      ...prev,
      heightCm: cmVal,
      feet,
      inches,
    }))
  }

  const handleFtInChange = (newFeet: number, newInches: number) => {
    const calculatedCm = ftInToCm(newFeet, newInches)
    setFormData((prev) => ({
      ...prev,
      feet: newFeet,
      inches: newInches,
      heightCm: calculatedCm,
    }))
  }

  const displayName = formData.name || 'User'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const calculatedBmi =
    formData.heightCm > 0 && formData.weightKg > 0
      ? Number((formData.weightKg / Math.pow(formData.heightCm / 100, 2)).toFixed(1))
      : null

  const getBmiCategory = (bmi: number | null) => {
    if (!bmi || bmi <= 0) return null
    if (bmi < 18.5) return { label: 'Underweight', color: 'bg-amber-50 text-amber-700 border-amber-200' }
    if (bmi <= 24.9) return { label: 'Normal Weight', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    if (bmi <= 29.9) return { label: 'Overweight', color: 'bg-amber-50 text-amber-800 border-amber-300' }
    return { label: 'Obese', color: 'bg-rose-50 text-rose-700 border-rose-200' }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isDoctor) {
        await api.updateProfile({
          name: formData.name,
          phone: formData.phone,
          hospitalName: formData.hospitalName,
          specialization: formData.specialization,
          experienceYears: Number(formData.experienceYears),
          qualification: formData.qualification,
          medicalLicense: formData.medicalLicense,
          consultationFee: Number(formData.consultationFee),
          clinicAddress: formData.clinicAddress,
          bio: formData.bio,
          consultationType: formData.consultationType,
        })
      } else {
        await api.updateProfile({
          name: formData.name,
          phone: formData.phone,
          age: Number(formData.age),
          gender: formData.gender,
          bloodGroup: formData.bloodGroup,
          blood_type: formData.bloodGroup,
          heightCm: Number(formData.heightCm),
          height_cm: Number(formData.heightCm),
          weightKg: Number(formData.weightKg),
          weight_kg: Number(formData.weightKg),
          smokingHabit: formData.smokingHabit,
          activityLevel: formData.activityLevel,
          dietaryPreference: formData.dietaryPreference,
          allergies: formData.allergies,
          existingConditions: formData.existingConditions,
        })
      }
      await refreshUser()
      setEditing(false)
      showToast('Profile updated', 'Your profile details have been saved successfully.', 'success')
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update profile.', 'danger')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="font-body space-y-6">
      <PageHeader
        crumbs={['MediAssist AI', 'Profile']}
        title={isDoctor ? 'Doctor Profile & Practice Settings' : 'Personal & Health Profile'}
        description={isDoctor ? 'Manage your hospital affiliation, clinical qualifications, consultation fee, and practice details.' : 'Your personal demographics, vitals, and health preferences.'}
      />

      {/* Main Header Card */}
      <Card className="animate-rise border-mist-200 bg-white shadow-xs rounded-2xl">
        <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-teal-600/30 shadow-xs">
              <AvatarFallback className="font-display text-lg font-bold text-teal-700 bg-teal-50">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="font-display text-xl font-bold tracking-tight text-ink">{displayName}</CardTitle>
                {isDoctor && (
                  <Badge className="bg-teal-50 text-teal-700 border-teal-200 text-xs">
                    {formData.specialization || 'Physician'}
                  </Badge>
                )}
              </div>
              <CardDescription className="font-body text-sm text-ink-soft mt-0.5">{formData.email}</CardDescription>
              {isDoctor ? (
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="inline-block rounded-md bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-mono font-semibold text-teal-800">
                    Doctor ID: {user?.doctorId || (user as any)?.doctor_id || 'D000001'}
                  </span>
                  <span className="inline-block rounded-md bg-mist-100 border border-mist-200 px-2.5 py-0.5 text-xs font-medium text-ink-soft">
                    {formData.hospitalName}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="inline-block rounded-md bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-mono font-semibold text-teal-800">
                    Patient ID: {user?.patientId || (user as any)?.patient_id || 'P000001'}
                  </span>
                  {calculatedBmi !== null && (
                    <span className="inline-block rounded-md bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-mono font-semibold text-teal-800">
                      BMI: {calculatedBmi} kg/m²
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          {editing ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
                className="text-xs h-9 px-3"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-teal-600 text-white hover:bg-teal-700 font-medium shadow-xs text-xs h-9 px-4 rounded-xl"
              >
                <Save className="h-4 w-4 mr-1.5" /> {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings')}
                className="text-xs h-9 px-3 border-[#0F766E]/30 text-[#0F766E] hover:bg-[#0F766E]/10 rounded-xl"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" /> Telegram Alerts
              </Button>
              <Button
                onClick={() => setEditing(true)}
                className="bg-teal-600 text-white hover:bg-teal-700 font-medium shadow-xs text-xs h-9 px-4 rounded-xl"
              >
                <Pencil className="h-4 w-4 mr-1.5" /> Edit Profile
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* DOCTOR PROFILE FORM */}
      {isDoctor && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Professional Practice & Hospital Details */}
          <Card className="border-mist-200 bg-white shadow-xs rounded-2xl">
            <CardHeader className="p-5 border-b border-mist-100">
              <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                <Building className="h-4 w-4 text-teal-600" /> Hospital Affiliation & Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="hospitalName" className="text-xs font-semibold text-ink-soft">
                  Hospital / Medical Center Name *
                </Label>
                <Input
                  id="hospitalName"
                  disabled={!editing}
                  className="text-xs"
                  placeholder="e.g. Apex Super Specialty Hospital"
                  value={formData.hospitalName}
                  onChange={(e) => setFormData((p) => ({ ...p, hospitalName: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="specialization" className="text-xs font-semibold text-ink-soft">
                  Medical Specialization *
                </Label>
                {editing ? (
                  <select
                    id="specialization"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-ink focus-visible:ring-2 focus-visible:ring-[#0F766E]"
                    value={formData.specialization}
                    onChange={(e) => setFormData((p) => ({ ...p, specialization: e.target.value }))}
                  >
                    {SPECIALIZATIONS.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input id="specialization" disabled className="text-xs bg-mist-50" value={formData.specialization} />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="experienceYears" className="text-xs font-semibold text-ink-soft">
                    Experience (Years) *
                  </Label>
                  <div className="relative">
                    <Input
                      id="experienceYears"
                      type="number"
                      min="0"
                      max="70"
                      disabled={!editing}
                      className="text-xs pr-10"
                      value={formData.experienceYears}
                      onChange={(e) => setFormData((p) => ({ ...p, experienceYears: Number(e.target.value) }))}
                    />
                    <span className="absolute right-3 top-2 text-xs text-ink-soft pointer-events-none">yrs</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="consultationFee" className="text-xs font-semibold text-ink-soft">
                    Consultation Fee (₹) *
                  </Label>
                  <div className="relative">
                    <Input
                      id="consultationFee"
                      type="number"
                      min="0"
                      step="50"
                      disabled={!editing}
                      className="text-xs pl-7"
                      value={formData.consultationFee}
                      onChange={(e) => setFormData((p) => ({ ...p, consultationFee: Number(e.target.value) }))}
                    />
                    <span className="absolute left-2.5 top-2 text-xs text-ink-soft pointer-events-none">₹</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="qualification" className="text-xs font-semibold text-ink-soft">
                    Qualifications *
                  </Label>
                  <Input
                    id="qualification"
                    disabled={!editing}
                    className="text-xs"
                    placeholder="e.g. MBBS, MD (General Medicine)"
                    value={formData.qualification}
                    onChange={(e) => setFormData((p) => ({ ...p, qualification: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="medicalLicense" className="text-xs font-semibold text-ink-soft">
                    Medical License No. *
                  </Label>
                  <Input
                    id="medicalLicense"
                    disabled={!editing}
                    className="text-xs"
                    placeholder="e.g. MCI-84920"
                    value={formData.medicalLicense}
                    onChange={(e) => setFormData((p) => ({ ...p, medicalLicense: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Practice Location & Consultation Details */}
          <Card className="border-mist-200 bg-white shadow-xs rounded-2xl">
            <CardHeader className="p-5 border-b border-mist-100">
              <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                <MapPin className="h-4 w-4 text-teal-600" /> Clinic Address & Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-ink-soft">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    disabled={!editing}
                    className="text-xs"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="consultationType" className="text-xs font-semibold text-ink-soft">
                    Consultation Mode
                  </Label>
                  {editing ? (
                    <select
                      id="consultationType"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-ink focus-visible:ring-2 focus-visible:ring-[#0F766E]"
                      value={formData.consultationType}
                      onChange={(e) => setFormData((p) => ({ ...p, consultationType: e.target.value }))}
                    >
                      <option value="Both">Both (Online & In-Clinic)</option>
                      <option value="Online">Online Video Only</option>
                      <option value="In-Clinic">In-Clinic Only</option>
                    </select>
                  ) : (
                    <Input id="consultationType" disabled className="text-xs bg-mist-50" value={formData.consultationType} />
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="clinicAddress" className="text-xs font-semibold text-ink-soft">
                  Hospital / Clinic Address
                </Label>
                <Input
                  id="clinicAddress"
                  disabled={!editing}
                  className="text-xs"
                  placeholder="e.g. MediAssist Health Center, Suite 302, Medical City"
                  value={formData.clinicAddress}
                  onChange={(e) => setFormData((p) => ({ ...p, clinicAddress: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio" className="text-xs font-semibold text-ink-soft">
                  Professional Bio & Clinical Summary
                </Label>
                <textarea
                  id="bio"
                  rows={3}
                  disabled={!editing}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-ink focus-visible:ring-2 focus-visible:ring-[#0F766E] disabled:bg-mist-50"
                  placeholder="Brief summary of clinical background, clinical philosophy, and specialties..."
                  value={formData.bio}
                  onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PATIENT PROFILE: UNIFIED EDIT FORM OR STRUCTURED VIEW */}
      {!isDoctor && editing && (
        <Card className="border-mist-200 bg-white shadow-sm rounded-2xl overflow-hidden animate-rise">
          {/* Unified Edit Header */}
          <CardHeader className="p-6 bg-gradient-to-r from-teal-50/70 via-mist-50/40 to-white border-b border-mist-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                <Pencil className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-ink">Edit Health Profile & Vitals</CardTitle>
                <CardDescription className="text-xs text-ink-soft mt-0.5">
                  Update your demographics, physical measurements, lifestyle factors, and medical conditions in one unified section.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
                className="text-xs h-9 px-3.5 border-mist-300 hover:bg-mist-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-teal-600 text-white hover:bg-teal-700 font-semibold shadow-xs text-xs h-9 px-4 rounded-xl"
              >
                <Save className="h-4 w-4 mr-1.5" /> {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-8">
            {/* SUBSECTION 1: Demographics & Personal Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-mist-100">
                <User className="h-4 w-4 text-teal-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink">1. Personal Demographics & Contact</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name" className="text-xs font-semibold text-ink-soft">
                    Full Name *
                  </Label>
                  <Input
                    id="edit-name"
                    className="text-xs h-9"
                    placeholder="Your Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-email" className="text-xs font-semibold text-ink-soft">
                    Email Address
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    disabled
                    className="text-xs h-9 bg-mist-50 text-ink-soft cursor-not-allowed"
                    value={formData.email}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-phone" className="text-xs font-semibold text-ink-soft">
                    Phone Number
                  </Label>
                  <Input
                    id="edit-phone"
                    className="text-xs h-9"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-age" className="text-xs font-semibold text-ink-soft">
                    Age (Years)
                  </Label>
                  <Input
                    id="edit-age"
                    type="number"
                    min="0"
                    max="120"
                    className="text-xs h-9"
                    placeholder="e.g. 32"
                    value={formData.age || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, age: Number(e.target.value) }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-gender" className="text-xs font-semibold text-ink-soft">
                    Gender
                  </Label>
                  <select
                    id="edit-gender"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                    value={formData.gender}
                    onChange={(e) => setFormData((p) => ({ ...p, gender: e.target.value }))}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-blood" className="text-xs font-semibold text-ink-soft">
                    Blood Group
                  </Label>
                  <select
                    id="edit-blood"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData((p) => ({ ...p, bloodGroup: e.target.value }))}
                  >
                    <option value="">Select Blood Group</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SUBSECTION 2: Physical Body Measurements & Vitals */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 border-b border-mist-100">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-teal-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink">2. Physical Measurements & Body Vitals</h3>
                </div>
                <div className="inline-flex items-center gap-1 rounded-lg bg-mist-100 p-0.5 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setHeightUnit('cm')}
                    className={cn(
                      'px-2 py-1 text-[11px] font-semibold rounded-md transition-colors',
                      heightUnit === 'cm' ? 'bg-white text-teal-700 shadow-xs' : 'text-ink-soft hover:text-ink'
                    )}
                  >
                    Centimeters (cm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeightUnit('ft')}
                    className={cn(
                      'px-2 py-1 text-[11px] font-semibold rounded-md transition-colors',
                      heightUnit === 'ft' ? 'bg-white text-teal-700 shadow-xs' : 'text-ink-soft hover:text-ink'
                    )}
                  >
                    Feet & Inches (ft/in)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                {/* Height Input */}
                {heightUnit === 'cm' ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-height-cm" className="text-xs font-semibold text-ink-soft">
                      Height (cm)
                    </Label>
                    <div className="relative">
                      <Input
                        id="edit-height-cm"
                        type="number"
                        min="0"
                        max="260"
                        className="text-xs h-9 pr-10"
                        placeholder="e.g. 175"
                        value={formData.heightCm || ''}
                        onChange={(e) => handleHeightCmChange(Number(e.target.value))}
                      />
                      <span className="absolute right-3 top-2 text-xs text-ink-soft pointer-events-none">cm</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-ink-soft">
                      Height (Feet & Inches)
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          max="8"
                          className="text-xs h-9 pr-8"
                          placeholder="Feet"
                          value={formData.feet || ''}
                          onChange={(e) => handleFtInChange(Number(e.target.value), formData.inches)}
                        />
                        <span className="absolute right-2.5 top-2 text-xs text-ink-soft pointer-events-none">ft</span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          max="11"
                          className="text-xs h-9 pr-8"
                          placeholder="Inches"
                          value={formData.inches || ''}
                          onChange={(e) => handleFtInChange(formData.feet, Number(e.target.value))}
                        />
                        <span className="absolute right-2.5 top-2 text-xs text-ink-soft pointer-events-none">in</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Weight Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-weight-kg" className="text-xs font-semibold text-ink-soft">
                    Weight (kg)
                  </Label>
                  <div className="relative">
                    <Input
                      id="edit-weight-kg"
                      type="number"
                      min="0"
                      max="300"
                      step="0.1"
                      className="text-xs h-9 pr-10"
                      placeholder="e.g. 70"
                      value={formData.weightKg || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, weightKg: Number(e.target.value) }))}
                    />
                    <span className="absolute right-3 top-2 text-xs text-ink-soft pointer-events-none">kg</span>
                  </div>
                </div>

                {/* Live BMI Indicator */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-ink-soft">
                    Calculated BMI Indicator
                  </Label>
                  <div className="flex items-center justify-between h-9 px-3 rounded-lg bg-teal-50/50 border border-teal-100">
                    <span className="text-xs font-mono font-bold text-teal-900">
                      {calculatedBmi ? `${calculatedBmi} kg/m²` : '—'}
                    </span>
                    {calculatedBmi && getBmiCategory(calculatedBmi) && (
                      <Badge className={cn('text-[10px] px-2 py-0.5', getBmiCategory(calculatedBmi)?.color)}>
                        {getBmiCategory(calculatedBmi)?.label}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SUBSECTION 3: Lifestyle & Nutritional Habits */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-mist-100">
                <Salad className="h-4 w-4 text-teal-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink">3. Lifestyle & Nutritional Habits</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-smoking" className="text-xs font-semibold text-ink-soft flex items-center gap-1.5">
                    <Cigarette className="h-3.5 w-3.5 text-teal-600" /> Smoking Status
                  </Label>
                  <select
                    id="edit-smoking"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                    value={formData.smokingHabit}
                    onChange={(e) => setFormData((p) => ({ ...p, smokingHabit: e.target.value }))}
                  >
                    <option value="">Select Smoking Status</option>
                    {SMOKING_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-activity" className="text-xs font-semibold text-ink-soft flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-teal-600" /> Activity Level
                  </Label>
                  <select
                    id="edit-activity"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                    value={formData.activityLevel}
                    onChange={(e) => setFormData((p) => ({ ...p, activityLevel: e.target.value }))}
                  >
                    <option value="">Select Activity Level</option>
                    {ACTIVITY_OPTIONS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-diet" className="text-xs font-semibold text-ink-soft flex items-center gap-1.5">
                    <Salad className="h-3.5 w-3.5 text-teal-600" /> Diet Preference
                  </Label>
                  <select
                    id="edit-diet"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                    value={formData.dietaryPreference}
                    onChange={(e) => setFormData((p) => ({ ...p, dietaryPreference: e.target.value }))}
                  >
                    <option value="">Select Diet Preference</option>
                    {DIET_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SUBSECTION 4: Medical Alerts, Allergies & Chronic Conditions */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2.5 border-b border-mist-100">
                <ShieldAlert className="h-4 w-4 text-teal-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink">4. Medical Alerts, Allergies & Chronic Conditions</h3>
              </div>

              {/* Allergies */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-ink-soft flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600" /> Known Allergies & Drug Intolerances
                </Label>

                {/* Selected Allergies Badges */}
                <div className="flex flex-wrap gap-2 min-h-[38px] items-center p-3 rounded-xl bg-mist-50/70 border border-mist-200">
                  {formData.allergies && formData.allergies.length > 0 ? (
                    formData.allergies.map((allergy) => (
                      <Badge
                        key={allergy}
                        className="bg-rose-50 text-rose-700 border-rose-200 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                      >
                        <span>{allergy}</span>
                        <button
                          type="button"
                          onClick={() => removeAllergy(allergy)}
                          className="hover:text-rose-900 focus:outline-none"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-ink-soft italic">No allergies added yet. Click quick-tags below or add custom.</span>
                  )}
                </div>

                {/* Quick select chips & custom input */}
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] text-ink-soft font-medium">Quick-select common allergens or type custom:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALLERGY_CHIPS.map((a) => {
                      const active = formData.allergies.includes(a)
                      return (
                        <button
                          key={a}
                          type="button"
                          onClick={() => toggleAllergy(a)}
                          className={cn(
                            'rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors',
                            active
                              ? 'bg-rose-50 border-rose-300 text-rose-700 font-semibold'
                              : 'bg-white border-mist-200 text-ink-soft hover:bg-mist-50'
                          )}
                        >
                          {active ? `✓ ${a}` : `+ ${a}`}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex items-center gap-2 pt-1 max-w-sm">
                    <Input
                      placeholder="Add custom allergen (e.g. Latex)..."
                      value={customAllergyInput}
                      onChange={(e) => setCustomAllergyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCustomAllergy()
                        }
                      }}
                      className="text-xs h-8"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={addCustomAllergy}
                      className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 px-3 rounded-lg"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* Chronic Conditions */}
              <div className="space-y-3 border-t border-mist-100 pt-4">
                <Label className="text-xs font-semibold text-ink-soft flex items-center gap-1.5">
                  <HeartPulse className="h-3.5 w-3.5 text-teal-600" /> Existing Health Conditions & Chronic Illnesses
                </Label>

                {/* Selected Conditions Badges */}
                <div className="flex flex-wrap gap-2 min-h-[38px] items-center p-3 rounded-xl bg-mist-50/70 border border-mist-200">
                  {formData.existingConditions && formData.existingConditions.length > 0 ? (
                    formData.existingConditions.map((condition) => (
                      <Badge
                        key={condition}
                        className="bg-teal-50 text-teal-800 border-teal-200 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                      >
                        <span>{condition}</span>
                        <button
                          type="button"
                          onClick={() => removeCondition(condition)}
                          className="hover:text-teal-950 focus:outline-none"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-ink-soft italic">No chronic medical conditions recorded. Click quick-tags below or add custom.</span>
                  )}
                </div>

                {/* Quick select chips & custom input */}
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] text-ink-soft font-medium">Quick-select pre-existing conditions or type custom:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_CONDITIONS.map((c) => {
                      const active = formData.existingConditions.includes(c)
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCondition(c)}
                          className={cn(
                            'rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors',
                            active
                              ? 'bg-teal-50 border-teal-300 text-teal-800 font-semibold'
                              : 'bg-white border-mist-200 text-ink-soft hover:bg-mist-50'
                          )}
                        >
                          {active ? `✓ ${c}` : `+ ${c}`}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex items-center gap-2 pt-1 max-w-sm">
                    <Input
                      placeholder="Add other medical condition..."
                      value={customConditionInput}
                      onChange={(e) => setCustomConditionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCustomCondition()
                        }
                      }}
                      className="text-xs h-8"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={addCustomCondition}
                      className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 px-3 rounded-lg"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* UNIFIED FOOTER ACTIONS */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-mist-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
                className="text-xs h-9 px-4 border-mist-300 hover:bg-mist-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-teal-600 text-white hover:bg-teal-700 font-semibold shadow-xs text-xs h-9 px-5 rounded-xl"
              >
                <Save className="h-4 w-4 mr-1.5" /> {saving ? 'Saving Profile…' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PATIENT PROFILE: STRUCTURED VIEW CARDS */}
      {!isDoctor && !editing && (
        <div className="space-y-6">
          {/* Assigned Primary Doctor Card */}
          {user?.assignedDoctorId && (
            <Card className="border-mist-200 bg-white shadow-xs rounded-2xl">
              <CardHeader className="p-5 border-b border-mist-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-ink">Assigned Primary Care Doctor</CardTitle>
                    <CardDescription className="text-xs text-ink-soft">
                      Your designated healthcare specialist for clinical consultations and care plans
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const docId = user?.assignedDoctorId || (user as any)?.assigned_doctor_id
                      navigate(`/messages?doctorId=${encodeURIComponent(docId)}`)
                    }}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 shadow-xs"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Message Doctor</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const docId = user?.assignedDoctorId || (user as any)?.assigned_doctor_id
                      navigate(`/appointments?doctorId=${encodeURIComponent(docId)}`)
                    }}
                    className="border-mist-300 text-ink hover:bg-mist-50 text-xs h-8 px-3 rounded-lg"
                  >
                    Book Appointment
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="flex items-center gap-4 flex-wrap bg-teal-50/40 p-4 rounded-xl border border-teal-100">
                  <div>
                    <p className="text-xs font-semibold text-ink-soft uppercase tracking-wider">Primary Physician ID</p>
                    <p className="text-sm font-bold font-mono text-teal-800 mt-0.5">
                      {user?.assignedDoctorId || (user as any)?.assigned_doctor_id}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-teal-200 hidden sm:block" />
                  <div>
                    <p className="text-xs font-semibold text-ink-soft uppercase tracking-wider">Communication Status</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-medium text-emerald-700">Active Authorized Channel</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card 1: Personal & Physical Metrics */}
          <Card className="border-mist-200 bg-white shadow-xs rounded-2xl">
            <CardHeader className="p-5 border-b border-mist-100">
              <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                <User className="h-4 w-4 text-teal-600" /> Personal & Physical Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Full Name</p>
                  <p className="text-sm font-bold text-ink">{formData.name || 'Not provided'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Email</p>
                  <p className="text-sm text-ink">{formData.email}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Phone Number</p>
                  <p className="text-sm text-ink">{formData.phone || 'Not recorded'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Age</p>
                  <p className="text-sm text-ink">{formData.age ? `${formData.age} years` : 'Not recorded'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Gender</p>
                  <p className="text-sm text-ink">{formData.gender || 'Not specified'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Blood Type</p>
                  <p className="text-sm font-bold text-ink">{formData.bloodGroup || 'Not specified'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Height</p>
                  <p className="text-sm text-ink">
                    {formData.heightCm ? `${formData.heightCm} cm` : '—'}
                    {formData.heightCm > 0 && ` (${cmToFtIn(formData.heightCm).feet}ft ${cmToFtIn(formData.heightCm).inches}in)`}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Weight</p>
                  <p className="text-sm text-ink">{formData.weightKg ? `${formData.weightKg} kg` : '—'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Body Mass Index (BMI)</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm font-mono font-bold text-teal-800">
                      {calculatedBmi ? `${calculatedBmi} kg/m²` : '—'}
                    </p>
                    {calculatedBmi && getBmiCategory(calculatedBmi) && (
                      <Badge className={cn('text-[10px] px-2 py-0.5', getBmiCategory(calculatedBmi)?.color)}>
                        {getBmiCategory(calculatedBmi)?.label}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Lifestyle & Dietary Habits */}
          <Card className="border-mist-200 bg-white shadow-xs rounded-2xl">
            <CardHeader className="p-5 border-b border-mist-100">
              <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-600" /> Lifestyle & Dietary Habits
              </CardTitle>
              <CardDescription className="text-xs text-ink-soft">
                Daily lifestyle factors and nutritional preferences influencing risk profiling
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
                    <Cigarette className="h-3.5 w-3.5 text-teal-600" /> Smoking Habit
                  </p>
                  <p className="text-sm font-medium text-ink">{formData.smokingHabit || 'Not specified'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-teal-600" /> Physical Activity Level
                  </p>
                  <p className="text-sm font-medium text-ink">
                    {ACTIVITY_OPTIONS.find((a) => a.id === formData.activityLevel)?.label || formData.activityLevel || 'Not specified'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
                    <Salad className="h-3.5 w-3.5 text-teal-600" /> Dietary Preference
                  </p>
                  <p className="text-sm font-medium text-ink">{formData.dietaryPreference || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Medical History, Allergies & Chronic Conditions */}
          <Card className="border-mist-200 bg-white shadow-xs rounded-2xl">
            <CardHeader className="p-5 border-b border-mist-100">
              <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-teal-600" /> Medical History, Allergies & Chronic Conditions
              </CardTitle>
              <CardDescription className="text-xs text-ink-soft">
                Important medical alerts, drug & food allergies, and pre-existing clinical conditions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Allergies */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600" /> Known Allergies & Drug Intolerances
                </p>
                <div className="flex flex-wrap gap-2 min-h-[36px] items-center p-2.5 rounded-xl bg-mist-50/70 border border-mist-200">
                  {formData.allergies && formData.allergies.length > 0 ? (
                    formData.allergies.map((allergy) => (
                      <Badge
                        key={allergy}
                        className="bg-rose-50 text-rose-700 border-rose-200 text-xs px-2.5 py-1 rounded-lg"
                      >
                        {allergy}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-ink-soft italic">No known allergies recorded</span>
                  )}
                </div>
              </div>

              {/* Pre-existing Conditions */}
              <div className="space-y-2 border-t border-mist-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
                  <HeartPulse className="h-3.5 w-3.5 text-teal-600" /> Existing Health Conditions & Chronic Illnesses
                </p>
                <div className="flex flex-wrap gap-2 min-h-[36px] items-center p-2.5 rounded-xl bg-mist-50/70 border border-mist-200">
                  {formData.existingConditions && formData.existingConditions.length > 0 ? (
                    formData.existingConditions.map((condition) => (
                      <Badge
                        key={condition}
                        className="bg-teal-50 text-teal-800 border-teal-200 text-xs px-2.5 py-1 rounded-lg"
                      >
                        {condition}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-ink-soft italic">No chronic health conditions recorded</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
