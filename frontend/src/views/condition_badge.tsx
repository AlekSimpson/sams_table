interface ConditionBadgeProps {
  condition: string
}

export default function ConditionBadge({ condition }: ConditionBadgeProps) {
  return (
    <span style={{ padding: '2px 6px', background: '#5a1a1a', borderRadius: 4, fontSize: 11 }}>
      {condition}
    </span>
  )
}
