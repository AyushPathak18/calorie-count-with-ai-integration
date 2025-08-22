import React, { useState, useEffect } from "react";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function App() {
  const [food, setFood] = useState("");
  const [calories, setCalories] = useState([]);
  const [day, setDay] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);

  useEffect(() => {
    const savedData = localStorage.getItem("calorieData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setCalories(parsed);
      setDay(parsed.length + 1);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("calorieData", JSON.stringify(calories));
  }, [calories]);

  const preprocessInput = (input) => input.replace(/gm/gi, "g");

  const fetchCalories = async () => {
    if (!food) return;
    setLoading(true);

    try {
      const processedFood = preprocessInput(food);
      const res = await fetch("https://trackapi.nutritionix.com/v2/natural/nutrients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app-id": "a10c0a04",
          "x-app-key": "2ecc31fe8ac1828dda02bfa847aff42e",
        },
        body: JSON.stringify({ query: processedFood }),
      });

      const data = await res.json();

      if (data.foods && data.foods.length > 0) {
        const totalCalories = data.foods.reduce((sum, f) => sum + f.nf_calories, 0);
        const totalProtein = data.foods.reduce((sum, f) => sum + (f.nf_protein || 0), 0);
        const totalCarbs = data.foods.reduce(
          (sum, f) => sum + (f.nf_total_carbohydrate || 0),
          0
        );
        const totalFat = data.foods.reduce((sum, f) => sum + (f.nf_total_fat || 0), 0);

        setCalories([
          ...calories,
          {
            day,
            total: totalCalories,
            protein: totalProtein,
            carbs: totalCarbs,
            fat: totalFat,
            items: data.foods.map((f) => ({
              name: f.food_name,
              cal: f.nf_calories,
              protein: f.nf_protein,
              carbs: f.nf_total_carbohydrate,
              fat: f.nf_total_fat,
              qty: f.serving_qty,
              unit: f.serving_unit,
            })),
          },
        ]);

        setDay(day + 1);
      } else {
        alert("No nutrition data found.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
      setFood("");
    }
  };

  const clearData = () => {
    if (window.confirm("Clear all saved data?")) {
      setCalories([]);
      setDay(1);
      localStorage.removeItem("calorieData");
    }
  };

  const chartData = {
    labels: calories.map((c) => `Day ${c.day}`),
    datasets: [
      {
        label: "Calories per Day",
        data: calories.map((c) => c.total),
        borderColor: "#3b82f6",
        backgroundColor: "#93c5fd",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-orange-100 to-yellow-100 p-6">
      <h1 className="text-3xl font-bold mb-4 text-center">
        🔥 AI Calorie & Nutrition Tracker
      </h1>

      {/* Input Section */}
      <div className="flex flex-col items-center">
        <textarea
          rows="2"
          value={food}
          onChange={(e) => setFood(e.target.value)}
          placeholder="Enter food (e.g., 250g chicken, 2 bananas)"
          className="border p-2 rounded-lg w-96 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="mt-2 space-x-3">
          <button
            onClick={fetchCalories}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? "Adding..." : "Add Day"}
          </button>
          {calories.length > 0 && (
            <button
              onClick={clearData}
              className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Line Chart */}
      {calories.length > 0 && (
        <div className="mt-6 max-w-2xl mx-auto bg-white p-4 rounded-xl shadow-md">
          <Line data={chartData} />
        </div>
      )}

      {/* Day Breakdown */}
      <div className="mt-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-2">📅 Daily Log</h2>
        {calories.length > 0 ? (
          calories.map((c, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md p-3 mb-3 cursor-pointer transition hover:shadow-lg"
              onClick={() =>
                setExpandedDay(expandedDay === c.day ? null : c.day)
              }
            >
              {/* Summary Row */}
              <div className="flex justify-between items-center">
                <span className="font-bold">Day {c.day}</span>
                <span className="text-blue-600 font-semibold">
                  {c.total.toFixed(0)} kcal
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                P: {c.protein.toFixed(0)}g · C: {c.carbs.toFixed(0)}g · F:{" "}
                {c.fat.toFixed(0)}g
              </p>

              {/* Expanded Details */}
              {expandedDay === c.day && (
                <div className="mt-3 border-t pt-3">
                  {/* Pie Chart */}
                  <div className="w-60 mx-auto">
                    <Pie
                      data={{
                        labels: ["Protein", "Carbs", "Fat"],
                        datasets: [
                          {
                            data: [c.protein, c.carbs, c.fat],
                            backgroundColor: ["#60a5fa", "#facc15", "#f97316"],
                          },
                        ],
                      }}
                      options={{
                        plugins: { legend: { position: "bottom" } },
                      }}
                    />
                  </div>

                  {/* Food List */}
                  <h3 className="text-lg font-semibold mt-4">🍽 Food Items</h3>
                  <ul className="mt-2 text-sm space-y-1">
                    {c.items.map((item, i) => (
                      <li key={i} className="flex justify-between">
                        <span>
                          {item.qty} {item.unit} {item.name}
                        </span>
                        <span className="text-gray-600">
                          {item.cal.toFixed(0)} kcal · P:{item.protein}g · C:
                          {item.carbs}g · F:{item.fat}g
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500">No data yet. Add your first meal!</p>
        )}
      </div>
    </div>
  );
}

export default App;
