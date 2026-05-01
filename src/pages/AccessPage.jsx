import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CircleEllipsis, Shield } from 'lucide-react'
import { useAuth } from '../state/useAuth'

const initialLogin = { username: '', password: '' }
const initialRegister = {
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  document_number: '',
  password: '',
}

function validateLogin(values) {
  const errors = {}

  if (!values.username.trim()) {
    errors.username = 'Ingresa tu usuario o correo.'
  } else if (values.username.trim().length < 3) {
    errors.username = 'Debe tener al menos 3 caracteres.'
  }

  if (!values.password) {
    errors.password = 'Ingresa tu contrasena.'
  } else if (values.password.length < 8) {
    errors.password = 'Debe tener al menos 8 caracteres.'
  }

  return errors
}

function validateRegister(values) {
  const errors = {}
  const usernamePattern = /^[a-zA-Z0-9._-]+$/
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const digitsOnly = /^\d+$/

  if (!values.username.trim()) {
    errors.username = 'Ingresa un usuario.'
  } else if (values.username.trim().length < 3) {
    errors.username = 'Debe tener al menos 3 caracteres.'
  } else if (!usernamePattern.test(values.username.trim())) {
    errors.username = 'Usa solo letras, numeros, puntos, guiones o guion bajo.'
  }

  if (!values.first_name.trim()) {
    errors.first_name = 'Ingresa tus nombres.'
  } else if (values.first_name.trim().length < 2) {
    errors.first_name = 'Debe tener al menos 2 caracteres.'
  }

  if (!values.last_name.trim()) {
    errors.last_name = 'Ingresa tus apellidos.'
  } else if (values.last_name.trim().length < 2) {
    errors.last_name = 'Debe tener al menos 2 caracteres.'
  }

  if (!values.email.trim()) {
    errors.email = 'Ingresa tu correo.'
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = 'Ingresa un correo valido.'
  }

  if (!values.phone.trim()) {
    errors.phone = 'Ingresa tu telefono.'
  } else if (!digitsOnly.test(values.phone.trim())) {
    errors.phone = 'Usa solo numeros.'
  } else if (values.phone.trim().length < 7) {
    errors.phone = 'Debe tener al menos 7 digitos.'
  }

  if (!values.document_number.trim()) {
    errors.document_number = 'Ingresa tu documento.'
  } else if (!digitsOnly.test(values.document_number.trim())) {
    errors.document_number = 'Usa solo numeros.'
  } else if (values.document_number.trim().length < 5) {
    errors.document_number = 'Debe tener al menos 5 digitos.'
  }

  if (!values.password) {
    errors.password = 'Ingresa una contrasena.'
  } else if (values.password.length < 8) {
    errors.password = 'Debe tener al menos 8 caracteres.'
  } else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
    errors.password = 'Incluye al menos una letra y un numero.'
  }

  return errors
}

