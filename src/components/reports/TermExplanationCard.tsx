import { BookOpenText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { TermExplanation } from '@/types'

export function TermExplanationCard({ term, meaning }: TermExplanation) {
  return (
    <Card className="animate-rise border-mist-200 bg-white transition-all duration-200 hover:border-teal-300 hover:shadow-xs">
      <CardContent className="flex items-start gap-3.5 p-4">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <BookOpenText className="h-4.5 w-4.5" />
        </span>
        <div className="space-y-1 min-w-0">
          <p className="font-display text-sm font-semibold text-ink truncate">{term}</p>
          <p className="text-xs leading-relaxed text-ink-soft">{meaning}</p>
        </div>
      </CardContent>
    </Card>
  )
}

