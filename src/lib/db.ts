import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Function to create serverless-optimized DATABASE_URL
function getServerlessOptimizedUrl(): string {
  const baseUrl = process.env.DATABASE_URL
  if (!baseUrl) {
    throw new Error('DATABASE_URL is not defined')
  }
  
  try {
    // Parse the URL to add serverless parameters
    const url = new URL(baseUrl)
    
    // Add Supabase PgBouncer parameters for serverless/Vercel
    url.searchParams.set('pgbouncer', 'true')
    url.searchParams.set('prepared', 'false')
    url.searchParams.set('sslmode', 'require')
    url.searchParams.set('connect_timeout', '10')
    
    return url.toString()
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error parsing DATABASE_URL:', error)
    }
    // Fallback to simple string concatenation if URL parsing fails
    const separator = baseUrl.includes('?') ? '&' : '?'
    return `${baseUrl}${separator}prepared=false&connection_limit=1`
  }
}

// Create Prisma client with serverless-optimized URL
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: getServerlessOptimizedUrl()
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['error'] : []
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
