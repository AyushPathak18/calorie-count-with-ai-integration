import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

function App() {
  const [food, setFood] = useState("");
  const [calories, setCalories] = useState([]);
  const [day, setDay] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchCalories = async () => {
    if (!food) return;

    setLoading(true);
    try {
      const res = await fetch("https://trackapi.nutritionix.com/v2/natural/nutrients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app-id": "a10c0a04",   // replace with your Nutritionix APP ID
          "x-app-key": "2ecc31fe8ac1828dda02bfa847aff42e" // replace with your Nutritionix API Key
        },
        body: JSON.stringify({ query: food })
      });

      const data = await res.json();

      if (data.foods && data.foods.length > 0) {
        const cals = data.foods[0].nf_calories || 0;

        setCalories([...calories, { day, cal: cals, name: data.foods[0].food_name }]);
        setDay(day + 1);
      } else {
        alert("No nutrition data found for this food.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Something went wrong while fetching data.");
    } finally {
      setLoading(false);
      setFood("");
    }
  };

  const chartData = {
    labels: calories.map(c => `Day ${c.day}`),
    datasets: [
      {
        label: "Calories per Day",
        data: calories.map(c => c.cal),
        borderColor: "blue",
        backgroundColor: "lightblue",
        tension: 0.3,
      }
    ]
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">🔥 AI Calorie Tracker</h1>
      <div className="text-gray-600 mb-4 bg-gray-200 p-4 rounded flex flex-col items-center justify-center m-5">
        Track your daily calorie intake effortlessly with AI!
      <input
        type="text"
        value={food}
        onChange={e => setFood(e.target.value)}
        placeholder="Enter food (e.g., 2 eggs and rice)"
        className="border p-2 rounded w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
     
      <button
        onClick={fetchCalories}
        disabled={loading}
        className="ml-2 px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
      >
        {loading ? "Checking..." : "Add"}
      </button>
      </div>

      <div className="mt-6 w-[600px] mx-auto">
        {calories.length > 0 ? (
          <>
            <Line data={chartData} />
            <ul className="mt-4 text-left">
              {calories.map((c, index) => (
                <li key={index}>
                  <b>Day {c.day}:</b> {c.name} → {c.cal.toFixed(0)} kcal
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-gray-500 mt-4">No data yet. Add some food!</p>
        )}
      </div>
    </div>
  );
}

export default App;
