import { ShinyliveTemplate, ShinyliveCategory } from '@/types/shinylive';

export const statisticalDistributionsTemplate: ShinyliveTemplate = {
  id: 'statistical-distributions',
  name: 'Statistical Distributions Explorer',
  description: 'Interactive exploration of probability distributions including normal, uniform, exponential, and binomial distributions with adjustable parameters.',
  category: ShinyliveCategory.MATHEMATICS,
  version: '1.0.0',
  tags: ['statistics', 'probability', 'distributions', 'mathematics', 'data-science'],
  requirements: ['plotly', 'numpy'],
  features: [
    'Multiple probability distributions',
    'Adjustable distribution parameters',
    'Histogram and density plots',
    'Statistical summary (mean, median, std dev)',
    'Sample size control'
  ],
  sourceCode: `from shiny import App, render, ui
import plotly.graph_objects as go
import numpy as np
from plotly.subplots import make_subplots

app_ui = ui.page_fluid(
    ui.h2("Statistical Distributions Explorer"),
    ui.layout_sidebar(
        ui.sidebar(
            ui.input_select(
                "distribution",
                "Distribution Type",
                choices={
                    "normal": "Normal (Gaussian)",
                    "uniform": "Uniform",
                    "exponential": "Exponential",
                    "binomial": "Binomial",
                    "poisson": "Poisson"
                }
            ),
            ui.input_slider("sample_size", "Sample Size", 100, 10000, 1000, step=100),

            ui.hr(),
            ui.panel_conditional(
                "input.distribution === 'normal'",
                ui.input_slider("normal_mean", "Mean (μ)", -10, 10, 0, 0.5),
                ui.input_slider("normal_std", "Std Dev (σ)", 0.1, 5, 1, step=0.1)
            ),
            ui.panel_conditional(
                "input.distribution === 'uniform'",
                ui.input_slider("uniform_low", "Lower Bound", -10, 10, 0, 0.5),
                ui.input_slider("uniform_high", "Upper Bound", -10, 20, 10, 0.5)
            ),
            ui.panel_conditional(
                "input.distribution === 'exponential'",
                ui.input_slider("exp_rate", "Rate (λ)", 0.1, 5, 1, step=0.1)
            ),
            ui.panel_conditional(
                "input.distribution === 'binomial'",
                ui.input_slider("binomial_n", "Trials (n)", 1, 100, 20, step=1),
                ui.input_slider("binomial_p", "Probability (p)", 0, 1, 0.5, step=0.05)
            ),
            ui.panel_conditional(
                "input.distribution === 'poisson'",
                ui.input_slider("poisson_lambda", "Lambda (λ)", 0.1, 20, 5, step=0.5)
            ),

            ui.hr(),
            ui.input_action_button("resample", "Generate New Sample", class_="btn-primary"),
            width=300
        ),
        ui.card(
            ui.card_header("Distribution Visualization"),
            ui.output_ui("distribution_plot")
        ),
        ui.card(
            ui.card_header("Statistical Summary"),
            ui.output_text_verbatim("stats")
        )
    )
)

def server(input, output, session):
    @output
    @render.ui
    def distribution_plot():
        dist = input.distribution()
        n = input.sample_size()

        # Generate samples
        if dist == "normal":
            samples = np.random.normal(input.normal_mean(), input.normal_std(), n)
            title = f"Normal Distribution (μ={input.normal_mean()}, σ={input.normal_std()})"
        elif dist == "uniform":
            samples = np.random.uniform(input.uniform_low(), input.uniform_high(), n)
            title = f"Uniform Distribution ({input.uniform_low()}, {input.uniform_high()})"
        elif dist == "exponential":
            samples = np.random.exponential(1 / input.exp_rate(), n)
            title = f"Exponential Distribution (λ={input.exp_rate()})"
        elif dist == "binomial":
            samples = np.random.binomial(input.binomial_n(), input.binomial_p(), n)
            title = f"Binomial Distribution (n={input.binomial_n()}, p={input.binomial_p()})"
        else:  # poisson
            samples = np.random.poisson(input.poisson_lambda(), n)
            title = f"Poisson Distribution (λ={input.poisson_lambda()})"

        # Create figure
        fig = go.Figure()

        fig.add_trace(go.Histogram(
            x=samples,
            nbinsx=50,
            name='Sample Data',
            marker=dict(color='steelblue', line=dict(color='white', width=1)),
            opacity=0.7
        ))

        fig.update_layout(
            title=title,
            xaxis_title="Value",
            yaxis_title="Frequency",
            height=500,
            showlegend=False,
            bargap=0.05
        )

        return ui.HTML(fig.to_html(include_plotlyjs="cdn"))

    @output
    @render.text
    def stats():
        dist = input.distribution()
        n = input.sample_size()

        if dist == "normal":
            samples = np.random.normal(input.normal_mean(), input.normal_std(), n)
            params = f"μ = {input.normal_mean()}, σ = {input.normal_std()}"
        elif dist == "uniform":
            samples = np.random.uniform(input.uniform_low(), input.uniform_high(), n)
            params = f"Range = [{input.uniform_low()}, {input.uniform_high()}]"
        elif dist == "exponential":
            samples = np.random.exponential(1 / input.exp_rate(), n)
            params = f"λ = {input.exp_rate()}"
        elif dist == "binomial":
            samples = np.random.binomial(input.binomial_n(), input.binomial_p(), n)
            params = f"n = {input.binomial_n()}, p = {input.binomial_p()}"
        else:
            samples = np.random.poisson(input.poisson_lambda(), n)
            params = f"λ = {input.poisson_lambda()}"

        return f"""
Distribution: {dist.title()}
Parameters: {params}
Sample Size: {n}

Summary Statistics:
===================
Mean: {np.mean(samples):.4f}
Median: {np.median(samples):.4f}
Std Dev: {np.std(samples):.4f}
Variance: {np.var(samples):.4f}

Quartiles:
  25th: {np.percentile(samples, 25):.4f}
  50th: {np.percentile(samples, 50):.4f}
  75th: {np.percentile(samples, 75):.4f}

Range:
  Min: {np.min(samples):.4f}
  Max: {np.max(samples):.4f}
        """

app = App(app_ui, server)
`
};
