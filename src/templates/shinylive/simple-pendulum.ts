import { ShinyliveTemplate, ShinyliveCategory } from '@/types/shinylive';

export const simplePendulumTemplate: ShinyliveTemplate = {
  id: 'simple-pendulum',
  name: 'Simple Pendulum Simulation',
  description: 'Interactive simulation of a simple pendulum with adjustable length, initial angle, and damping. Explore harmonic motion and energy conservation.',
  category: ShinyliveCategory.PHYSICS,
  version: '1.0.0',
  tags: ['physics', 'pendulum', 'harmonic-motion', 'oscillation', 'energy'],
  requirements: ['plotly', 'numpy'],
  features: [
    'Adjustable pendulum length and initial angle',
    'Damping coefficient control',
    'Real-time angle and energy plots',
    'Phase space visualization',
    'Period and frequency calculation'
  ],
  sourceCode: `from shiny import App, render, ui
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np

app_ui = ui.page_fluid(
    ui.h2("Simple Pendulum Simulation"),
    ui.layout_sidebar(
        ui.sidebar(
            ui.h4("Pendulum Parameters"),
            ui.input_slider("length", "Length (m)", 0.5, 5, 1, step=0.1),
            ui.input_slider("initial_angle", "Initial Angle (degrees)", 5, 175, 45, step=5),
            ui.input_slider("damping", "Damping Coefficient", 0, 1, 0.1, step=0.05),

            ui.hr(),
            ui.h4("Simulation"),
            ui.input_slider("duration", "Duration (s)", 5, 30, 10, step=1),
            ui.input_action_button("simulate", "Run Simulation", class_="btn-primary"),
            width=300
        ),
        ui.layout_columns(
            ui.card(
                ui.card_header("Angle vs Time"),
                ui.output_ui("angle_plot")
            ),
            ui.card(
                ui.card_header("Phase Space"),
                ui.output_ui("phase_plot")
            ),
            col_widths=[6, 6]
        ),
        ui.card(
            ui.card_header("Energy and Metrics"),
            ui.output_text_verbatim("metrics")
        )
    )
)

def server(input, output, session):
    @output
    @render.ui
    def angle_plot():
        L = input.length()
        theta0 = np.radians(input.initial_angle())
        b = input.damping()
        T = input.duration()
        g = 9.8

        # Time array
        dt = 0.01
        t = np.arange(0, T, dt)

        # Solve using Euler method
        theta = np.zeros(len(t))
        omega = np.zeros(len(t))
        theta[0] = theta0
        omega[0] = 0

        for i in range(1, len(t)):
            alpha = -(g / L) * np.sin(theta[i-1]) - b * omega[i-1]
            omega[i] = omega[i-1] + alpha * dt
            theta[i] = theta[i-1] + omega[i] * dt

        fig = go.Figure()

        fig.add_trace(go.Scatter(
            x=t, y=np.degrees(theta),
            mode='lines',
            name='Angle',
            line=dict(color='blue', width=2)
        ))

        fig.update_layout(
            title=f"Pendulum Angle (L={L}m, θ₀={input.initial_angle()}°, b={b})",
            xaxis_title="Time (s)",
            yaxis_title="Angle (degrees)",
            height=400,
            showlegend=False
        )

        return ui.HTML(fig.to_html(include_plotlyjs="cdn"))

    @output
    @render.ui
    def phase_plot():
        L = input.length()
        theta0 = np.radians(input.initial_angle())
        b = input.damping()
        T = input.duration()
        g = 9.8

        dt = 0.01
        t = np.arange(0, T, dt)

        theta = np.zeros(len(t))
        omega = np.zeros(len(t))
        theta[0] = theta0
        omega[0] = 0

        for i in range(1, len(t)):
            alpha = -(g / L) * np.sin(theta[i-1]) - b * omega[i-1]
            omega[i] = omega[i-1] + alpha * dt
            theta[i] = theta[i-1] + omega[i] * dt

        fig = go.Figure()

        fig.add_trace(go.Scatter(
            x=np.degrees(theta), y=omega,
            mode='lines',
            name='Phase Trajectory',
            line=dict(color='purple', width=2)
        ))

        # Starting point
        fig.add_trace(go.Scatter(
            x=[np.degrees(theta[0])], y=[omega[0]],
            mode='markers',
            name='Start',
            marker=dict(size=10, color='green')
        ))

        fig.update_layout(
            title="Phase Space (Angle vs Angular Velocity)",
            xaxis_title="Angle (degrees)",
            yaxis_title="Angular Velocity (rad/s)",
            height=400,
            showlegend=True
        )

        return ui.HTML(fig.to_html(include_plotlyjs="cdn"))

    @output
    @render.text
    def metrics():
        L = input.length()
        theta0_deg = input.initial_angle()
        theta0 = np.radians(theta0_deg)
        b = input.damping()
        T = input.duration()
        g = 9.8

        # Simulation
        dt = 0.01
        t = np.arange(0, T, dt)

        theta = np.zeros(len(t))
        omega = np.zeros(len(t))
        theta[0] = theta0
        omega[0] = 0

        for i in range(1, len(t)):
            alpha = -(g / L) * np.sin(theta[i-1]) - b * omega[i-1]
            omega[i] = omega[i-1] + alpha * dt
            theta[i] = theta[i-1] + omega[i] * dt

        # Calculate energy
        m = 1  # Mass (normalized)
        PE = m * g * L * (1 - np.cos(theta))
        KE = 0.5 * m * (L * omega) ** 2
        total_energy = PE + KE

        # Small angle approximation for period
        period_approx = 2 * np.pi * np.sqrt(L / g)

        # Find actual period (first zero crossing)
        zero_crossings = np.where(np.diff(np.sign(theta)))[0]
        if len(zero_crossings) >= 2:
            actual_period = 2 * (t[zero_crossings[1]] - t[zero_crossings[0]])
        else:
            actual_period = None

        return f"""
Pendulum Parameters:
====================
Length (L):        {L} m
Initial Angle (θ₀): {theta0_deg}°
Damping (b):       {b}
Gravity (g):       {g} m/s²

Dynamics:
=========
Period (small angle approx): {period_approx:.3f} s
{"Actual Period: " + f"{actual_period:.3f} s" if actual_period else "Period: N/A (not enough oscillations)"}
Frequency:         {1/period_approx:.3f} Hz

Energy (at t=0):
================
Potential Energy:  {PE[0]:.3f} J
Kinetic Energy:    {KE[0]:.3f} J
Total Energy:      {total_energy[0]:.3f} J

Energy (at t={T}s):
{"=" * 20}
Potential Energy:  {PE[-1]:.3f} J
Kinetic Energy:    {KE[-1]:.3f} J
Total Energy:      {total_energy[-1]:.3f} J

Energy Loss:       {(total_energy[0] - total_energy[-1]):.3f} J
Energy Loss (%):   {100 * (total_energy[0] - total_energy[-1])/total_energy[0]:.2f}%

Equations of Motion:
====================
θ''(t) + (b)θ'(t) + (g/L)sin(θ) = 0

Small Angle Approximation:
θ''(t) + (g/L)θ(t) ≈ 0
T = 2π√(L/g)
        """

app = App(app_ui, server)
`
};
