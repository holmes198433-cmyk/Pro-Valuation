import React, { useState } from 'react';

export default function App() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Loading, 3: Form, 4: Result
  const [file, setFile] = useState(null);
  const [appData, setAppData] = useState(null); // Holds object name, base price, and questions
  const [answers, setAnswers] = useState({});

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadAndAnalyze = async () => {
    if (!file) return;
    setStep(2);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/api/analyze-item', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      // Ensure data is parsed into an object if returned as stringified JSON
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      setAppData(parsed);
      setStep(3);
    } catch (err) {
      alert('Error extracting product data.');
      setStep(1);
    }
  };

  const calculateFinalValue = () => {
    let finalValue = appData.base_value;
    appData.questions.forEach((q) => {
      const selectedMultiplier = answers[q.id] || 1.0;
      finalValue *= selectedMultiplier;
    });
    return finalValue.toFixed(2);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* STEP 1: UPLOAD */}
      {step === 1 && (
        <div style={{ border: '2px dashed #ccc', padding: '40px', textAlign: 'center' }}>
          <h3>Upload Item Photo</h3>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {file && (
            <button onClick={uploadAndAnalyze} style={{ marginTop: '20px', display: 'block', width: '100%', padding: '10px' }}>
              Analyze Item
            </button>
          )}
        </div>
      )}

      {/* STEP 2: LOADING SCREEN */}
      {step === 2 && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>Scanning object and fetching valuations...</h3>
        </div>
      )}

      {/* STEP 3: DYNAMIC CONDITION QUESTIONNAIRE */}
      {step === 3 && appData && (
        <div>
          <h2>Identified: {appData.item_name}</h2>
          <p>Initial Base Market Value: ${appData.base_value}</p>
          <hr />
          
          {appData.questions.map((q) => (
            <div key={q.id} style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>{q.text}</label>
              <select 
                style={{ width: '100%', padding: '8px' }}
                onChange={(e) => setAnswers({ ...answers, [q.id]: parseFloat(e.target.value) })}
              >
                <option value="1.0">-- Select Condition Status --</option>
                {q.options.map((opt, i) => (
                  <option key={i} value={opt.multiplier}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}

          <button onClick={() => setStep(4)} style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Calculate True Value
          </button>
        </div>
      )}

      {/* STEP 4: FINAL VALUATION RESULTS */}
      {step === 4 && appData && (
        <div style={{ textAlign: 'center', padding: '20px', border: '1px solid #000' }}>
          <h2>Calculated Offer Range</h2>
          <h1 style={{ fontSize: '3rem', color: '#2e7d32', margin: '10px 0' }}>${calculateFinalValue()}</h1>
          <p>Based on condition parameters supplied for <strong>{appData.item_name}</strong>.</p>
          <button onClick={() => { setStep(1); setFile(null); setAnswers({}); }} style={{ marginTop: '20px', padding: '8px 16px' }}>
            Scan Another Item
          </button>
        </div>
      )}

    </div>
  );
}
