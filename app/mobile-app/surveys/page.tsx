"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import {
  ClipboardList,
  ShieldCheck,
  Send,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  WifiOff,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  FileText,
  ArrowRight,
  X,
  Trophy,
  PartyPopper,
  Frown,
  Meh,
  Smile,
  Heart,
  Star,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Zap,
  Award,
  Crown,
  Flame,
  Circle,
  Check,
  PenLine,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

type SurveyOption = {
  optionId: number
  text: string
  value: number
  order: number
}

type SurveyQuestion = {
  questionId: number
  text: string
  type: "scale" | "single" | "text"
  required:  boolean
  order: number
  options: SurveyOption[]
}

type Survey = {
  surveyId:  number
  surveyCode: string
  surveyName:  string
  isAnonymous: boolean
  questions: SurveyQuestion[]
}

type GetResponse =
  | { success: true; surveys: Survey[] }
  | { success: false; message?:  string }

type SubmitPayload = {
  surveyId: number
  answers: {
    questionId: number
    optionId?:  number
    value?: number
    text?: string
  }[]
}

type SubmitResponse =
  | { success: true; message?: string }
  | { success: false; message?: string }

const surveyGradients = [
  { gradient: "from-blue-500 via-cyan-500 to-emerald-500", glow: "shadow-blue-500/30" },
  { gradient: "from-violet-500 via-purple-500 to-pink-500", glow: "shadow-violet-500/30" },
  { gradient: "from-amber-500 via-orange-500 to-rose-500", glow: "shadow-amber-500/30" },
  { gradient: "from-emerald-500 via-teal-500 to-cyan-500", glow: "shadow-emerald-500/30" },
]

// Scale için ikonlar ve renkler (5'li ölçek)
const scaleIcons5 = [
  { icon:  Frown, emoji: "😞", label: "Çok Kötü", gradient: "from-rose-500 to-red-600", glow: "shadow-rose-500/50", bg: "bg-rose-500" },
  { icon: Meh, emoji: "😕", label: "Kötü", gradient: "from-orange-500 to-amber-600", glow: "shadow-orange-500/50", bg: "bg-orange-500" },
  { icon: Smile, emoji: "😐", label: "Orta", gradient: "from-yellow-500 to-amber-500", glow: "shadow-yellow-500/50", bg: "bg-yellow-500" },
  { icon: ThumbsUp, emoji: "😊", label: "İyi", gradient: "from-lime-500 to-green-500", glow: "shadow-lime-500/50", bg: "bg-lime-500" },
  { icon: Heart, emoji: "😍", label: "Çok İyi", gradient: "from-emerald-500 to-cyan-500", glow: "shadow-emerald-500/50", bg: "bg-emerald-500" },
]

// Single seçim için renkler
const singleColors = [
  { gradient: "from-blue-500 to-cyan-500", glow: "shadow-blue-500/40", ring: "ring-blue-400" },
  { gradient: "from-violet-500 to-purple-500", glow: "shadow-violet-500/40", ring: "ring-violet-400" },
  { gradient: "from-emerald-500 to-teal-500", glow: "shadow-emerald-500/40", ring: "ring-emerald-400" },
  { gradient:  "from-amber-500 to-orange-500", glow: "shadow-amber-500/40", ring: "ring-amber-400" },
  { gradient: "from-pink-500 to-rose-500", glow: "shadow-pink-500/40", ring: "ring-pink-400" },
  { gradient: "from-indigo-500 to-blue-500", glow: "shadow-indigo-500/40", ring: "ring-indigo-400" },
]

