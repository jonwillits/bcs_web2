"""
Demo 3: Sorting Algorithm Visualization
Purpose: Test animation and step-by-step execution
Features: Multiple algorithms, speed control, visual step-through
"""

from shiny import App, render, ui, reactive
import plotly.graph_objects as go
import numpy as np
import time

# UI Definition
app_ui = ui.page_fluid(
    ui.panel_title("Sorting Algorithm Visualizer"),

    ui.layout_sidebar(
        ui.sidebar(
            ui.h3("Configuration"),

            ui.input_select(
                "algorithm",
                "Algorithm",
                choices={
                    "bubble": "Bubble Sort",
                    "selection": "Selection Sort",
                    "insertion": "Insertion Sort",
                    "quick": "Quick Sort (simplified)"
                }
            ),

            ui.input_slider(
                "array_size",
                "Array Size",
                min=5,
                max=50,
                value=20,
                step=5
            ),

            ui.input_select(
                "initial_state",
                "Initial State",
                choices={
                    "random": "Random",
                    "reversed": "Reversed",
                    "nearly_sorted": "Nearly Sorted"
                }
            ),

            ui.hr(),

            ui.input_action_button(
                "generate",
                "Generate New Array",
                class_="btn-secondary"
            ),

            ui.input_action_button(
                "step",
                "Single Step",
                class_="btn-info"
            ),

            ui.input_action_button(
                "sort",
                "Sort (Animated)",
                class_="btn-primary"
            ),

            ui.input_action_button(
                "reset",
                "Reset",
                class_="btn-secondary"
            ),

            ui.hr(),

            ui.output_text_verbatim("status"),

            width=300
        ),

        ui.card(
            ui.card_header("Array Visualization"),
            ui.output_ui("visualization")
        ),

        ui.card(
            ui.card_header("Algorithm Stats"),
            ui.output_text_verbatim("stats")
        )
    )
)


