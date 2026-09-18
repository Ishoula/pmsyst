import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { router } from 'expo-router'

const TOKEN_KEY = 'auth_token'

const AuthContext = createContext(null)

let setTokenState = null

async function setTokenInStorage(token) {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return
    if (!token) {
      window.localStorage.removeItem(TOKEN_KEY)
      return
    }
    window.localStorage.setItem(TOKEN_KEY, token)
    return
  }

  if (!token) {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    return
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

async function getTokenFromStorage() {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(TOKEN_KEY)
  }

  return SecureStore.getItemAsync(TOKEN_KEY)
}

function getApiBaseUrl() {
  return process.env.EXPO_PUBLIC_API_URL || 'http://10.11.74.62:9000'
}

async function requestJson(path, options = {}) {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${path}`

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const text = await res.text()
  const maybeJson = text ? (() => {
    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  })() : null

  if (!res.ok) {
    const message =
      (maybeJson && (maybeJson.message || maybeJson.error)) ||
      text ||
      `Request failed (${res.status})`
    const err = new Error(message)
    err.status = res.status
    err.body = maybeJson
    throw err
  }

  return maybeJson
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [initializing, setInitializing] = useState(true)

  setTokenState = setToken

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const saved = await getTokenFromStorage()
        if (mounted) setToken(saved)
      } finally {
        if (mounted) setInitializing(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const signIn = async ({ email, password }) => {
    const data = await requestJson('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (!data?.token) {
      throw new Error('No token returned from server')
    }

    await setTokenInStorage(data.token)
    setToken(data.token)
    return data
  }

  const signUp = async ({ username, email, password }) => {
    // Backend returns a string message on success
    await requestJson('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    })
  }

  const signOut = async () => {
    await setTokenInStorage(null)
    setToken(null)
  }

  const value = useMemo(
    () => ({
      token,
      initializing,
      isSignedIn: !!token,
      signIn,
      signUp,
      signOut,
      apiBaseUrl: getApiBaseUrl(),
    }),
    [token, initializing]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export async function authFetch(path, options = {}) {
  const token = await getTokenFromStorage()

  try {
    return await requestJson(path, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch (err) {
    const status = err?.status
    const msg = String(err?.message || '').toLowerCase()

    const isAuthError =
      status === 401 ||
      status === 403 ||
      (status === 400 && (msg.includes('invalid token') || msg.includes('access denied')))

    if (isAuthError) {
      await setTokenInStorage(null)
      if (typeof setTokenState === 'function') setTokenState(null)
      router.replace('/(auth)/login')
    }

    throw err
  }
}