export default function SurveyPage() {
  const { user } = useAuth()
  const [darkMode, setDarkMode] = useState(true)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, { optionId?:  number; value?: number; text?:  string }>>({})
  const [lockedSurveys, setLockedSurveys] = useState<Set<number>>(new Set())
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("darkMode")
    const isDark = stored === "true" || stored === null
    setDarkMode(isDark)
    if (isDark) document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")

    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const dbName = (user as any)?.dbName || "HOMINUM"
  const userId = (user as any)?.persid || (user as any)?.userId || ""
  const company = (user as any)?.firmaKodu || (user as any)?.company || ""
  const plant = (user as any)?.tesisKodu || (user as any)?.plant || ""
  const department = (user as any)?.departmanKodu || (user as any)?.department || ""

  const fetchSurveys = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000)
      const res = await fetch(`/api/mobil-user/survey/get? dbName=${encodeURIComponent(dbName)}`, {
        method: "POST",
        headers: { "x-db-name": dbName, "Content-Type": "application/json" },
        cache: "no-store",
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!res.ok) throw new Error((await res.text()) || `İstek başarısız: ${res.status}`)

      const json:  GetResponse = await res.json()
      if (! json.success) throw new Error(json.message || "Anketler alınamadı")

      const sorted = json.surveys
        .map((s) => ({ ...s, questions: [... s.questions]. sort((a, b) => a.order - b.order) }))
        .sort((a, b) => a.surveyId - b.surveyId)

      setSurveys(sorted)
    } catch (err:  any) {
      console.error("Survey fetch error", err)
      setError(err?. message || "Anketler getirilemedi")
    } finally {
      setLoading(false)
    }
  }, [dbName])

  useEffect(() => {
    fetchSurveys()
  }, [fetchSurveys])

  const currentQuestion = useMemo(() => {
    if (! activeSurvey || currentStep === 0) return null
    return activeSurvey.questions[currentStep - 1] || null
  }, [activeSurvey, currentStep])

  const isQuestionAnswered = (q: SurveyQuestion) => {
    const a = answers[q.questionId]
    if (!a) return false
    if (q.type === "text") return !!a.text?. trim()
    return a.optionId !== undefined || a.value !== undefined
  }

  const currentAnswered = currentQuestion ?  isQuestionAnswered(currentQuestion) : false

  const canProceed = useMemo(() => {
    if (!currentQuestion) return true
    if (currentQuestion.required) return currentAnswered
    return true
  }, [currentQuestion, currentAnswered])

  const totalQuestions = activeSurvey?.questions.length || 0
  const progress = totalQuestions > 0 ? (currentStep / (totalQuestions + 1)) * 100 : 0

  const handleSelectSurvey = (survey: Survey) => {
    const locked = lockedSurveys. has(survey.surveyId) && !survey.isAnonymous
    if (locked) return
    setActiveSurvey(survey)
    setCurrentStep(1)
    setAnswers({})
    setError(null)
    setSuccessMessage(null)
    setShowSuccess(false)
  }

  const handleBack = () => {
    if (currentStep === 1) {
      setActiveSurvey(null)
      setCurrentStep(0)
      setAnswers({})
    } else if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleNext = () => {
    if (! activeSurvey) return
    if (currentStep < totalQuestions) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const setAnswer = (questionId: number, partial: { optionId?: number; value?:  number; text?: string }) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...partial } }))
  }

  const handleSubmit = async () => {
    if (!activeSurvey) return
    setSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    const payload:  SubmitPayload = {
      surveyId: activeSurvey.surveyId,
      answers: activeSurvey.questions.map((q) => {
        const a = answers[q.questionId] || {}
        return {
          questionId: q.questionId,
          optionId: a. optionId,
          value:  a.value,
          text: q.type === "text" ? a.text || "" : undefined,
        }
      }),
    }

    const headers:  Record<string, string> = {
      "Content-Type": "application/json",
      "x-db-name": dbName,
    }
    if (userId) headers["x-user-id"] = String(userId)
    if (company) headers["x-company"] = String(company)
    if (plant) headers["x-plant"] = String(plant)
    if (department) headers["x-department"] = String(department)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000)
      const res = await fetch(`/api/mobil-user/survey/submit?dbName=${encodeURIComponent(dbName)}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: controller.signal,
      })
      clearTimeout(timeout)

      const data:  SubmitResponse = await res. json()
      if (!res.ok || !data.success) {
        if (res.status === 409) {
          setLockedSurveys((prev) => new Set(prev).add(activeSurvey. surveyId))
          throw new Error("Bu anketi daha önce doldurdun!")
        }
        throw new Error(data.message || `Gönderim başarısız (${res.status})`)
      }

      setSuccessMessage(data.message || "Anket başarıyla gönderildi!")
      if (! activeSurvey.isAnonymous) {
        setLockedSurveys((prev) => new Set(prev).add(activeSurvey.surveyId))
      }
      setShowSuccess(true)
    } catch (err: any) {
      console.error("Survey submit error", err)
      setError(err?.name === "AbortError" ? "Zaman aşımı, tekrar dene." : err?.message || "Gönderim başarısız.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleFinish = () => {
    setActiveSurvey(null)
    setCurrentStep(0)
    setAnswers({})
    setShowSuccess(false)
    setSuccessMessage(null)
  }

  // ========================
  // RENDER:  SUCCESS SCREEN
  // ========================
  if (showSuccess && activeSurvey) {
    return (
      <div className={`min-h-screen w-full flex flex-col items-center justify-center px-6 pb-40 ${
        darkMode ? "bg-gradient-to-b from-slate-950 via-emerald-950/30 to-slate-950" : "bg-gradient-to-b from-emerald-50 via-white to-emerald-50"
      }`}>
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="h-28 w-28 rounded-3xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40 mx-auto animate-pulse">
              <PartyPopper className="h-14 w-14 text-white" />
            </div>
            <div className="absolute -top-3 -right-3 h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg animate-bounce">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -bottom-2 -left-2 h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
              <Star className="h-4 w-4 text-white" />
            </div>
          </div>
          <h1 className={`text-3xl font-black mb-3 ${darkMode ? "text-white" : "text-slate-900"}`}>
            Tebrikler!  🎉
          </h1>
          <p className={`text-base mb-8 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
            {activeSurvey.surveyName} anketini başarıyla tamamladın. 
          </p>
          <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl mb-8 ${
            darkMode ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
          }`}>
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-bold">Yanıtların kaydedildi</span>
          </div>
          <button
            onClick={handleFinish}
            className="w-full max-w-xs py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-lg shadow-2xl shadow-emerald-500/40 active:scale-95 transition-all"
          >
            Anketlere Dön
          </button>
        </div>
      </div>
    )
  }

  // ========================
  // RENDER: QUESTION SCREEN
  // ========================
  if (activeSurvey && currentStep > 0 && currentQuestion) {
    const isLastQuestion = currentStep === totalQuestions
    const optionCount = currentQuestion.options.length

    return (
      <div className={`min-h-screen w-full flex flex-col ${
        darkMode ? "bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950" :  "bg-gradient-to-b from-slate-100 via-blue-50 to-slate-100"
      }`}>
        {/* Header */}
        <div className="px-5 pt-2 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className={`p-2. 5 rounded-xl transition-all active:scale-95 ${
                darkMode ? "bg-white/10 border border-white/10 text-white" : "bg-white border border-slate-200 text-slate-700 shadow-sm"
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-xs truncate ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                {activeSurvey.surveyName}
              </p>
              <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                Soru {currentStep} / {totalQuestions}
              </p>
            </div>
            <button
              onClick={handleFinish}
              className={`p-2.5 rounded-xl transition-all active: scale-95 ${
                darkMode ? "bg-white/10 border border-white/10 text-white" : "bg-white border border-slate-200 text-slate-700 shadow-sm"
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className={`h-2.5 rounded-full overflow-hidden ${darkMode ? "bg-white/10" : "bg-slate-200"}`}>
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 px-5 py-4 flex flex-col overflow-y-auto">
          {/* Question Badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${
              darkMode ? "bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30" : "bg-violet-100 border border-violet-200"
            }`}>
              <Sparkles className={`h-4 w-4 ${darkMode ? "text-violet-400" : "text-violet-600"}`} />
              <span className={`text-xs font-bold uppercase ${darkMode ? "text-violet-300" : "text-violet-700"}`}>
                {currentQuestion.type === "scale" ? "Değerlendirme" : currentQuestion.type === "single" ? "Tek Seçim" : "Açık Uçlu"}
              </span>
            </div>
            {currentQuestion.required && (
              <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30">
                ZORUNLU
              </span>
            )}
          </div>

          {/* Question Text */}
          <h2 className={`text-xl font-black leading-snug mb-8 ${darkMode ? "text-white" :  "text-slate-900"}`}>
            {currentQuestion.text}
          </h2>

          {/* Answer Options */}
          <div className="flex-1">
            {/* SCALE TYPE - Emoji/Icon Based */}
            {currentQuestion. type === "scale" && (
              <div className="space-y-4">
                {/* 5'li ölçek için özel görünüm */}
                {optionCount === 5 ?  (
                  <div className="grid grid-cols-5 gap-2">
                    {currentQuestion.options.sort((a, b) => a.order - b.order).map((o, idx) => {
                      const selected = answers[currentQuestion.questionId]?.value === o.value
                      const style = scaleIcons5[idx] || scaleIcons5[2]
                      return (
                        <button
                          key={o.optionId}
                          onClick={() => setAnswer(currentQuestion.questionId, { value: o.value, optionId: o.optionId })}
                          className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 ${
                            selected
                              ? `bg-gradient-to-br ${style. gradient} shadow-xl ${style.glow} scale-110 ring-2 ring-white/50`
                              : darkMode
                                ? "bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105"
                                : "bg-white border border-slate-200 hover: border-slate-300 hover:scale-105 shadow-sm"
                          }`}
                        >
                          <div className={`text-3xl transition-transform ${selected ? "scale-110" : ""}`}>
                            {style.emoji}
                          </div>
                          <span className={`text-[10px] font-bold text-center leading-tight ${
                            selected ?  "text-white" : darkMode ? "text-slate-400" : "text-slate-600"
                          }`}>
                            {o.value}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  // Diğer ölçekler için liste görünümü
                  <div className="space-y-3">
                    {currentQuestion. options.sort((a, b) => a.order - b.order).map((o, idx) => {
                      const selected = answers[currentQuestion.questionId]?.value === o.value
                      const style = scaleIcons5[Math.min(idx, scaleIcons5.length - 1)]
                      return (
                        <button
                          key={o.optionId}
                          onClick={() => setAnswer(currentQuestion.questionId, { value: o.value, optionId: o.optionId })}
                          className={`w-full p-4 rounded-2xl text-left transition-all duration-300 active:scale-[0.98] ${
                            selected
                              ? `bg-gradient-to-r ${style.gradient} text-white shadow-xl ${style. glow}`
                              : darkMode
                                ? "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                                : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300 shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl ${
                              selected ? "bg-white/20" : darkMode ? "bg-white/10" : "bg-slate-100"
                            }`}>
                              {style.emoji}
                            </div>
                            <div className="flex-1">
                              <span className="font-bold">{o.text}</span>
                            </div>
                            {selected && <CheckCircle className="h-6 w-6" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Scale göstergesi */}
                <div className={`mt-6 flex items-center justify-between text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                  <span className="flex items-center gap-1">
                    <ThumbsDown className="h-3 w-3" /> En Düşük
                  </span>
                  <span className="flex items-center gap-1">
                    En Yüksek <ThumbsUp className="h-3 w-3" />
                  </span>
                </div>
              </div>
            )}

            {/* SINGLE TYPE - Colorful Cards */}
            {currentQuestion. type === "single" && (
              <div className="space-y-3">
                {currentQuestion.options.sort((a, b) => a.order - b.order).map((o, idx) => {
                  const selected = answers[currentQuestion.questionId]?.optionId === o.optionId
                  const style = singleColors[idx % singleColors.length]
                  return (
                    <button
                      key={o.optionId}
                      onClick={() => setAnswer(currentQuestion.questionId, { optionId: o.optionId, value: o.value })}
                      className={`w-full p-4 rounded-2xl text-left transition-all duration-300 active:scale-[0.98] ${
                        selected
                          ? `bg-gradient-to-r ${style.gradient} text-white shadow-xl ${style.glow} ring-2 ${style.ring}`
                          : darkMode
                            ? "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                            : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300 shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                          selected
                            ? "bg-white/20"
                            : `bg-gradient-to-br ${style.gradient} shadow-lg`
                        }`}>
                          {selected ?  (
                            <Check className="h-5 w-5 text-white" />
                          ) : (
                            <Circle className={`h-5 w-5 text-white`} />
                          )}
                        </div>
                        <span className="font-semibold flex-1">{o.text}</span>
                        {selected && (
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* TEXT TYPE - Beautiful Editor */}
            {currentQuestion. type === "text" && (
              <div className={`rounded-2xl overflow-hidden ${
                darkMode ? "bg-white/5 border border-white/10" : "bg-white border border-slate-200 shadow-sm"
              }`}>
                <div className={`px-4 py-3 flex items-center gap-2 border-b ${
                  darkMode ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50"
                }`}>
                  <PenLine className={`h-4 w-4 ${darkMode ? "text-cyan-400" : "text-cyan-600"}`} />
                  <span className={`text-xs font-semibold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Düşüncelerini paylaş
                  </span>
                  {answers[currentQuestion.questionId]?.text && (
                    <span className={`ml-auto text-xs ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                      {answers[currentQuestion. questionId]?.text?. length} karakter
                    </span>
                  )}
                </div>
                <textarea
                  value={answers[currentQuestion.questionId]?.text || ""}
                  onChange={(e) => setAnswer(currentQuestion.questionId, { text: e.target.value })}
                  rows={6}
                  placeholder="Buraya yazabilirsin..."
                  className={`w-full p-4 text-base resize-none transition-all focus:outline-none ${
                    darkMode
                      ? "bg-transparent text-white placeholder: text-slate-600"
                      : "bg-transparent text-slate-900 placeholder: text-slate-400"
                  }`}
                />
                <div className={`px-4 py-3 flex items-center justify-between border-t ${
                  darkMode ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50"
                }`}>
                  <div className="flex items-center gap-2">
                    <Sparkles className={`h-4 w-4 ${darkMode ? "text-amber-400" : "text-amber-500"}`} />
                    <span className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                      Fikirlerini değerlendireceğiz
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 p-4">
              <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
              <p className="text-sm text-rose-200">{error}</p>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className={`px-5 py-4 pb-28 border-t ${darkMode ? "border-white/10 bg-slate-950/80" : "border-slate-200 bg-white/80"} backdrop-blur-xl`}>
          <div className="flex gap-3">
            {isLastQuestion ?  (
              <button
                disabled={submitting || ! canProceed}
                onClick={handleSubmit}
                className={`flex-1 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                  submitting || !canProceed
                    ? darkMode
                      ? "bg-white/10 text-slate-500 cursor-not-allowed"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 text-white shadow-xl shadow-emerald-500/30 active:scale-[0.98]"
                }`}
              >
                {submitting ?  (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Anketi Gönder
                  </>
                )}
              </button>
            ) : (
              <button
                disabled={! canProceed}
                onClick={handleNext}
                className={`flex-1 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                  !canProceed
                    ? darkMode
                      ? "bg-white/10 text-slate-500 cursor-not-allowed"
                      :  "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 text-white shadow-xl shadow-cyan-500/30 active:scale-[0.98]"
                }`}
              >
                Devam Et
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
          {! canProceed && currentQuestion?. required && (
            <p className={`text-center text-xs mt-3 flex items-center justify-center gap-1 ${darkMode ? "text-amber-400" : "text-amber-600"}`}>
              <AlertCircle className="h-3.5 w-3.5" />
              Bu soru zorunlu, lütfen bir seçim yap
            </p>
          )}
        </div>
      </div>
    )
  }

  // ========================
  // RENDER:  SURVEY LIST
  // ========================
  return (
    <div className={`min-h-screen w-full overflow-x-hidden transition-all duration-500 ${
      darkMode ? "bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950" :  "bg-gradient-to-b from-slate-100 via-blue-50 to-slate-100"
    } pb-40`}>

      {/* Stats Card */}
      <div className="px-5 pt-2 pb-4">
        <div className={`rounded-2xl p-4 ${
          darkMode ? "bg-white/5 border border-white/10" : "bg-white border border-slate-200 shadow-sm"
        }`}>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                {surveys.length}
              </div>
              <div className={`text-[10px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Aktif Anket</div>
            </div>
            <div className={`text-center border-x ${darkMode ? "border-white/10" : "border-slate-200"}`}>
              <div className="text-2xl font-bold text-emerald-400">
                {surveys.filter((s) => s.isAnonymous).length}
              </div>
              <div className={`text-[10px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Anonim</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">
                {lockedSurveys.size}
              </div>
              <div className={`text-[10px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Tamamlanan</div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="px-5 pb-4">
        <div className={`rounded-2xl p-4 flex items-start gap-3 ${
          darkMode ? "bg-cyan-500/10 border border-cyan-500/20" : "bg-cyan-50 border border-cyan-200"
        }`}>
          <div className={`p-2 rounded-xl flex-shrink-0 ${darkMode ? "bg-cyan-500/20" : "bg-cyan-100"}`}>
            <ShieldCheck className={`h-5 w-5 ${darkMode ? "text-cyan-400" : "text-cyan-600"}`} />
          </div>
          <div>
            <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>Gizlilik</p>
            <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              Anonim anketlerde kimlik bilgilerin paylaşılmaz.  Kimlikli anketleri yalnızca bir kez doldurabilirsin.
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-5 pb-3">
          <div className="flex items-center gap-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 p-4">
            <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
            <p className="text-sm text-rose-200">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="px-5 space-y-3">
          {[1, 2, 3]. map((i) => (
            <div key={i} className={`h-32 rounded-2xl animate-pulse ${darkMode ? "bg-white/5" : "bg-slate-200"}`} />
          ))}
        </div>
      )}

      {/* Survey List */}
      {! loading && (
        <div className="px-5 space-y-3">
          {surveys.length === 0 ? (
            <div className={`rounded-2xl p-8 text-center ${
              darkMode ? "bg-white/5 border border-white/10" : "bg-white border border-slate-200"
            }`}>
              <ClipboardList className={`h-12 w-12 mx-auto mb-3 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
              <p className={`font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>Aktif anket bulunamadı</p>
              <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                Yeni anketler eklendiğinde burada görünecek. 
              </p>
            </div>
          ) : (
            surveys.map((survey, idx) => {
              const locked = lockedSurveys. has(survey.surveyId) && !survey.isAnonymous
              const style = surveyGradients[idx % surveyGradients.length]

              return (
                <button
                  key={survey.surveyId}
                  onClick={() => handleSelectSurvey(survey)}
                  disabled={locked}
                  className={`w-full text-left rounded-2xl overflow-hidden transition-all duration-300 ${
                    locked ?  "opacity-60" : "hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  <div className={`p-[1px] rounded-2xl bg-gradient-to-r ${style.gradient}`}>
                    <div className={`rounded-2xl p-4 ${darkMode ? "bg-slate-950/90" : "bg-white/95"}`}>
                      <div className="flex items-start gap-4">
                        <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg ${style.glow}`}>
                          <MessageCircle className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {survey.isAnonymous ?  (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                darkMode ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100 text-emerald-700"
                              }`}>
                                <Unlock className="h-3 w-3" /> ANONİM
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                darkMode ? "bg-amber-500/20 text-amber-300" : "bg-amber-100 text-amber-700"
                              }`}>
                                <ShieldCheck className="h-3 w-3" /> KİMLİKLİ
                              </span>
                            )}
                            {locked && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                darkMode ? "bg-rose-500/20 text-rose-300" : "bg-rose-100 text-rose-700"
                              }`}>
                                <Lock className="h-3 w-3" /> TAMAMLANDI
                              </span>
                            )}
                          </div>
                          <h3 className={`font-bold leading-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                            {survey.surveyName}
                          </h3>
                          <p className={`text-xs mt-1 ${darkMode ?  "text-slate-400" :  "text-slate-500"}`}>
                            {survey.surveyCode}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className={`flex items-center gap-1 text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                            <FileText className="h-4 w-4" />
                            {survey.questions.length}
                          </div>
                          {! locked && (
                            <ChevronRight className={`h-5 w-5 ${darkMode ? "text-slate-400" : "text-slate-400"}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}

      {/* Offline Badge */}
      {!isOnline && (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-amber-500/90 text-white text-xs font-semibold shadow-lg">
            <WifiOff className="h-4 w-4" />
            Çevrimdışı
          </div>
        </div>
      )}
    </div>
  )
}