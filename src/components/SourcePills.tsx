import type { SourceTag } from '../types/domain'

interface SourcePillsProps {
  sources: SourceTag[]
}

export function SourcePills({ sources }: SourcePillsProps) {
  return (
    <div className="source-pills">
      {sources.map((source) => (
        <span className="source-pill" key={`${source.type}-${source.label}`}>
          {source.label}
        </span>
      ))}
    </div>
  )
}
