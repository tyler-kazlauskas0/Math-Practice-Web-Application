import { useContext } from 'react'
import {
  MistakePatternsContext,
  type MistakePatternsContextValue,
} from '../context/mistakePatternsContext'

/** Returns the saved mistake patterns. Must be used inside `MistakePatternsProvider`. */
export function useMistakePatterns(): MistakePatternsContextValue {
  const value = useContext(MistakePatternsContext)
  if (!value) {
    throw new Error('useMistakePatterns must be used inside MistakePatternsProvider')
  }
  return value
}
