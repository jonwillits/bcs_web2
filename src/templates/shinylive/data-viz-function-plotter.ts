import { ShinyliveTemplate, ShinyliveCategory } from '@/types/shinylive';

export const dataVizFunctionPlotterTemplate: ShinyliveTemplate = {
  id: 'data-viz-function-plotter',
  name: 'Interactive Function Plotter',
  description: 'Visualize mathematical functions with customizable parameters, noise levels, and color schemes. Perfect for exploring function behavior and data patterns.',
  category: ShinyliveCategory.DATA_VIZ,
  version: '1.0.0',
  tags: ['plotly', 'numpy', 'visualization', 'functions', 'mathematics'],
  requirements: ['plotly', 'numpy'],
  features: [
    'Multiple function types (linear, quadratic, sine, exponential)',
    'Adjustable data points and noise levels',
    'Real-time Plotly charts',
    'Live statistics display',
    'Color scheme options'
  ],
  sourceCode: `from shiny import App, render, ui
import plotly.graph_objects as go
import numpy as np

app_ui = ui.page_fluid(
    ui.h2("Interactive Function Plotter"),
    ui.layout_sidebar(
        ui.sidebar(
            ui.input_slider("num_points", "Number of Points", 10, 500, 100, step=10),
            ui.input_slider("noise_level", "Noise Level", 0, 2, 0.5, step=0.1),
            ui.input_select(
                "function_type",
                "Function Type",
                choices={
                    "linear": "Linear (y = 2x + 1)",
                    "quadratic": "Quadratic (y = x²)",
                    "sine": "Sine Wave (y = sin(x))",
                    "exponential": "Exponential (y = eˣ/10)",
                    "logarithmic": "Logarithmic (y = ln(x+1))"
                }
            ),
            ui.input_select(
                "color_scheme",
                "Color Scheme",
                choices={
                    "blue": "Blue",
                    "red": "Red",
                    "green": "Green",
                    "purple": "Purple"
                }
            ),
            width=300
        ),
        ui.card(
            ui.card_header("Function Visualization"),
            ui.output_ui("plot")
        ),
        ui.card(
            ui.card_header("Statistics"),
            ui.output_text_verbatim("stats")
        )
    )
)

def server(input, output, session):
    @output
    @render.ui
    def plot():
        n = input.num_points()
        noise = input.noise_level()
        func_type = input.function_type()
        color = input.color_scheme()

        # Generate x values
        x = np.linspace(0, 10, n)

        # Generate y values based on function type
        if func_type == "linear":
            y_true = 2 * x + 1
            title = "Linear Function: y = 2x + 1"
        elif func_type == "quadratic":
            y_true = x ** 2
            title = "Quadratic Function: y = x²"
        elif func_type == "sine":
            y_true = np.sin(x)
            title = "Sine Wave: y = sin(x)"
        elif func_type == "exponential":
            y_true = np.exp(x) / 10
            title = "Exponential Function: y = eˣ/10"
        else:  # logarithmic
            y_true = np.log(x + 1)
            title = "Logarithmic Function: y = ln(x+1)"

        # Add noise
        y_noisy = y_true + np.random.normal(0, noise, n)

        # Create plot
        fig = go.Figure()

        # Add noisy data points
        fig.add_trace(go.Scatter(
            x=x,
            y=y_noisy,
            mode='markers',
            name='Data with Noise',
            marker=dict(size=6, color=color, opacity=0.6)
        ))

        # Add true function line
        fig.add_trace(go.Scatter(
            x=x,
            y=y_true,
            mode='lines',
            name='True Function',
            line=dict(color='black', width=2, dash='dash')
        ))

        fig.update_layout(
            title=title,
            xaxis_title="x",
            yaxis_title="y",
            height=500,
            hovermode='closest',
            showlegend=True
        )

        return ui.HTML(fig.to_html(include_plotlyjs="cdn"))

    @output
    @render.text
    def stats():
        n = input.num_points()
        noise = input.noise_level()
        func_type = input.function_type()

        x = np.linspace(0, 10, n)

        if func_type == "linear":
            y_true = 2 * x + 1
        elif func_type == "quadratic":
            y_true = x ** 2
        elif func_type == "sine":
            y_true = np.sin(x)
        elif func_type == "exponential":
            y_true = np.exp(x) / 10
        else:
            y_true = np.log(x + 1)

        y_noisy = y_true + np.random.normal(0, noise, n)

        return f"""
Dataset Statistics:
==================
Points: {n}
Noise Level: {noise:.2f}
Function: {func_type}

Data Range:
  x: [{x.min():.2f}, {x.max():.2f}]
  y (true): [{y_true.min():.2f}, {y_true.max():.2f}]
  y (noisy): [{y_noisy.min():.2f}, {y_noisy.max():.2f}]

Noise Statistics:
  Mean: {(y_noisy - y_true).mean():.4f}
  Std Dev: {(y_noisy - y_true).std():.4f}
        """

app = App(app_ui, server)
`
};
