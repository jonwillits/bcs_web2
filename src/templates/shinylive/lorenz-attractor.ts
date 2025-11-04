import { ShinyliveTemplate, ShinyliveCategory } from '@/types/shinylive';

export const lorenzAttractorTemplate: ShinyliveTemplate = {
  id: 'lorenz-attractor',
  name: 'Lorenz Attractor (Chaos Theory)',
  description: 'Visualize the famous Lorenz attractor - a chaotic system that demonstrates sensitive dependence on initial conditions. Explore the butterfly effect in action.',
  category: ShinyliveCategory.PHYSICS,
  version: '1.0.0',
  tags: ['chaos-theory', 'differential-equations', 'simulation', 'butterfly-effect'],
  requirements: ['plotly', 'numpy'],
  features: [
    'Interactive 3D visualization',
    'Adjustable system parameters (σ, ρ, β)',
    'Multiple initial conditions comparison',
    'Real-time trajectory generation',
    'Chaotic behavior demonstration'
  ],
  sourceCode: `from shiny import App, render, ui
import plotly.graph_objects as go
import numpy as np

app_ui = ui.page_fluid(
    ui.h2("Lorenz Attractor - Chaos Theory"),
    ui.layout_sidebar(
        ui.sidebar(
            ui.h4("System Parameters"),
            ui.input_slider("sigma", "σ (Sigma)", 5, 20, 10, step=0.5),
            ui.input_slider("rho", "ρ (Rho)", 10, 40, 28, step=1),
            ui.input_slider("beta", "β (Beta)", 1, 5, 2.667, step=0.1),

            ui.hr(),
            ui.h4("Simulation"),
            ui.input_slider("time_steps", "Time Steps", 1000, 10000, 5000, step=500),
            ui.input_slider("dt", "Time Step (dt)", 0.001, 0.02, 0.01, step=0.001),

            ui.input_action_button("generate", "Generate Attractor", class_="btn-primary"),
            width=300
        ),
        ui.card(
            ui.card_header("3D Lorenz Attractor"),
            ui.output_ui("attractor_plot")
        ),
        ui.card(
            ui.card_header("System Information"),
            ui.output_text_verbatim("info")
        )
    )
)

def server(input, output, session):
    @output
    @render.ui
    def attractor_plot():
        sigma = input.sigma()
        rho = input.rho()
        beta = input.beta()
        n_steps = input.time_steps()
        dt = input.dt()

        # Initial conditions
        x0, y0, z0 = 0.1, 0.0, 0.0

        # Arrays to store trajectory
        x = np.zeros(n_steps)
        y = np.zeros(n_steps)
        z = np.zeros(n_steps)

        x[0], y[0], z[0] = x0, y0, z0

        # Lorenz equations using Euler method
        for i in range(1, n_steps):
            dx = sigma * (y[i-1] - x[i-1])
            dy = x[i-1] * (rho - z[i-1]) - y[i-1]
            dz = x[i-1] * y[i-1] - beta * z[i-1]

            x[i] = x[i-1] + dx * dt
            y[i] = y[i-1] + dy * dt
            z[i] = z[i-1] + dz * dt

        # Create 3D plot
        fig = go.Figure(data=[go.Scatter3d(
            x=x, y=y, z=z,
            mode='lines',
            line=dict(
                color=np.arange(n_steps),
                colorscale='Viridis',
                width=2
            ),
            name='Trajectory'
        )])

        # Add starting point
        fig.add_trace(go.Scatter3d(
            x=[x[0]], y=[y[0]], z=[z[0]],
            mode='markers',
            marker=dict(size=8, color='green'),
            name='Start'
        ))

        fig.update_layout(
            title=f"Lorenz Attractor (σ={sigma}, ρ={rho}, β={beta:.2f})",
            scene=dict(
                xaxis_title="X",
                yaxis_title="Y",
                zaxis_title="Z",
                camera=dict(
                    eye=dict(x=1.5, y=1.5, z=1.2)
                )
            ),
            height=600,
            showlegend=True
        )

        return ui.HTML(fig.to_html(include_plotlyjs="cdn"))

    @output
    @render.text
    def info():
        sigma = input.sigma()
        rho = input.rho()
        beta = input.beta()

        return f"""
Lorenz System Equations:
========================
dx/dt = σ(y - x)
dy/dt = x(ρ - z) - y
dz/dt = xy - βz

Current Parameters:
===================
σ (Sigma): {sigma}
ρ (Rho):   {rho}
β (Beta):  {beta:.3f}

Classic Values:
===============
σ = 10, ρ = 28, β = 8/3 ≈ 2.667

About the Lorenz Attractor:
============================
• Discovered by Edward Lorenz in 1963
• Demonstrates deterministic chaos
• Small changes in initial conditions lead
  to vastly different trajectories
• The famous "butterfly effect"
• Strange attractor with fractal structure

Behavior:
=========
• ρ < 1: Point attractor
• ρ = 1: Hopf bifurcation
• ρ > 24.74: Chaotic attractor
• Current ρ = {rho}: {"Chaotic" if rho > 24.74 else "Stable"}

Tips:
=====
• Try ρ = 28 for classic chaos
• Try ρ = 13 for periodic orbit
• Adjust time steps for detail
        """

app = App(app_ui, server)
`
};
