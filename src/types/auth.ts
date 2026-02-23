import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      is_super_admin: boolean
    } & DefaultSession['user']
  }

  interface User {
    role: string
    is_super_admin: boolean
  }
}


