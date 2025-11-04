"""
Demo 1: Interactive Data Visualization
Purpose: Test basic Shiny + Plotly integration for educational playgrounds
Features: Sliders, dropdowns, interactive charts with real-time updates
"""

from shiny import App, render, ui
import plotly.graph_objects as go
import numpy as np

# UI Definition
app_ui = ui.page_fluid(
    ui.panel_title("Interactive Data Visualization Demo"),

    ui.layout_sidebar(
        ui.sidebar(
            ui.h3("Controls"),

            ui.input_slider(
                "num_points",
                "Number of Points",
                min=10,
                max=500,
                value=100,
                step=10
            ),

            ui.input_slider(
                "noise_level",
                "Noise Level",
                min=0,
                max=2,
                value=0.5,
                step=0.1
            ),

            ui.input_select(
                "function_type",
                "Function Type",
                choices={
                    "linear": "Linear",
                    "quadratic": "Quadratic",
                    "sine": "Sine Wave",
                    "exponential": "Exponential"
                }
            ),

            ui.input_select(
                "color_scheme",
                "Color Scheme",
                choices={
                    "blues": "Blues",
                    "reds": "Reds",
                    "greens": "Greens",
                    "viridis": "Viridis"
                }
            ),

            ui.hr(),

            ui.p(
                "This demo shows how Shiny + Plotly can create interactive "
                "educational visualizations with zero server costs."
            ),

            width=300
        ),

        ui.card(
            ui.card_header("Interactive Plot"),
            ui.output_ui("plot")
        ),

        ui.card(
            ui.card_header("Statistics"),
            ui.output_text_verbatim("stats")
        )
    )
)


# Server Logic
def server(input, output, session):

    @output
    @render.ui
    def plot():
        # Generate data based on inputs
        n = input.num_points()
        noise = input.noise_level()
        func_type = input.function_type()

        # X values
        x = np.linspace(0, 10, n)

        # Generate Y values based on function type
        if func_type == "linear":
            y = 2 * x + 1
        elif func_type == "quadratic":
            y = x ** 2
        elif func_type == "sine":
            y = 5 * np.sin(x)
        elif func_type == "exponential":
            y = np.exp(x / 5)

        # Add noise
        y_noisy = y + np.random.normal(0, noise, n)

        # Color scheme
        color_map = {
            "blues": "rgb(31, 119, 180)",
            "reds": "rgb(214, 39, 40)",
            "greens": "rgb(44, 160, 44)",
            "viridis": "rgb(68, 1, 84)"
        }
        color = color_map.get(input.color_scheme(), "rgb(31, 119, 180)")

        # Create plotly figure
        fig = go.Figure()

        # Add scatter plot
        fig.add_trace(go.Scatter(
            x=x,
            y=y_noisy,
            mode='markers',
            name='Data',
            marker=dict(
                size=8,
                color=color,
                opacity=0.6
            )
        ))

        # Add true function line
        fig.add_trace(go.Scatter(
            x=x,
            y=y,
            mode='lines',
            name='True Function',
            line=dict(
                color='rgb(255, 127, 14)',
                width=3
            )
        ))

        # Update layout
        fig.update_layout(
            title=f"{func_type.capitalize()} Function with Noise",
            xaxis_title="X",
            yaxis_title="Y",
            hovermode='closest',
            height=500,
            template="plotly_white"
        )

        return ui.HTML(fig.to_html(include_plotlyjs="cdn", div_id="plot"))

    @output
    @render.text
    def stats():
        n = input.num_points()
        noise = input.noise_level()
        func_type = input.function_type()

        # Generate same data for statistics
        x = np.linspace(0, 10, n)

        if func_type == "linear":
            y = 2 * x + 1
        elif func_type == "quadratic":
            y = x ** 2
        elif func_type == "sine":
            y = 5 * np.sin(x)
        elif func_type == "exponential":
            y = np.exp(x / 5)

        y_noisy = y + np.random.normal(0, noise, n)

        # Calculate statistics
        mean_val = np.mean(y_noisy)
        std_val = np.std(y_noisy)
        min_val = np.min(y_noisy)
        max_val = np.max(y_noisy)

        return f"""
Statistics:
-----------
Function Type: {func_type.capitalize()}
Number of Points: {n}
Noise Level: {noise}

Mean: {mean_val:.2f}
Std Dev: {std_val:.2f}
Min: {min_val:.2f}
Max: {max_val:.2f}
Range: {max_val - min_val:.2f}
"""


# Create app
app = App(app_ui, server)
