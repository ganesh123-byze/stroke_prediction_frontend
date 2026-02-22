document.getElementById("predictBtn").addEventListener("click", async function () {

  try {
    const circle = document.querySelector(".circle");
    const percentText = document.getElementById("riskPercent");
    const riskLabel = document.getElementById("riskLabel");
    const probText = document.getElementById("probabilityText");

    const data = {
      gender: document.getElementById("gender").value,
      age: parseFloat(document.getElementById("age").value),
      hypertension: parseInt(document.getElementById("hypertension").value),
      heart_disease: parseInt(document.getElementById("heart_disease").value),
      ever_married: document.getElementById("ever_married").value,
      work_type: document.getElementById("work_type").value,
      Residence_type: document.getElementById("Residence_type").value,
      avg_glucose_level: parseFloat(document.getElementById("avg_glucose_level").value),
      bmi: parseFloat(document.getElementById("bmi").value),
      smoking_status: document.getElementById("smoking_status").value
    };

    const response = await fetch("https://stroke-prediction-4nkn.onrender.com/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    const probability = result.stroke_probability * 100;

    percentText.innerText = probability.toFixed(0) + "%";
    probText.innerText = "Probability: " + probability.toFixed(1) + "%";

    circle.style.background =
      `conic-gradient(#2563eb ${probability}%, #e5e7eb ${probability}%)`;

    riskLabel.innerText = result.risk_level;

  } catch (error) {
    alert("Error connecting to API");
    console.error(error);
  }

});