// Text input. Pass `value` + `onChange(value)` for controlled use. Extra props (name, required,
// autoComplete, inputMode, min, max …) are forwarded to the <input>.
export function Field({ label, placeholder, type = 'text', icon, value, onChange, error, hint, className = '', ...rest }) {
  return (
    <label className={`field ${error ? 'field--error' : ''} ${className}`}>
      <span>{label}</span>
      <div className="field__control">
        {icon}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          aria-label={label}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange?.(event.target.value)}
          {...rest}
        />
      </div>
      {error ? <em className="field__error">{error}</em> : hint ? <em className="field__hint">{hint}</em> : null}
    </label>
  )
}

export function SelectField({ label, value, onChange, options, placeholder = 'Select…', error, hint, className = '', ...rest }) {
  return (
    <label className={`field ${error ? 'field--error' : ''} ${className}`}>
      <span>{label}</span>
      <div className="field__control">
        <select value={value} aria-label={label} onChange={(event) => onChange?.(event.target.value)} {...rest}>
          <option value="">{placeholder}</option>
          {options.map((option) => {
            const [val, text] = Array.isArray(option) ? option : [option, option]
            return (
              <option key={val} value={val}>
                {text}
              </option>
            )
          })}
        </select>
      </div>
      {error ? <em className="field__error">{error}</em> : hint ? <em className="field__hint">{hint}</em> : null}
    </label>
  )
}

export function TextAreaField({ label, value, onChange, placeholder, error, hint, className = '', ...rest }) {
  return (
    <label className={`field ${error ? 'field--error' : ''} ${className}`}>
      <span>{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        aria-label={label}
        onChange={(event) => onChange?.(event.target.value)}
        {...rest}
      />
      {error ? <em className="field__error">{error}</em> : hint ? <em className="field__hint">{hint}</em> : null}
    </label>
  )
}
