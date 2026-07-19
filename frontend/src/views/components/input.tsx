// Shared component — text input, optionally with an above-field label.
import { InputHTMLAttributes } from 'react'
import './input.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export default function Input({ label, id, className, ...rest }: InputProps) {
  const classes = ['input', className ?? ''].filter(Boolean).join(' ')
  const input_element = <input id={id} className={classes} {...rest} />

  if (!label) return input_element

  return (
    <label className="input-field" htmlFor={id}>
      <span className="input-field__label">{label}</span>
      {input_element}
    </label>
  )
}
