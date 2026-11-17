"use client";

// useState lets us display the result on the page.
import { useEffect, useState } from "react";
// Use the same artwork as app/icon.svg and the browser favicon.
import Image from "next/image";

// Scroll only when the focused control is outside the visible area (including the keyboard).
function keepFieldVisible() {
  const field = document.activeElement;
  if (!(field instanceof HTMLElement) || !field.matches("input, select, button")) return;
  const viewport = window.visualViewport;
  const top = viewport?.offsetTop ?? 0;
  const height = viewport?.height ?? window.innerHeight;
  const bounds = field.getBoundingClientRect();
  if (bounds.top < top + 24 || bounds.bottom > top + height - 24) {
    window.scrollBy({ top: bounds.top - top - (height - bounds.height) / 2, behavior: "instant" });
  }
}

export default function Home() {
  // Recheck visibility as a phone keyboard opens or the browser viewport changes.
  useEffect(() => {
    window.visualViewport?.addEventListener("resize", keepFieldVisible);
    window.addEventListener("resize", keepFieldVisible);
    return () => {
      window.visualViewport?.removeEventListener("resize", keepFieldVisible);
      window.removeEventListener("resize", keepFieldVisible);
    };
  }, []);
  const [prediction, setPrediction] = useState<string | null>(null);

  // Keep weight and height in state so BMI updates as you type.
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const bmi = Number(weight) > 0 && Number(height) > 0
    ? Number(weight) / (Number(height) ** 2) : null;

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

    // Keep errors separate from the premium category.
    setError("");
    setPrediction(null);
    setLoading(true);
    try {
      const response = await fetch("https://insurance-tier-model.onrender.com/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setError("Check your inputs: age 1–119, weight above 0 and below 120 kg, height above 0 and below 3 m, and income above 0.");
        return;
      }
      const result = await response.json();
      setPrediction(result.predicted_category);
    } catch {
      setError("Could not connect. Make sure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <header>
        {/* Shared logo and app name above the form. */}
        <div className="brand">
          
          <span className="eyebrow">INSURANCE PREMIUM ESTIMATOR</span>
        </div>
        <h1>A little detail. A clearer picture.</h1>
        <p>Fill in your details to see your BMI and predicted insurance premium category.</p>
      </header>

      <div className="workspace">
      {/* Clear the old prediction whenever the form changes. */}
      {/* Check visibility when any field receives focus by click or keyboard. */}
      <form className="card" onFocusCapture={keepFieldVisible} onSubmit={handleSubmit} onChange={() => { setPrediction(null); setError(""); }}>
        <h2>Your details</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="age">Age</label>
            {/* Number inputs enable numeric validation and mobile keyboards. */}
            <input id="age" name="age" type="number" min="1" max="119" placeholder="e.g. 30" required />
          </div>
          <div className="field">
            <label htmlFor="weight">Weight (kg)</label>
            {/* Number inputs enable numeric validation and mobile keyboards. */}
            <input id="weight" name="weight" type="number" value={weight} onChange={(event) => setWeight(event.target.value)} min="0" max="120" step="any" placeholder="e.g. 70" required />
          </div>
          <div className="field">
            <label htmlFor="height">Height (meters)</label>
            {/* Number inputs enable numeric validation and mobile keyboards. */}
            <input id="height" name="height" type="number" value={height} onChange={(event) => setHeight(event.target.value)} min="0" max="3" step="any" placeholder="e.g. 1.75" required />
          </div>
          <div className="field">
            <label htmlFor="income_lpa">Income (LPA)</label>
            {/* Number inputs enable numeric validation and mobile keyboards. */}
            <input id="income_lpa" name="income_lpa" type="number" min="0" step="any" placeholder="e.g. 8" required />
          </div>
          <div className="field">
            <label htmlFor="city">City</label>
            {/* Include all cities in main.py, plus Pabna from the CSV and a Tier 3 fallback. */}
            <select id="city" name="city" defaultValue="" required>
              <option value="" disabled>Select city</option>
              <option value="Barishal">Barishal (Barisal)</option>
              <option value="Bogura">Bogura (Bogra)</option>
              <option value="Chattogram">Chattogram (Chittagong)</option>
              <option value="Cox's Bazar">Cox&apos;s Bazar</option>
              <option value="Cumilla">Cumilla (Comilla)</option>
              <option value="Dhaka">Dhaka</option>
              <option value="Faridpur">Faridpur</option>
              <option value="Feni">Feni</option>
              <option value="Gazipur">Gazipur</option>
              <option value="Jashore">Jashore (Jessore)</option>
              <option value="Khulna">Khulna</option>
              <option value="Kushtia">Kushtia</option>
              <option value="Mymensingh">Mymensingh</option>
              <option value="Narayanganj">Narayanganj</option>
              <option value="Noakhali">Noakhali</option>
              <option value="Pabna">Pabna</option>
              <option value="Rajshahi">Rajshahi</option>
              <option value="Rangpur">Rangpur</option>
              <option value="Savar">Savar</option>
              <option value="Sylhet">Sylhet</option>
              <option value="Tangail">Tangail</option>
              <option value="Other">Other city (Tier 3)</option>
            </select>
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

        {/* Disable the button while the prediction is being calculated. */}
        <button type="submit" disabled={loading}>{loading ? "Calculating…" : "Calculate premium"}</button>
        {error && <p className="error" role="alert">{error}</p>}
      </form>

      {/* Live BMI and the model prediction have their own simple summary cards. */}
      <aside className="summary">
        <section className="card bmi-card" aria-live="polite">
          <span className="eyebrow">BODY MASS INDEX</span>
          <div className="bmi-value">{bmi !== null && Number.isFinite(bmi) ? bmi.toFixed(1) : "—"}</div>
          <p>{bmi !== null ? "Calculated from your weight and height." : "Enter your weight and height to see your BMI."}</p>
          <span className="formula">BMI = weight (kg) ÷ height (m)²</span>
        </section>
        <section className={`card result-card ${prediction ? prediction.toLowerCase() : ""}`} aria-live="polite" aria-busy={loading}>
          <span className="eyebrow">YOUR PREDICTION</span>
          {prediction ? (
            <>
              <h2>{prediction} insurance premium</h2>
              <p>Your details fall in the <strong>{prediction.toLowerCase()}</strong> premium category.</p>
              <span className="result-note">Predicted category, not a price quote.</span>
            </>
          ) : (
            <>
              <h2>{loading ? "Calculating…" : "Your estimate goes here"}</h2>
              <p>Complete the form and calculate to see whether your predicted premium is low, medium, or high.</p>
            </>
          )}
        </section>
      </aside>
      </div>
    </main>
  );
}
