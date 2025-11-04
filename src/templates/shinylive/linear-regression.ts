import { ShinyliveTemplate, ShinyliveCategory } from '@/types/shinylive';

export const linearRegressionTemplate: ShinyliveTemplate = {
  id: 'linear-regression',
  name: 'Linear Regression Visualizer',
  description: 'Interactive linear regression with adjustable data points, noise, and polynomial degrees. Visualize best-fit lines and regression metrics.',
  category: ShinyliveCategory.MATHEMATICS,
  version: '1.0.0',
  tags: ['regression', 'statistics', 'machine-learning', 'curve-fitting'],
  requirements: ['plotly', 'numpy'],
  features: [
    'Adjustable polynomial degree (1-5)',
    'Variable noise levels',
    'R² and RMSE metrics',
    'Residual plot',
    'Interactive data generation'
  ],
  sourceCode: `from shiny import App, render, ui
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np

app_ui = ui.page_fluid(
    ui.h2("Linear Regression Visualizer"),
    ui.layout_sidebar(
        ui.sidebar(
            ui.input_slider("n_points", "Number of Points", 20, 200, 50, step=10),
            ui.input_slider("noise", "Noise Level", 0, 5, 1, step=0.1),
            ui.input_slider("poly_degree", "Polynomial Degree", 1, 5, 1, step=1),
            ui.input_action_button("regenerate", "Generate New Data", class_="btn-primary"),
            width=300
        ),
        ui.layout_columns(
            ui.card(
                ui.card_header("Regression Fit"),
                ui.output_ui("regression_plot")
            ),
            ui.card(
                ui.card_header("Residuals"),
                ui.output_ui("residual_plot")
            ),
            col_widths=[6, 6]
        ),
        ui.card(
            ui.card_header("Model Metrics"),
            ui.output_text_verbatim("metrics")
        )
    )
)

def server(input, output, session):
    @output
    @render.ui
    def regression_plot():
        n = input.n_points()
        noise = input.noise()
        degree = input.poly_degree()

        # Generate data
        x = np.linspace(0, 10, n)
        y_true = 2 * x + 1
        y = y_true + np.random.normal(0, noise, n)

        # Fit polynomial
        coeffs = np.polyfit(x, y, degree)
        y_pred = np.polyval(coeffs, x)

        # Create smooth curve for visualization
        x_smooth = np.linspace(0, 10, 200)
        y_smooth = np.polyval(coeffs, x_smooth)

        fig = go.Figure()

        # Data points
        fig.add_trace(go.Scatter(
            x=x, y=y,
            mode='markers',
            name='Data',
            marker=dict(size=8, color='blue', opacity=0.6)
        ))

        # Regression line
        fig.add_trace(go.Scatter(
            x=x_smooth, y=y_smooth,
            mode='lines',
            name=f'Fit (degree {degree})',
            line=dict(color='red', width=3)
        ))

        # True line
        fig.add_trace(go.Scatter(
            x=x, y=y_true,
            mode='lines',
            name='True Function',
            line=dict(color='green', width=2, dash='dash')
        ))

        fig.update_layout(
            title=f"Polynomial Regression (Degree {degree})",
            xaxis_title="x",
            yaxis_title="y",
            height=400,
            showlegend=True
        )

        return ui.HTML(fig.to_html(include_plotlyjs="cdn"))

    @output
    @render.ui
    def residual_plot():
        n = input.n_points()
        noise = input.noise()
        degree = input.poly_degree()

        x = np.linspace(0, 10, n)
        y_true = 2 * x + 1
        y = y_true + np.random.normal(0, noise, n)

        coeffs = np.polyfit(x, y, degree)
        y_pred = np.polyval(coeffs, x)
        residuals = y - y_pred

        fig = go.Figure()

        fig.add_trace(go.Scatter(
            x=x, y=residuals,
            mode='markers',
            name='Residuals',
            marker=dict(size=8, color='purple', opacity=0.6)
        ))

        # Zero line
        fig.add_trace(go.Scatter(
            x=[0, 10], y=[0, 0],
            mode='lines',
            name='Zero',
            line=dict(color='black', width=1, dash='dash')
        ))

        fig.update_layout(
            title="Residual Plot",
            xaxis_title="x",
            yaxis_title="Residuals (y - ŷ)",
            height=400,
            showlegend=False
        )

        return ui.HTML(fig.to_html(include_plotlyjs="cdn"))

    @output
    @render.text
    def metrics():
        n = input.n_points()
        noise = input.noise()
        degree = input.poly_degree()

        x = np.linspace(0, 10, n)
        y_true = 2 * x + 1
        y = y_true + np.random.normal(0, noise, n)

        coeffs = np.polyfit(x, y, degree)
        y_pred = np.polyval(coeffs, x)

        # Calculate metrics
        ss_res = np.sum((y - y_pred) ** 2)
        ss_tot = np.sum((y - np.mean(y)) ** 2)
        r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
        rmse = np.sqrt(np.mean((y - y_pred) ** 2))
        mae = np.mean(np.abs(y - y_pred))

        # Format equation
        equation = " + ".join([f"{c:.3f}x^{degree-i}" if degree-i > 0 else f"{c:.3f}"
                              for i, c in enumerate(coeffs)])

        return f"""
Model: Polynomial Regression (Degree {degree})
Equation: y = {equation}

Performance Metrics:
====================
R² Score: {r_squared:.4f}
RMSE: {rmse:.4f}
MAE: {mae:.4f}

Data Info:
==========
Points: {n}
Noise Level: {noise:.2f}
True Function: y = 2x + 1

Interpretation:
===============
R² = 1.0: Perfect fit
R² = 0.0: No better than mean
RMSE: Average prediction error
        """

app = App(app_ui, server)
`
};
