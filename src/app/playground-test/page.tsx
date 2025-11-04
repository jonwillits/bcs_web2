import { ShinyliveEmbed } from '@/components/playground/ShinyliveEmbed';
import Link from 'next/link';

export const metadata = {
  title: 'Playground Prototypes - Shinylive Testing',
  description: 'Testing Shinylive integration for interactive educational playgrounds',
};

// Example app code
const SIMPLE_APP = `from shiny import App, ui, render

app_ui = ui.page_fluid(
    ui.h2("Hello Shinylive!"),
    ui.input_slider("n", "Choose a number", 0, 100, 20),
    ui.output_text_verbatim("txt")
)

def server(input, output, session):
    @output
    @render.text
    def txt():
        return f"n * 2 is {input.n() * 2}"

app = App(app_ui, server)
`;

const DATA_VIZ_APP = `from shiny import App, render, ui
import plotly.graph_objects as go
import numpy as np

app_ui = ui.page_fluid(
    ui.h2("Interactive Data Visualization"),
    ui.layout_sidebar(
        ui.sidebar(
            ui.input_slider("num_points", "Number of Points", 10, 200, 50),
            ui.input_slider("noise", "Noise Level", 0, 2, 0.5, step=0.1)
        ),
        ui.output_ui("plot")
    )
)

def server(input, output, session):
    @output
    @render.ui
    def plot():
        n = input.num_points()
        x = np.linspace(0, 10, n)
        y = np.sin(x) + np.random.normal(0, input.noise(), n)

        fig = go.Figure()
        fig.add_trace(go.Scatter(x=x, y=y, mode='markers', name='Data'))
        fig.add_trace(go.Scatter(x=x, y=np.sin(x), mode='lines', name='True'))
        fig.update_layout(title="Interactive Sine Wave", height=400)

        return ui.HTML(fig.to_html(include_plotlyjs="cdn"))

app = App(app_ui, server)
`;

export default function PlaygroundTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Playground Prototypes
          </h1>
          <p className="text-lg text-gray-600">
            Testing Shinylive integration for the new playground architecture
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                What is This?
              </h3>
              <p className="text-blue-800">
                These demos test the new Shinylive-based playground architecture.
                Shinylive runs Python entirely in your browser using WebAssembly -
                no server required! This solves the reliability issues with the old
                Pyodide + turtle graphics system.
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-semibold">✅ No Server Costs</span>
                  <p className="text-blue-700">Runs entirely in browser</p>
                </div>
                <div>
                  <span className="font-semibold">✅ Stable & Reliable</span>
                  <p className="text-blue-700">Framework-based, well-maintained</p>
                </div>
                <div>
                  <span className="font-semibold">✅ Rich Visualizations</span>
                  <p className="text-blue-700">Plotly, Matplotlib built-in</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo 1: Simple App */}
        <section className="mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Demo 1: Simple Interactive App
            </h2>
            <p className="text-gray-600 mb-4">
              A minimal Shiny app with a slider and reactive output.
              Perfect for testing basic functionality.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4">
              <ShinyliveEmbed
                key="demo-1-simple"
                sourceCode={SIMPLE_APP}
                title="Simple Interactive App"
                height={400}
              />
            </div>
            <details className="text-sm">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                View Source Code
              </summary>
              <pre className="mt-2 p-4 bg-gray-900 text-gray-100 rounded overflow-x-auto">
                <code>{SIMPLE_APP}</code>
              </pre>
            </details>
          </div>
        </section>

        {/* Demo 2: Data Visualization */}
        <section className="mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Demo 2: Interactive Data Visualization
            </h2>
            <p className="text-gray-600 mb-4">
              A Plotly-based visualization with multiple controls.
              Demonstrates rich charting capabilities.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4">
              <ShinyliveEmbed
                key="demo-2-dataviz"
                sourceCode={DATA_VIZ_APP}
                requirements={['plotly', 'numpy']}
                title="Data Visualization Demo"
                height={600}
              />
            </div>
            <details className="text-sm">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                View Source Code
              </summary>
              <pre className="mt-2 p-4 bg-gray-900 text-gray-100 rounded overflow-x-auto">
                <code>{DATA_VIZ_APP}</code>
              </pre>
            </details>
          </div>
        </section>

        {/* Links to Local Demos */}
        <section>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Additional Prototypes
            </h2>
            <p className="text-gray-600 mb-4">
              More complex demos are available in <code className="bg-gray-100 px-2 py-1 rounded">/playground-prototypes</code>:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  📊 Data Visualization
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Multiple chart types, noise control, function selection
                </p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                  cd playground-prototypes/demo1-data-viz && shiny run app.py
                </code>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  🧠 Neural Network
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Interactive ML training, decision boundaries, real-time loss
                </p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                  cd playground-prototypes/demo2-neural-network && shiny run app.py
                </code>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  🔢 Sorting Algorithms
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Step-by-step execution, multiple algorithms, visual feedback
                </p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                  cd playground-prototypes/demo3-sorting && shiny run app.py
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <section className="mt-12">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              ✅ Next Steps
            </h3>
            <ul className="list-disc list-inside text-green-800 space-y-1">
              <li>Validate these prototypes work correctly</li>
              <li>Measure bundle sizes and load times</li>
              <li>Test on mobile devices</li>
              <li>Get stakeholder approval</li>
              <li>Begin Phase 2: Builder interface</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
