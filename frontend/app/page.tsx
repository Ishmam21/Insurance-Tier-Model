"use client";

// useState lets us display the result on the page.
import { useState } from "react";

export default function Home() {
  const [prediction, setPrediction] = useState<string | null>(null);

  // SubmitEvent is the current React type for a form submission.
  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); // Send JSON ourselves instead of reloading the page.

    const form = new FormData(event.currentTarget);
    const payload = {
      age: Number(form.get("age")),
      weight: Number(form.get("weight")),
      height: Number(form.get("height")),
      income_lpa: Number(form.get("income_lpa")),
      smoker: form.get("smoker") === "true", // Convert the radio string to a boolean.
      city: form.get("city"),
      occupation: form.get("occupation"),
    };

    // Send the form values to FastAPI as JSON.
    const response = await fetch("http://localhost:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Show a basic message if the backend rejects the request.
    if (!response.ok) {
      setPrediction("Request failed. Check your inputs.");
      return;
    }

    // Read the response and display its predicted category.
    const result = await response.json();
    setPrediction(result.predicted_category);
  }

  return (
    <main className="card">
      <header>
        <h1>Input details</h1>
        <p>Enter your details to get a premium prediction.</p>
      </header>

      {/* Run the handler when the form is submitted. */}
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="age">Age</label>
            {/* Number inputs enable numeric validation and mobile keyboards. */}
            <input id="age" name="age" type="text" min="1" max="119" placeholder="e.g. 30" required />
          </div>
          <div className="field">
            <label htmlFor="weight">Weight (kg)</label>
            {/* Number inputs enable numeric validation and mobile keyboards. */}
            <input id="weight" name="weight" type="text" min="0" max="120" step="any" placeholder="e.g. 70" required />
          </div>
          <div className="field">
            <label htmlFor="height">Height (meters)</label>
            {/* Number inputs enable numeric validation and mobile keyboards. */}
            <input id="height" name="height" type="text" min="0" max="3" step="any" placeholder="e.g. 1.75" required />
          </div>
          <div className="field">
            <label htmlFor="income_lpa">Income (LPA)</label>
            {/* Number inputs enable numeric validation and mobile keyboards. */}
            <input id="income_lpa" name="income_lpa" type="text" min="0" step="any" placeholder="e.g. 8" required />
          </div>
          <div className="field">
            <label htmlFor="city">City</label>
            <input id="city" name="city" type="text" placeholder="e.g. Mumbai" required />
          </div>
          <div className="field">
            <label htmlFor="occupation">Occupation</label>
            <select id="occupation" name="occupation" defaultValue="" required>
              <option value="" disabled>Select occupation</option>
              <option value="retired">Retired</option>
              <option value="freelancer">Freelancer</option>
              <option value="student">Student</option>
              <option value="government_job">Government job</option>
              <option value="business_owner">Business owner</option>
              <option value="unemployed">Unemployed</option>
              <option value="private_job">Private job</option>
            </select>
          </div>
        </div>

        <fieldset>
          <legend>Smoking status</legend>
          <div className="radio-group">
            <label className="radio-option">
              <input name="smoker" type="radio" value="true" required /> Smoker
            </label>
            <label className="radio-option">
              <input name="smoker" type="radio" value="false" /> Non-smoker
            </label>
          </div>
        </fieldset>

        <button type="submit">Submit</button>
        {/* Display the result returned by FastAPI. */}
        <p>{prediction}</p>
      </form>
    </main>
  );
}
