/**
 * TensorFlow Playground Page
 * Interactive neural network playground inspired by playground.tensorflow.org
 */

import { Metadata } from 'next';
import { TensorFlowPlayground } from '@/components/tensorflow-playground';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'Neural Network Playground | BCS E-Textbook',
  description:
    'Interactive neural network visualization. Explore how neural networks learn by adjusting architecture, datasets, and training parameters.',
  openGraph: {
    title: 'Neural Network Playground',
    description:
      'Interactive neural network visualization inspired by TensorFlow Playground',
  },
};

export default function TensorFlowPlaygroundPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header />
      <TensorFlowPlayground />
    </div>
  );
}
