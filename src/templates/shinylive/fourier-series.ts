import { ShinyliveTemplate, ShinyliveCategory } from '@/types/shinylive';

export const fourierSeriesTemplate: ShinyliveTemplate = {
  id: 'fourier-series',
  name: 'Fourier Series Visualizer',
  description: 'Interactive visualization of Fourier series approximations for various waveforms. Explore how adding harmonics creates complex periodic functions.',
  category: ShinyliveCategory.MATHEMATICS,
  version: '1.0.0',
  tags: ['fourier', 'signal-processing', 'mathematics', 'waves', 'harmonics'],
  requirements: ['plotly', 'numpy'],
  features: [
    'Multiple target waveforms (square, sawtooth, triangle)',
    'Adjustable number of harmonics',
    'Real-time series approximation',
    'Individual harmonic visualization',
    'Convergence animation'
  ],
  sourceCode: `from shiny import App, render, ui
import plotly.graph_objects as go
import numpy as np

app_ui = ui.page_fluid(
    ui.h2("Fourier Series Visualizer"),
    ui.layout_sidebar(
        ui.sidebar(
            ui.input_select(
                "waveform",
                "Target Waveform",
                choices={
                    "square": "Square Wave",
                    "sawtooth": "Sawtooth Wave",
                    "triangle": "Triangle Wave"
                }
            ),
            ui.input_slider("n_harmonics", "Number of Harmonics", 1, 50, 5, step=1),
            ui.input_slider("frequency", "Frequency (Hz)", 1, 10, 1, step=1),
            width=300
        ),
        ui.card(
            ui.card_header("Fourier Approximation"),
            ui.output_ui("fourier_plot")
        ),
        ui.card(
            ui.card_header("Harmonic Components"),
            ui.output_ui("harmonics_plot")
        )
    )
)

def server(input, output, session):
    @output
    @render.ui
    def fourier_plot():
        waveform = input.waveform()
        n = input.n_harmonics()
        f = input.frequency()

        t = np.linspace(0, 2, 1000)

        # Generate target waveform
        if waveform == "square":
            target = np.sign(np.sin(2 * np.pi * f * t))
            title = "Square Wave"
        elif waveform == "sawtooth":
            target = 2 * (t * f - np.floor(t * f + 0.5))
            title = "Sawtooth Wave"
        else:  # triangle
            target = 2 * np.abs(2 * (t * f - np.floor(t * f + 0.5))) - 1
            title = "Triangle Wave"

        # Calculate Fourier series approximation
        approximation = np.zeros_like(t)

        if waveform == "square":
            for k in range(1, n + 1):
                harmonic = (1 / (2 * k - 1)) * np.sin(2 * np.pi * (2 * k - 1) * f * t)
                approximation += harmonic
            approximation *= (4 / np.pi)

        elif waveform == "sawtooth":
            for k in range(1, n + 1):
                harmonic = ((-1) ** (k + 1) / k) * np.sin(2 * np.pi * k * f * t)
                approximation += harmonic
            approximation *= (2 / np.pi)

        else:  # triangle
            for k in range(1, n + 1):
                harmonic = ((-1) ** k / (2 * k - 1) ** 2) * np.sin(2 * np.pi * (2 * k - 1) * f * t)
                approximation += harmonic
            approximation *= (8 / np.pi ** 2)

        fig = go.Figure()

        # Target waveform
        fig.add_trace(go.Scatter(
            x=t, y=target,
            mode='lines',
            name='Target',
            line=dict(color='lightgray', width=3, dash='dash')
        ))

        # Fourier approximation
        fig.add_trace(go.Scatter(
            x=t, y=approximation,
            mode='lines',
            name=f'Approximation ({n} harmonics)',
            line=dict(color='blue', width=2)
        ))

        fig.update_layout(
            title=f"{title} - Fourier Series Approximation",
            xaxis_title="Time (s)",
            yaxis_title="Amplitude",
            height=400,
            showlegend=True
        )

        return ui.HTML(fig.to_html(include_plotlyjs="cdn"))

    @output
    @render.ui
    def harmonics_plot():
        waveform = input.waveform()
        n = input.n_harmonics()
        f = input.frequency()

        # Calculate harmonic amplitudes
        if waveform == "square":
            k_values = np.arange(1, n + 1)
            amplitudes = (4 / np.pi) / (2 * k_values - 1)
            frequencies = (2 * k_values - 1) * f
        elif waveform == "sawtooth":
            k_values = np.arange(1, n + 1)
            amplitudes = (2 / np.pi) / k_values
            frequencies = k_values * f
        else:  # triangle
            k_values = np.arange(1, n + 1)
            amplitudes = (8 / np.pi ** 2) / (2 * k_values - 1) ** 2
            frequencies = (2 * k_values - 1) * f

        fig = go.Figure()

        fig.add_trace(go.Bar(
            x=frequencies,
            y=amplitudes,
            name='Harmonic Amplitudes',
            marker=dict(color='steelblue')
        ))

        fig.update_layout(
            title="Harmonic Frequency Spectrum",
            xaxis_title="Frequency (Hz)",
            yaxis_title="Amplitude",
            height=400,
            showlegend=False
        )

        return ui.HTML(fig.to_html(include_plotlyjs="cdn"))

app = App(app_ui, server)
`
};
