import { ShinyliveTemplate, ShinyliveCategory } from '@/types/shinylive';

export const physicsProjectileMotionTemplate: ShinyliveTemplate = {
  id: 'physics-projectile-motion',
  name: 'Projectile Motion Simulator',
  description: 'Interactive physics simulation of projectile motion with adjustable initial conditions, gravity, and air resistance. Visualize trajectories and study kinematics.',
  category: ShinyliveCategory.PHYSICS,
  version: '1.0.0',
  tags: ['physics', 'simulation', 'kinematics', 'projectile', 'mechanics'],
  requirements: ['plotly', 'numpy'],
  features: [
    'Adjustable launch angle and velocity',
    'Variable gravity settings',
    'Air resistance toggle',
    'Real-time trajectory visualization',
    'Calculated flight metrics (range, max height, time)'
  ],
  sourceCode: `from shiny import App, render, ui
import plotly.graph_objects as go
import numpy as np

app_ui = ui.page_fluid(
    ui.h2("Projectile Motion Simulator"),
    ui.layout_sidebar(
        ui.sidebar(
            ui.h4("Launch Parameters"),
            ui.input_slider("velocity", "Initial Velocity (m/s)", 5, 50, 20, step=1),
            ui.input_slider("angle", "Launch Angle (degrees)", 0, 90, 45, step=5),

            ui.hr(),
            ui.h4("Environment"),
            ui.input_slider("gravity", "Gravity (m/s²)", 1, 20, 9.8, step=0.1),
            ui.input_checkbox("air_resistance", "Include Air Resistance", False),
            ui.input_slider("drag_coeff", "Drag Coefficient", 0, 1, 0.1, step=0.05),

            ui.hr(),
            ui.input_action_button("launch", "Launch Projectile", class_="btn-primary"),
            width=300
        ),
        ui.card(
            ui.card_header("Trajectory Visualization"),
            ui.output_ui("trajectory_plot")
        ),
        ui.card(
            ui.card_header("Flight Metrics"),
            ui.output_text_verbatim("metrics")
        )
    )
)

def server(input, output, session):
    @output
    @render.ui
    def trajectory_plot():
        v0 = input.velocity()
        angle_deg = input.angle()
        g = input.gravity()
        has_drag = input.air_resistance()
        drag = input.drag_coeff() if has_drag else 0

        angle_rad = np.radians(angle_deg)
        v0x = v0 * np.cos(angle_rad)
        v0y = v0 * np.sin(angle_rad)

        if not has_drag:
            # No air resistance - analytical solution
            t_flight = 2 * v0y / g
            t = np.linspace(0, t_flight, 100)
            x = v0x * t
            y = v0y * t - 0.5 * g * t**2
        else:
            # With air resistance - numerical integration
            dt = 0.01
            t = [0]
            x = [0]
            y = [0]
            vx = v0x
            vy = v0y

            while y[-1] >= 0 or len(y) == 1:
                # Air resistance force proportional to velocity squared
                v = np.sqrt(vx**2 + vy**2)
                ax = -drag * v * vx
                ay = -g - drag * v * vy

                vx += ax * dt
                vy += ay * dt

                x.append(x[-1] + vx * dt)
                y.append(y[-1] + vy * dt)
                t.append(t[-1] + dt)

            x = np.array(x)
            y = np.array(y)
            t = np.array(t)

        # Create plot
        fig = go.Figure()

        fig.add_trace(go.Scatter(
            x=x,
            y=y,
            mode='lines',
            name='Trajectory',
            line=dict(color='blue', width=3)
        ))

        # Add launch point
        fig.add_trace(go.Scatter(
            x=[0],
            y=[0],
            mode='markers',
            name='Launch',
            marker=dict(size=12, color='green', symbol='circle')
        ))

        # Add landing point
        fig.add_trace(go.Scatter(
            x=[x[-1]],
            y=[0],
            mode='markers',
            name='Landing',
            marker=dict(size=12, color='red', symbol='x')
        ))

        # Add max height point
        max_height_idx = np.argmax(y)
        fig.add_trace(go.Scatter(
            x=[x[max_height_idx]],
            y=[y[max_height_idx]],
            mode='markers',
            name='Max Height',
            marker=dict(size=10, color='orange', symbol='diamond')
        ))

        fig.update_layout(
            title=f"Projectile Motion (v₀={v0} m/s, θ={angle_deg}°)",
            xaxis_title="Horizontal Distance (m)",
            yaxis_title="Vertical Height (m)",
            height=500,
            showlegend=True,
            hovermode='closest'
        )

        # Equal aspect ratio for realistic trajectory
        fig.update_yaxes(scaleanchor="x", scaleratio=1)

        return ui.HTML(fig.to_html(include_plotlyjs="cdn"))

    @output
    @render.text
    def metrics():
        v0 = input.velocity()
        angle_deg = input.angle()
        g = input.gravity()
        has_drag = input.air_resistance()

        angle_rad = np.radians(angle_deg)
        v0x = v0 * np.cos(angle_rad)
        v0y = v0 * np.sin(angle_rad)

        if not has_drag:
            # Analytical calculations
            t_flight = 2 * v0y / g
            range_x = v0x * t_flight
            max_height = (v0y ** 2) / (2 * g)
            t_max_height = v0y / g
        else:
            # Numerical simulation
            drag = input.drag_coeff()
            dt = 0.01
            t = 0
            x = 0
            y = 0
            vx = v0x
            vy = v0y
            max_height = 0

            while y >= 0 or t == 0:
                v = np.sqrt(vx**2 + vy**2)
                ax = -drag * v * vx
                ay = -g - drag * v * vy

                vx += ax * dt
                vy += ay * dt

                x += vx * dt
                y += vy * dt
                t += dt

                if y > max_height:
                    max_height = y
                    t_max_height = t

            t_flight = t
            range_x = x

        return f"""
Launch Parameters:
==================
Initial Velocity: {v0} m/s
Launch Angle: {angle_deg}°
Gravity: {g} m/s²
Air Resistance: {"Yes (k=" + str(input.drag_coeff()) + ")" if has_drag else "No"}

Flight Metrics:
===============
Range: {range_x:.2f} m
Max Height: {max_height:.2f} m
Time to Max Height: {t_max_height:.2f} s
Total Flight Time: {t_flight:.2f} s

Velocity Components:
====================
Horizontal (v₀ₓ): {v0x:.2f} m/s
Vertical (v₀ᵧ): {v0y:.2f} m/s

Tips:
=====
• 45° gives maximum range (without air resistance)
• Higher angles = greater max height
• Air resistance reduces range and max height
        """

app = App(app_ui, server)
`
};
