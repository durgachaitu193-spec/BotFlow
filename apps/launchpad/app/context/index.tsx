'use client'
import { useContext } from 'react'
import { useApp } from './AppContext'
import { UserDetailsContext } from './UserDetailContext'

const useApiContext = () => {
  return useApp()
}

const useUserDetailsContext = () => {
  return useContext(UserDetailsContext)
}

export { useApiContext, useUserDetailsContext }
