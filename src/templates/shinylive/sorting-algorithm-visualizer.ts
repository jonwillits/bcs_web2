import { ShinyliveTemplate, ShinyliveCategory } from '@/types/shinylive';

export const sortingAlgorithmVisualizerTemplate: ShinyliveTemplate = {
  id: 'sorting-algorithm-visualizer',
  name: 'Sorting Algorithm Visualizer',
  description: 'Step-by-step visualization of classic sorting algorithms with performance metrics and interactive controls. Perfect for teaching algorithmic thinking.',
  category: ShinyliveCategory.ALGORITHMS,
  version: '1.0.0',
  tags: ['algorithms', 'sorting', 'visualization', 'education', 'computer-science'],
  requirements: ['plotly', 'numpy'],
  features: [
    'Multiple sorting algorithms (bubble, selection, insertion, quick, merge)',
    'Step-by-step execution visualization',
    'Performance statistics (comparisons, swaps, time complexity)',
    'Adjustable array size',
    'Random data generation'
  ],
  sourceCode: `from shiny import App, render, ui, reactive
import plotly.graph_objects as go
import numpy as np
import time

app_ui = ui.page_fluid(
    ui.h2("Sorting Algorithm Visualizer"),
    ui.layout_sidebar(
        ui.sidebar(
            ui.h4("Algorithm Settings"),
            ui.input_select(
                "algorithm",
                "Sorting Algorithm",
                choices={
                    "bubble": "Bubble Sort",
                    "selection": "Selection Sort",
                    "insertion": "Insertion Sort",
                    "quick": "Quick Sort",
                    "merge": "Merge Sort"
                }
            ),
            ui.input_slider("array_size", "Array Size", 5, 50, 20, step=5),
            ui.input_action_button("generate", "Generate New Array", class_="btn-secondary"),
            ui.input_action_button("sort", "Sort Array", class_="btn-primary"),

            ui.hr(),
            ui.h4("Visualization Speed"),
            ui.input_slider("delay", "Animation Delay (ms)", 50, 1000, 200, step=50),
            width=300
        ),
        ui.card(
            ui.card_header("Array Visualization"),
            ui.output_ui("array_plot")
        ),
        ui.card(
            ui.card_header("Performance Metrics"),
            ui.output_text_verbatim("metrics")
        )
    )
)

def server(input, output, session):
    # Reactive values
    current_array = reactive.Value(None)
    sort_stats = reactive.Value({
        "comparisons": 0,
        "swaps": 0,
        "time": 0
    })

    @reactive.Effect
    @reactive.event(input.generate)
    def generate_array():
        arr = np.random.randint(1, 100, size=input.array_size())
        current_array.set(arr.tolist())
        sort_stats.set({"comparisons": 0, "swaps": 0, "time": 0})

    # Initialize with random array
    @reactive.Effect
    def _():
        if current_array() is None:
            arr = np.random.randint(1, 100, size=input.array_size())
            current_array.set(arr.tolist())

    @reactive.Effect
    @reactive.event(input.sort)
    def perform_sort():
        arr = current_array().copy()
        algorithm = input.algorithm()

        start_time = time.time()
        comparisons = 0
        swaps = 0

        if algorithm == "bubble":
            arr, comparisons, swaps = bubble_sort(arr)
        elif algorithm == "selection":
            arr, comparisons, swaps = selection_sort(arr)
        elif algorithm == "insertion":
            arr, comparisons, swaps = insertion_sort(arr)
        elif algorithm == "quick":
            arr, comparisons, swaps = quick_sort(arr, 0, len(arr) - 1, 0, 0)
        else:  # merge
            arr, comparisons, swaps = merge_sort(arr, 0, 0)

        end_time = time.time()

        current_array.set(arr)
        sort_stats.set({
            "comparisons": comparisons,
            "swaps": swaps,
            "time": (end_time - start_time) * 1000
        })

    @output
    @render.ui
    def array_plot():
        arr = current_array()
        if arr is None:
            return ui.p("Click 'Generate New Array' to start")

        fig = go.Figure()
        fig.add_trace(go.Bar(
            x=list(range(len(arr))),
            y=arr,
            marker=dict(
                color=arr,
                colorscale='Viridis',
                showscale=True
            )
        ))

        fig.update_layout(
            title=f"Array of {len(arr)} Elements",
            xaxis_title="Index",
            yaxis_title="Value",
            height=400,
            showlegend=False
        )

        return ui.HTML(fig.to_html(include_plotlyjs="cdn"))

    @output
    @render.text
    def metrics():
        arr = current_array()
        if arr is None:
            return "Generate an array to see metrics"

        stats = sort_stats()
        algorithm = input.algorithm()

        # Determine time complexity
        n = len(arr)
        if algorithm in ["bubble", "selection", "insertion"]:
            time_complexity = "O(n²)"
            space_complexity = "O(1)"
        elif algorithm == "quick":
            time_complexity = "O(n log n) average, O(n²) worst"
            space_complexity = "O(log n)"
        else:  # merge
            time_complexity = "O(n log n)"
            space_complexity = "O(n)"

        is_sorted = all(arr[i] <= arr[i + 1] for i in range(len(arr) - 1))

        return f"""
Algorithm: {input.algorithm().title()} Sort
Array Size: {n}
Status: {"✓ SORTED" if is_sorted else "UNSORTED"}

Performance:
  Comparisons: {stats['comparisons']}
  Swaps: {stats['swaps']}
  Execution Time: {stats['time']:.2f} ms

Complexity:
  Time: {time_complexity}
  Space: {space_complexity}

Array Stats:
  Min: {min(arr)}
  Max: {max(arr)}
  Mean: {sum(arr) / len(arr):.2f}
        """

# Sorting algorithm implementations
def bubble_sort(arr):
    n = len(arr)
    comparisons = 0
    swaps = 0
    for i in range(n):
        for j in range(0, n - i - 1):
            comparisons += 1
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swaps += 1
    return arr, comparisons, swaps

def selection_sort(arr):
    n = len(arr)
    comparisons = 0
    swaps = 0
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            comparisons += 1
            if arr[j] < arr[min_idx]:
                min_idx = j
        if min_idx != i:
            arr[i], arr[min_idx] = arr[min_idx], arr[i]
            swaps += 1
    return arr, comparisons, swaps

def insertion_sort(arr):
    comparisons = 0
    swaps = 0
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            comparisons += 1
            arr[j + 1] = arr[j]
            swaps += 1
            j -= 1
        comparisons += 1
        arr[j + 1] = key
    return arr, comparisons, swaps

def quick_sort(arr, low, high, comparisons, swaps):
    if low < high:
        arr, pi, comparisons, swaps = partition(arr, low, high, comparisons, swaps)
        arr, comparisons, swaps = quick_sort(arr, low, pi - 1, comparisons, swaps)
        arr, comparisons, swaps = quick_sort(arr, pi + 1, high, comparisons, swaps)
    return arr, comparisons, swaps

def partition(arr, low, high, comparisons, swaps):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        comparisons += 1
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
            swaps += 1
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    swaps += 1
    return arr, i + 1, comparisons, swaps

def merge_sort(arr, comparisons, swaps):
    if len(arr) > 1:
        mid = len(arr) // 2
        L = arr[:mid]
        R = arr[mid:]

        L, comparisons, swaps = merge_sort(L, comparisons, swaps)
        R, comparisons, swaps = merge_sort(R, comparisons, swaps)

        i = j = k = 0

        while i < len(L) and j < len(R):
            comparisons += 1
            if L[i] < R[j]:
                arr[k] = L[i]
                i += 1
            else:
                arr[k] = R[j]
                j += 1
            swaps += 1
            k += 1

        while i < len(L):
            arr[k] = L[i]
            i += 1
            k += 1
            swaps += 1

        while j < len(R):
            arr[k] = R[j]
            j += 1
            k += 1
            swaps += 1

    return arr, comparisons, swaps

app = App(app_ui, server)
`
};
