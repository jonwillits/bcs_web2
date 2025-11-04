import { ShinyliveTemplate, ShinyliveCategory } from '@/types/shinylive';

export const monteCarloPiTemplate: ShinyliveTemplate = {
  id: 'monte-carlo-pi',
  name: 'Monte Carlo Pi Estimation',
  description: 'Estimate the value of π using Monte Carlo simulation. Randomly sample points in a square and count how many fall inside a quarter circle.',
  category: ShinyliveCategory.SIMULATIONS,
  version: '1.0.0',
  tags: ['monte-carlo', 'simulation', 'mathematics', 'probability', 'pi'],
  requirements: ['plotly', 'numpy'],
  features: [
    'Interactive Monte Carlo simulation',
    'Real-time π estimation',
    'Convergence visualization',
    'Adjustable sample size',
    'Error tracking'
  ],
  sourceCode: `from shiny import App, render, ui, reactive
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np

app_ui = ui.page_fluid(
    ui.h2("Monte Carlo Pi Estimation"),
    ui.layout_sidebar(
        ui.sidebar(
            ui.input_slider("n_points", "Number of Points", 100, 10000, 1000, step=100),
            ui.input_action_button("simulate", "Run Simulation", class_="btn-primary"),
            ui.input_action_button("reset", "Reset", class_="btn-secondary"),
            width=300
        ),
        ui.layout_columns(
            ui.card(
                ui.card_header("Monte Carlo Sampling"),
                ui.output_ui("scatter_plot")
            ),
            ui.card(
                ui.card_header("Convergence"),
                ui.output_ui("convergence_plot")
            ),
            col_widths=[6, 6]
        ),
        ui.card(
            ui.card_header("Results"),
            ui.output_text_verbatim("results")
        )
    )
)

def server(input, output, session):
    simulation_data = reactive.Value({
        'points_inside': 0,
        'total_points': 0,
        'pi_estimates': [],
        'x_inside': [],
        'y_inside': [],
        'x_outside': [],
        'y_outside': []
    })

    @reactive.Effect
    @reactive.event(input.simulate)
    def run_simulation():
        n = input.n_points()
        data = simulation_data()

        # Generate random points in [0, 1] x [0, 1]
        x = np.random.uniform(0, 1, n)
        y = np.random.uniform(0, 1, n)

        # Check if points are inside quarter circle
        distances = x**2 + y**2
        inside = distances <= 1

        # Update cumulative data
        data['x_inside'].extend(x[inside].tolist())
        data['y_inside'].extend(y[inside].tolist())
        data['x_outside'].extend(x[~inside].tolist())
        data['y_outside'].extend(y[~inside].tolist())

        data['points_inside'] += np.sum(inside)
        data['total_points'] += n

        # Estimate pi
        if data['total_points'] > 0:
            pi_estimate = 4 * data['points_inside'] / data['total_points']
            data['pi_estimates'].append(pi_estimate)

        simulation_data.set(data)

    @reactive.Effect
    @reactive.event(input.reset)
    def reset_simulation():
        simulation_data.set({
            'points_inside': 0,
            'total_points': 0,
            'pi_estimates': [],
            'x_inside': [],
            'y_inside': [],
            'x_outside': [],
            'y_outside': []
        })

    @output
    @render.ui
    def scatter_plot():
        data = simulation_data()

        fig = go.Figure()

        # Quarter circle
        theta = np.linspace(0, np.pi/2, 100)
        circle_x = np.cos(theta)
        circle_y = np.sin(theta)
        fig.add_trace(go.Scatter(
            x=circle_x, y=circle_y,
            mode='lines',
            name='Quarter Circle',
            line=dict(color='black', width=2)
        ))

        # Points inside
        if len(data['x_inside']) > 0:
            sample_inside = min(2000, len(data['x_inside']))
            idx_inside = np.random.choice(len(data['x_inside']), sample_inside, replace=False)
            fig.add_trace(go.Scatter(
                x=[data['x_inside'][i] for i in idx_inside],
                y=[data['y_inside'][i] for i in idx_inside],
                mode='markers',
                name='Inside Circle',
                marker=dict(size=3, color='green', opacity=0.5)
            ))

        # Points outside
        if len(data['x_outside']) > 0:
            sample_outside = min(2000, len(data['x_outside']))
            idx_outside = np.random.choice(len(data['x_outside']), sample_outside, replace=False)
            fig.add_trace(go.Scatter(
                x=[data['x_outside'][i] for i in idx_outside],
                y=[data['y_outside'][i] for i in idx_outside],
                mode='markers',
                name='Outside Circle',
                marker=dict(size=3, color='red', opacity=0.5)
            ))

        fig.update_layout(
            title="Monte Carlo Sampling",
            xaxis=dict(range=[0, 1], scaleanchor="y", scaleratio=1),
            yaxis=dict(range=[0, 1]),
            height=500,
            showlegend=True
        )

        return ui.HTML(fig.to_html(include_plotlyjs="cdn"))

    @output
    @render.ui
    def convergence_plot():
        data = simulation_data()

        if len(data['pi_estimates']) == 0:
            return ui.p("Run simulation to see convergence")

        fig = go.Figure()

        fig.add_trace(go.Scatter(
            y=data['pi_estimates'],
            mode='lines+markers',
            name='π Estimate',
            line=dict(color='blue', width=2)
        ))

        # True value of pi
        fig.add_trace(go.Scatter(
            y=[np.pi] * len(data['pi_estimates']),
            mode='lines',
            name='True π',
            line=dict(color='red', width=2, dash='dash')
        ))

        fig.update_layout(
            title="Convergence to π",
            xaxis_title="Iteration",
            yaxis_title="Estimated π",
            height=500,
            showlegend=True
        )

        return ui.HTML(fig.to_html(include_plotlyjs="cdn"))

    @output
    @render.text
    def results():
        data = simulation_data()

        if data['total_points'] == 0:
            return "Click 'Run Simulation' to estimate π"

        pi_estimate = 4 * data['points_inside'] / data['total_points']
        error = abs(pi_estimate - np.pi)
        error_percent = (error / np.pi) * 100

        return f"""
Monte Carlo Pi Estimation
==========================

Results:
--------
Estimated π: {pi_estimate:.6f}
True π:      {np.pi:.6f}
Error:       {error:.6f} ({error_percent:.2f}%)

Statistics:
-----------
Total Points:    {data['total_points']}
Inside Circle:   {data['points_inside']}
Outside Circle:  {data['total_points'] - data['points_inside']}

Ratio (Inside/Total): {data['points_inside'] / data['total_points']:.6f}

How it Works:
=============
• Sample random points in a 1×1 square
• Count points inside quarter circle (x²+y²≤1)
• Ratio of inside/total ≈ (π/4) / 1
• Therefore: π ≈ 4 × (inside/total)

Tip: More points = better accuracy!
        """

app = App(app_ui, server)
`
};