# Server Logic
def server(input, output, session):
    # Reactive values
    current_array = reactive.Value([])
    comparison_count = reactive.Value(0)
    swap_count = reactive.Value(0)
    current_step = reactive.Value(0)
    is_sorted = reactive.Value(False)
    sorting_steps = reactive.Value([])
    highlighted_indices = reactive.Value([])

    def generate_array():
        """Generate array based on configuration"""
        size = input.array_size()
        state = input.initial_state()

        if state == "random":
            arr = list(np.random.randint(1, 100, size=size))
        elif state == "reversed":
            arr = list(range(size, 0, -1))
        else:  # nearly_sorted
            arr = list(range(1, size + 1))
            # Shuffle a few elements
            for _ in range(size // 5):
                i, j = np.random.randint(0, size, 2)
                arr[i], arr[j] = arr[j], arr[i]

        return arr

    def bubble_sort_steps(arr):
        """Generate all steps for bubble sort"""
        arr = arr.copy()
        steps = [arr.copy()]
        comparisons = 0
        swaps = 0

        n = len(arr)
        for i in range(n):
            for j in range(0, n - i - 1):
                comparisons += 1
                if arr[j] > arr[j + 1]:
                    arr[j], arr[j + 1] = arr[j + 1], arr[j]
                    swaps += 1
                    steps.append(arr.copy())

        return steps, comparisons, swaps

    def selection_sort_steps(arr):
        """Generate all steps for selection sort"""
        arr = arr.copy()
        steps = [arr.copy()]
        comparisons = 0
        swaps = 0

        for i in range(len(arr)):
            min_idx = i
            for j in range(i + 1, len(arr)):
                comparisons += 1
                if arr[j] < arr[min_idx]:
                    min_idx = j

            if min_idx != i:
                arr[i], arr[min_idx] = arr[min_idx], arr[i]
                swaps += 1
                steps.append(arr.copy())

        return steps, comparisons, swaps

    def insertion_sort_steps(arr):
        """Generate all steps for insertion sort"""
        arr = arr.copy()
        steps = [arr.copy()]
        comparisons = 0
        swaps = 0

        for i in range(1, len(arr)):
            key = arr[i]
            j = i - 1
            while j >= 0 and arr[j] > key:
                comparisons += 1
                arr[j + 1] = arr[j]
                swaps += 1
                steps.append(arr.copy())
                j -= 1
            comparisons += 1
            arr[j + 1] = key
            if j + 1 != i:
                steps.append(arr.copy())

        return steps, comparisons, swaps

    @reactive.Effect
    @reactive.event(input.generate, ignore_none=True, ignore_init=False)
    def handle_generate():
        """Generate new array"""
        arr = generate_array()
        current_array.set(arr)
        comparison_count.set(0)
        swap_count.set(0)
        current_step.set(0)
        is_sorted.set(False)
        sorting_steps.set([])
        highlighted_indices.set([])

    @reactive.Effect
    @reactive.event(input.reset)
    def handle_reset():
        """Reset to initial array"""
        if sorting_steps():
            current_array.set(sorting_steps()[0])
            current_step.set(0)
            comparison_count.set(0)
            swap_count.set(0)
            is_sorted.set(False)

    @reactive.Effect
    @reactive.event(input.step)
    def handle_step():
        """Execute single step"""
        if not sorting_steps():
            # Generate steps
            algorithm = input.algorithm()
            arr = current_array()

            if algorithm == "bubble":
                steps, comps, swaps = bubble_sort_steps(arr)
            elif algorithm == "selection":
                steps, comps, swaps = selection_sort_steps(arr)
            elif algorithm == "insertion":
                steps, comps, swaps = insertion_sort_steps(arr)
            else:  # quick (simplified to insertion for now)
                steps, comps, swaps = insertion_sort_steps(arr)

            sorting_steps.set(steps)
            comparison_count.set(comps)
            swap_count.set(swaps)

        # Advance to next step
        steps = sorting_steps()
        step = current_step()

        if step < len(steps) - 1:
            step += 1
            current_step.set(step)
            current_array.set(steps[step])

            if step == len(steps) - 1:
                is_sorted.set(True)

    @reactive.Effect
    @reactive.event(input.sort)
    def handle_sort():
        """Sort with animation (simulated by showing final state)"""
        algorithm = input.algorithm()
        arr = current_array()

        if algorithm == "bubble":
            steps, comps, swaps = bubble_sort_steps(arr)
        elif algorithm == "selection":
            steps, comps, swaps = selection_sort_steps(arr)
        elif algorithm == "insertion":
            steps, comps, swaps = insertion_sort_steps(arr)
        else:
            steps, comps, swaps = insertion_sort_steps(arr)

        sorting_steps.set(steps)
        comparison_count.set(comps)
        swap_count.set(swaps)
        current_step.set(len(steps) - 1)
        current_array.set(steps[-1])
        is_sorted.set(True)

    @output
    @render.ui
    def visualization():
        """Visualize the array as a bar chart"""
        arr = current_array()

        if not arr:
            arr = generate_array()
            current_array.set(arr)

        # Create bar chart
        colors = ['rgb(31, 119, 180)'] * len(arr)

        # Highlight sorted elements in green
        if is_sorted():
            colors = ['rgb(44, 160, 44)'] * len(arr)

        fig = go.Figure()

        fig.add_trace(go.Bar(
            x=list(range(len(arr))),
            y=arr,
            marker=dict(color=colors),
            text=arr,
            textposition='outside'
        ))

        fig.update_layout(
            title=f"{input.algorithm().replace('_', ' ').title()} - Step {current_step()}",
            xaxis_title="Index",
            yaxis_title="Value",
            height=400,
            showlegend=False,
            template="plotly_white"
        )

        return ui.HTML(fig.to_html(include_plotlyjs="cdn"))

    @output
    @render.text
    def status():
        """Show current status"""
        if is_sorted():
            return f"""
Status: ✓ SORTED

Algorithm: {input.algorithm().title()}
Array Size: {len(current_array())}
"""
        else:
            return f"""
Status: Ready

Algorithm: {input.algorithm().title()}
Array Size: {len(current_array())}

Click 'Sort' or 'Step' to begin
"""

    @output
    @render.text
    def stats():
        """Show algorithm statistics"""
        return f"""
Algorithm Stats:
---------------
Current Step: {current_step()}
Total Steps: {len(sorting_steps()) if sorting_steps() else 0}
Comparisons: {comparison_count()}
Swaps: {swap_count()}

Time Complexity: O(n²) for most algorithms
Space Complexity: O(1)
"""


# Create app
app = App(app_ui, server)
