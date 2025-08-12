import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      console.log('Getting initial session...')
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Initial session:', session)
      if (session?.user) {
        const userData = {
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          id: session.user.id
        }
        console.log('Setting user:', userData)
        setUser(userData)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session)
        if (event === 'SIGNED_IN' && session?.user) {
          const userData = {
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
            id: session.user.id
          }
          console.log('User signed in:', userData)
          setUser(userData)
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    user,
    loading,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