export function AccessPage() {
  const navigate = useNavigate()
  const { login, register, enterDemo } = useAuth()
  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState(initialLogin)
  const [registerForm, setRegisterForm] = useState(initialRegister)
  const [loginErrors, setLoginErrors] = useState({})
  const [registerErrors, setRegisterErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const updateLoginField = (field, value) => {
    setLoginForm((current) => ({ ...current, [field]: value }))
    setLoginErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const updateRegisterField = (field, value) => {
    setRegisterForm((current) => ({ ...current, [field]: value }))
    setRegisterErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setError('')
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    const nextErrors = validateLogin(loginForm)
    setLoginErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setError('')
      return
    }

    setLoading(true)
    setError('')

    try {
      const nextRoute = await login({
        username: loginForm.username.trim(),
        password: loginForm.password,
      })
      navigate(nextRoute)
    } catch (issue) {
      setError(issue.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    const nextErrors = validateRegister(registerForm)
    setRegisterErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setError('')
      return
    }

    setLoading(true)
    setError('')

    try {
      const nextRoute = await register({
        ...registerForm,
        username: registerForm.username.trim(),
        first_name: registerForm.first_name.trim(),
        last_name: registerForm.last_name.trim(),
        email: registerForm.email.trim(),
        phone: registerForm.phone.trim(),
        document_number: registerForm.document_number.trim(),
      })
      navigate(nextRoute)
    } catch (issue) {
      setError(issue.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="access-page">
      <motion.section
        className="auth-stage"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
      >
        <aside className="auth-art-panel">
          <div className="auth-art-panel__brand">
            <img src="/checkar-logo-clean.png" alt="Checkar CDA" className="auth-logo auth-logo--panel" />
          </div>
          <div className="auth-art-panel__glow" />
          <div className="auth-art-panel__copy">
            <p>Centro de Diagnostico Automotor</p>
            <h1>Seguridad vial, cumplimiento y confianza en cada revision.</h1>
            <div className="auth-art-panel__tags">
              <span><Shield size={14} /> Revision certificada</span>
              <span><CircleEllipsis size={14} /> Emisiones bajo control</span>
            </div>
          </div>
        </aside>

        <section className="auth-card">
          <div className="auth-card__intro">
            <img src="/checkar-logo-clean.png" alt="Checkar CDA" className="auth-logo auth-logo--form" />
            <h2>{mode === 'login' ? 'Inicia sesion' : 'Crea tu cuenta'}</h2>
            <p>
              {mode === 'login'
                ? 'Gestiona tu revision tecnico-mecanica, consulta resultados y descarga certificados.'
                : 'Activa tu acceso para agendar revisiones, registrar vehiculos y recibir tus documentos.'}
            </p>
          </div>

          <div className="switcher switcher--minimal">
            <button className={mode === 'login' ? 'is-active' : ''} type="button" onClick={() => changeMode('login')}>
              Ingresar
            </button>
            <button className={mode === 'register' ? 'is-active' : ''} type="button" onClick={() => changeMode('register')}>
              Registro
            </button>
          </div>

          {error ? <div className="form-alert">{error}</div> : null}

          {mode === 'login' ? (
            <form className="auth-form auth-form--compact" noValidate onSubmit={handleLogin}>
              <label>
                Usuario o correo
                <input
                  autoComplete="username"
                  aria-invalid={Boolean(loginErrors.username)}
                  className={loginErrors.username ? 'input-error' : ''}
                  value={loginForm.username}
                  onChange={(event) => updateLoginField('username', event.target.value)}
                  placeholder="cliente.checkar"
                />
                {loginErrors.username ? <span className="field-error">{loginErrors.username}</span> : null}
              </label>
              <label>
                Contrasena
                <input
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(loginErrors.password)}
                  className={loginErrors.password ? 'input-error' : ''}
                  value={loginForm.password}
                  onChange={(event) => updateLoginField('password', event.target.value)}
                  placeholder="************"
                />
                {loginErrors.password ? <span className="field-error">{loginErrors.password}</span> : null}
              </label>
              <button className="primary-action primary-action--auth" disabled={loading} type="submit">
                {loading ? 'Ingresando...' : 'Continuar'}
              </button>
            </form>
          ) : (
            <form className="auth-form auth-form--grid auth-form--register" noValidate onSubmit={handleRegister}>
              <label>
                Usuario
                <input
                  autoComplete="username"
                  aria-invalid={Boolean(registerErrors.username)}
                  className={registerErrors.username ? 'input-error' : ''}
                  value={registerForm.username}
                  onChange={(event) => updateRegisterField('username', event.target.value)}
                />
                {registerErrors.username ? <span className="field-error">{registerErrors.username}</span> : null}
              </label>
              <label>
                Nombres
                <input
                  autoComplete="given-name"
                  aria-invalid={Boolean(registerErrors.first_name)}
                  className={registerErrors.first_name ? 'input-error' : ''}
                  value={registerForm.first_name}
                  onChange={(event) => updateRegisterField('first_name', event.target.value)}
                />
                {registerErrors.first_name ? <span className="field-error">{registerErrors.first_name}</span> : null}
              </label>
              <label>
                Apellidos
                <input
                  autoComplete="family-name"
                  aria-invalid={Boolean(registerErrors.last_name)}
                  className={registerErrors.last_name ? 'input-error' : ''}
                  value={registerForm.last_name}
                  onChange={(event) => updateRegisterField('last_name', event.target.value)}
                />
                {registerErrors.last_name ? <span className="field-error">{registerErrors.last_name}</span> : null}
              </label>
              <label>
                Email
                <input
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(registerErrors.email)}
                  className={registerErrors.email ? 'input-error' : ''}
                  value={registerForm.email}
                  onChange={(event) => updateRegisterField('email', event.target.value)}
                />
                {registerErrors.email ? <span className="field-error">{registerErrors.email}</span> : null}
              </label>
              <label>
                Telefono
                <input
                  autoComplete="tel"
                  inputMode="numeric"
                  aria-invalid={Boolean(registerErrors.phone)}
                  className={registerErrors.phone ? 'input-error' : ''}
                  value={registerForm.phone}
                  onChange={(event) => updateRegisterField('phone', event.target.value)}
                />
                {registerErrors.phone ? <span className="field-error">{registerErrors.phone}</span> : null}
              </label>
              <label>
                Documento
                <input
                  inputMode="numeric"
                  aria-invalid={Boolean(registerErrors.document_number)}
                  className={registerErrors.document_number ? 'input-error' : ''}
                  value={registerForm.document_number}
                  onChange={(event) => updateRegisterField('document_number', event.target.value)}
                />
                {registerErrors.document_number ? <span className="field-error">{registerErrors.document_number}</span> : null}
              </label>
              <label className="field-span-2">
                Contrasena
                <input
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(registerErrors.password)}
                  className={registerErrors.password ? 'input-error' : ''}
                  value={registerForm.password}
                  onChange={(event) => updateRegisterField('password', event.target.value)}
                />
                {registerErrors.password ? <span className="field-error">{registerErrors.password}</span> : null}
              </label>
              <button className="primary-action primary-action--auth field-span-2" disabled={loading} type="submit">
                {loading ? 'Creando cuenta...' : 'Crear acceso'}
              </button>
            </form>
          )}

          <div className="auth-divider">
            <span>o explora los flujos del sistema</span>
          </div>

          <div className="demo-strip demo-strip--auth">
            <div className="demo-strip__actions">
              <button type="button" onClick={() => navigate(enterDemo('customer'))}>Cliente</button>
              <button type="button" onClick={() => navigate(enterDemo('operator'))}>Operacion</button>
              <button type="button" onClick={() => navigate(enterDemo('admin'))}>Admin</button>
            </div>
          </div>

          <p className="auth-footer-note">
            {mode === 'login' ? 'Aun no tienes acceso a tu historial y certificados?' : 'Ya tienes acceso a Checkar?'}{' '}
            <button className="auth-footer-link" type="button" onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Registrate aqui' : 'Inicia sesion'}
            </button>
          </p>
        </section>
      </motion.section>
    </div>
  )
}
