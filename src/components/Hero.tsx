import { ArrowRight, Play, Sparkles, Network } from "lucide-react"
import { NeuralButton } from "./ui/neural-button"
import Link from 'next/link'
import Image from "next/image"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Neural Background */}
      <div className="absolute inset-0 neural-bg">
        <div className="absolute inset-0 neural-connections opacity-30"></div>
        <Image 
          src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=600&fit=crop&crop=center" 
          alt="Neural network visualization representing cognitive learning pathways"
          fill
          className="object-cover opacity-20 mix-blend-overlay"
          priority
        />
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-bounce delay-100">
        <div className="neural-graph-node w-16 h-16 flex items-center justify-center">
          <Network className="h-8 w-8 text-neural-primary" />
        </div>
      </div>
      <div className="absolute top-32 right-20 animate-bounce delay-300">
        <div className="neural-graph-node w-12 h-12 flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-synapse-primary" />
        </div>
      </div>
      <div className="absolute bottom-32 left-20 animate-bounce delay-500">
        <div className="neural-graph-node w-14 h-14 flex items-center justify-center">
          <Play className="h-7 w-7 text-cognition-teal" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <div className="mb-6 inline-flex items-center rounded-full border border-neural-light/30 bg-background/50 px-4 py-2 text-sm backdrop-blur">
          <Sparkles className="mr-2 h-4 w-4 text-cognition-orange animate-pulse" />
          <span className="text-neural-primary font-medium">
            Advanced Brain & Cognitive Sciences Platform
          </span>
        </div>

        <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          <span className="bg-gradient-neural bg-clip-text text-transparent">
            Interactive Learning
          </span>
          <br />
          <span className="text-neural-primary">
            for the Mind
          </span>
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
          Explore the fascinating world of brain and cognitive sciences through our 
          revolutionary e-learning platform. Where academic excellence meets
          innovative neural-inspired learning experiences.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/courses">
            <NeuralButton size="lg" className="min-w-[200px]">
              Start Exploring
              <ArrowRight className="ml-2 h-5 w-5" />
            </NeuralButton>
          </Link>
          
          <Link href="/network">
            <NeuralButton variant="cognitive" size="lg" className="min-w-[200px]">
              <Play className="mr-2 h-5 w-5" />
              Explore Network
            </NeuralButton>
          </Link>
        </div>
      </div>
    </section>
  )
}