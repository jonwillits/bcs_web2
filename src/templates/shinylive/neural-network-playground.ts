import { ShinyliveTemplate, ShinyliveCategory } from '@/types/shinylive';

export const neuralNetworkPlaygroundTemplate: ShinyliveTemplate = {
  id: 'neural-network-playground',
  name: 'Neural Network Playground',
  description: 'Interactive neural network training with multiple datasets, configurable architecture, and real-time decision boundary visualization. Inspired by TensorFlow Playground.',
  category: ShinyliveCategory.NEURAL_NETWORKS,
  version: '1.0.0',
  tags: ['machine-learning', 'neural-networks', 'scikit-learn', 'plotly', 'classification'],
  requirements: ['plotly', 'numpy', 'scikit-learn'],
  features: [
    'Multiple datasets (moons, circles, linear, XOR)',
    'Configurable network architecture',
    'Multiple activation functions',
    'Real-time training with decision boundaries',
    'Loss curve visualization',
    'Accuracy metrics display'
  ],
  sourceCode: `from shiny import App, render, ui, reactive
import plotly.graph_objects as go
import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.datasets import make_moons, make_circles, make_classification

app_ui = ui.page_fluid(
    ui.h2("Neural Network Playground"),
    ui.layout_sidebar(
        ui.sidebar(
            ui.h4("Dataset"),
            ui.input_select(
                "dataset",
                "Choose Dataset",
                choices={
                    "moons": "Moons (Non-linear)",
                    "circles": "Circles (Non-linear)",
                    "linear": "Linear Separable",
                    "xor": "XOR Pattern"
                }
            ),
            ui.input_slider("noise", "Noise Level", 0, 0.5, 0.1, step=0.05),
            ui.input_slider("n_samples", "Training Samples", 100, 500, 200, step=50),

            ui.hr(),
            ui.h4("Network Architecture"),
            ui.input_slider("hidden_layers", "Hidden Layer Size", 2, 20, 10, step=1),
            ui.input_select(
                "activation",
                "Activation Function",
                choices={
                    "relu": "ReLU",
                    "tanh": "Tanh",
                    "logistic": "Sigmoid"
                }
            ),
            ui.input_slider("learning_rate", "Learning Rate", 0.001, 0.1, 0.01, step=0.001),

            ui.hr(),
            ui.input_action_button("train", "Train Network", class_="btn-primary"),
            width=300
        ),
        ui.layout_columns(
            ui.card(
                ui.card_header("Decision Boundary"),
                ui.output_ui("decision_plot")
            ),
            ui.card(
                ui.card_header("Training Progress"),
                ui.output_ui("loss_plot")
            ),
            col_widths=[6, 6]
        ),
        ui.card(
            ui.card_header("Model Performance"),
            ui.output_text_verbatim("metrics")
        )
    )
)

def server(input, output, session):
    # Reactive values to store training results
    trained_model = reactive.Value(None)
    training_history = reactive.Value(None)
    X_data = reactive.Value(None)
    y_data = reactive.Value(None)

    @reactive.Effect
    @reactive.event(input.train)
    def train_network():
        # Generate dataset
        n = input.n_samples()
        noise = input.noise()

        if input.dataset() == "moons":
            X, y = make_moons(n_samples=n, noise=noise, random_state=42)
        elif input.dataset() == "circles":
            X, y = make_circles(n_samples=n, noise=noise, factor=0.5, random_state=42)
        elif input.dataset() == "xor":
            X, y = make_classification(
                n_samples=n, n_features=2, n_redundant=0, n_informative=2,
                n_clusters_per_class=1, flip_y=noise, random_state=42
            )
        else:  # linear
            X, y = make_classification(
                n_samples=n, n_features=2, n_redundant=0, n_informative=2,
                n_clusters_per_class=1, flip_y=0, random_state=42
            )

        X_data.set(X)
        y_data.set(y)

        # Train neural network
        clf = MLPClassifier(
            hidden_layer_sizes=(input.hidden_layers(),),
            activation=input.activation(),
            learning_rate_init=input.learning_rate(),
            max_iter=200,
            random_state=42
        )

        clf.fit(X, y)
        trained_model.set(clf)
        training_history.set(clf.loss_curve_)

    @output
    @render.ui
    def decision_plot():
        model = trained_model()
        if model is None:
            return ui.p("Click 'Train Network' to see decision boundary")

        X = X_data()
        y = y_data()

        # Create mesh for decision boundary
        h = 0.02
        x_min, x_max = X[:, 0].min() - 0.5, X[:, 0].max() + 0.5
        y_min, y_max = X[:, 1].min() - 0.5, X[:, 1].max() + 0.5
        xx, yy = np.meshgrid(np.arange(x_min, x_max, h), np.arange(y_min, y_max, h))

        Z = model.predict(np.c_[xx.ravel(), yy.ravel()])
        Z = Z.reshape(xx.shape)

        # Create plot
        fig = go.Figure()

        # Add decision boundary
        fig.add_trace(go.Contour(
            x=xx[0],
            y=yy[:, 0],
            z=Z,
            colorscale='RdBu',
            opacity=0.3,
            showscale=False,
            hoverinfo='skip'
        ))

        # Add data points
        colors = ['red' if label == 0 else 'blue' for label in y]
        fig.add_trace(go.Scatter(
            x=X[:, 0],
            y=X[:, 1],
            mode='markers',
            marker=dict(
                size=8,
                color=colors,
                line=dict(color='white', width=1)
            ),
            name='Training Data'
        ))

        fig.update_layout(
            title="Decision Boundary",
            xaxis_title="Feature 1",
            yaxis_title="Feature 2",
            height=400,
            showlegend=False
        )

        return ui.HTML(fig.to_html(include_plotlyjs="cdn"))

    @output
    @render.ui
    def loss_plot():
        history = training_history()
        if history is None:
            return ui.p("Click 'Train Network' to see training progress")

        fig = go.Figure()
        fig.add_trace(go.Scatter(
            y=history,
            mode='lines',
            name='Loss',
            line=dict(color='purple', width=2)
        ))

        fig.update_layout(
            title="Training Loss Curve",
            xaxis_title="Iteration",
            yaxis_title="Loss",
            height=400,
            showlegend=False
        )

        return ui.HTML(fig.to_html(include_plotlyjs="cdn"))

    @output
    @render.text
    def metrics():
        model = trained_model()
        if model is None:
            return "Train a network to see performance metrics"

        X = X_data()
        y = y_data()

        accuracy = model.score(X, y)
        n_iter = len(training_history())
        final_loss = training_history()[-1]

        return f"""
Model Performance:
==================
Architecture: {input.hidden_layers()} hidden neurons
Activation: {input.activation()}
Learning Rate: {input.learning_rate():.4f}

Training Results:
  Accuracy: {accuracy * 100:.2f}%
  Iterations: {n_iter}
  Final Loss: {final_loss:.4f}

Dataset:
  Type: {input.dataset()}
  Samples: {input.n_samples()}
  Noise: {input.noise():.2f}
        """

app = App(app_ui, server)
`
};
