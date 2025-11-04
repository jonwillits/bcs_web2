"""
Demo 2: Neural Network Playground
Purpose: Test complex visualization similar to TensorFlow Playground
Features: Interactive network training, decision boundaries, real-time loss visualization
"""

from shiny import App, render, ui, reactive
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.datasets import make_moons, make_circles, make_classification

# UI Definition
app_ui = ui.page_fluid(
    ui.panel_title("Neural Network Playground"),

    ui.layout_sidebar(
        ui.sidebar(
            ui.h3("Network Configuration"),

            ui.input_select(
                "dataset",
                "Dataset",
                choices={
                    "moons": "Two Moons",
                    "circles": "Concentric Circles",
                    "linear": "Linear Separable"
                }
            ),

            ui.input_slider(
                "noise",
                "Noise Level",
                min=0,
                max=0.5,
                value=0.1,
                step=0.05
            ),

            ui.input_slider(
                "hidden_layers",
                "Hidden Layer Size",
                min=2,
                max=20,
                value=10,
                step=1
            ),

            ui.input_select(
                "activation",
                "Activation Function",
                choices={
                    "relu": "ReLU",
                    "tanh": "Tanh",
                    "logistic": "Sigmoid"
                }
            ),

            ui.input_slider(
                "learning_rate",
                "Learning Rate",
                min=0.001,
                max=0.1,
                value=0.01,
                step=0.001
            ),

            ui.hr(),

            ui.input_action_button(
                "train",
                "Train Network",
                class_="btn-primary"
            ),

            ui.input_action_button(
                "reset",
                "Reset",
                class_="btn-secondary"
            ),

            ui.hr(),

            ui.output_text_verbatim("training_status"),

            width=300
        ),

        ui.card(
            ui.card_header("Decision Boundary"),
            ui.output_ui("decision_boundary")
        ),

        ui.card(
            ui.card_header("Training Progress"),
            ui.output_ui("training_plot")
        )
    )
)


# Server Logic
def server(input, output, session):
    # Reactive values to store training state
    model = reactive.Value(None)
    loss_history = reactive.Value([])
    accuracy_history = reactive.Value([])
    is_trained = reactive.Value(False)

    def generate_dataset():
        """Generate dataset based on selection"""
        dataset_type = input.dataset()
        noise = input.noise()
        n_samples = 300

        if dataset_type == "moons":
            X, y = make_moons(n_samples=n_samples, noise=noise, random_state=42)
        elif dataset_type == "circles":
            X, y = make_circles(n_samples=n_samples, noise=noise, factor=0.5, random_state=42)
        else:  # linear
            X, y = make_classification(
                n_samples=n_samples,
                n_features=2,
                n_redundant=0,
                n_informative=2,
                n_clusters_per_class=1,
                flip_y=noise * 0.5,
                random_state=42
            )

        return X, y

    @reactive.Effect
    @reactive.event(input.train)
    def train_network():
        """Train the neural network"""
        X, y = generate_dataset()

        # Create model
        clf = MLPClassifier(
            hidden_layer_sizes=(input.hidden_layers(),),
            activation=input.activation(),
            learning_rate_init=input.learning_rate(),
            max_iter=200,
            random_state=42,
            warm_start=False
        )

        # Train model
        clf.fit(X, y)

        # Store model and training history
        model.set(clf)
        loss_history.set(clf.loss_curve_)
        score = clf.score(X, y)
        accuracy_history.set([score])
        is_trained.set(True)

    @reactive.Effect
    @reactive.event(input.reset)
    def reset_network():
        """Reset the network"""
        model.set(None)
        loss_history.set([])
        accuracy_history.set([])
        is_trained.set(False)

    @output
    @render.ui
    def decision_boundary():
        """Plot decision boundary"""
        X, y = generate_dataset()

        if not is_trained():
            # Just show the data points
            fig = go.Figure()

            # Plot data points
            for class_value in [0, 1]:
                mask = y == class_value
                fig.add_trace(go.Scatter(
                    x=X[mask, 0],
                    y=X[mask, 1],
                    mode='markers',
                    name=f'Class {class_value}',
                    marker=dict(
                        size=8,
                        opacity=0.7
                    )
                ))

            fig.update_layout(
                title="Dataset (Train the network to see decision boundary)",
                xaxis_title="Feature 1",
                yaxis_title="Feature 2",
                height=400,
                template="plotly_white"
            )

        else:
            # Show decision boundary
            clf = model()

            # Create mesh
            h = 0.02
            x_min, x_max = X[:, 0].min() - 0.5, X[:, 0].max() + 0.5
            y_min, y_max = X[:, 1].min() - 0.5, X[:, 1].max() + 0.5
            xx, yy = np.meshgrid(
                np.arange(x_min, x_max, h),
                np.arange(y_min, y_max, h)
            )

            # Predict on mesh
            Z = clf.predict(np.c_[xx.ravel(), yy.ravel()])
            Z = Z.reshape(xx.shape)

            fig = go.Figure()

            # Add contour for decision boundary
            fig.add_trace(go.Contour(
                x=xx[0],
                y=yy[:, 0],
                z=Z,
                colorscale='RdBu',
                opacity=0.3,
                showscale=False,
                contours=dict(
                    start=0,
                    end=1,
                    size=0.5
                )
            ))

            # Plot data points
            for class_value in [0, 1]:
                mask = y == class_value
                fig.add_trace(go.Scatter(
                    x=X[mask, 0],
                    y=X[mask, 1],
                    mode='markers',
                    name=f'Class {class_value}',
                    marker=dict(
                        size=8,
                        opacity=0.8,
                        line=dict(width=1, color='white')
                    )
                ))

            fig.update_layout(
                title="Decision Boundary",
                xaxis_title="Feature 1",
                yaxis_title="Feature 2",
                height=400,
                template="plotly_white"
            )

        return ui.HTML(fig.to_html(include_plotlyjs="cdn"))

    @output
    @render.ui
    def training_plot():
        """Plot training loss curve"""
        losses = loss_history()

        if not losses:
            # Empty state
            fig = go.Figure()
            fig.add_annotation(
                text="Train the network to see loss curve",
                xref="paper",
                yref="paper",
                x=0.5,
                y=0.5,
                showarrow=False,
                font=dict(size=16)
            )
            fig.update_layout(
                height=300,
                template="plotly_white"
            )
        else:
            fig = go.Figure()

            fig.add_trace(go.Scatter(
                y=losses,
                mode='lines+markers',
                name='Loss',
                line=dict(color='rgb(214, 39, 40)', width=2)
            ))

            fig.update_layout(
                title="Training Loss Over Time",
                xaxis_title="Iteration",
                yaxis_title="Loss",
                height=300,
                template="plotly_white"
            )

        return ui.HTML(fig.to_html(include_plotlyjs="cdn"))

    @output
    @render.text
    def training_status():
        """Display training status"""
        if not is_trained():
            return """
Status: Not Trained

Click 'Train Network' to start!
"""
        else:
            clf = model()
            X, y = generate_dataset()
            accuracy = clf.score(X, y)
            n_iter = clf.n_iter_

            return f"""
Status: Trained ✓

Iterations: {n_iter}
Accuracy: {accuracy * 100:.1f}%
Hidden Layers: {input.hidden_layers()}
Activation: {input.activation()}
"""


# Create app
app = App(app_ui, server)
