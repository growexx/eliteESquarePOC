import React, { useState } from "react";

const WorkflowForm = () => {
  const [initialWorkflowData, setInitialWorkflowData] = useState({
    workflow1: {
      question: "Enter your details",
      fields: ["First Name", "Last Name", "Email", "Issue Description"],
      options: { 'Employment Law': "workflow2", "Business Contract Dispute": "workflow3" },
    },
    workflow2: {
      question: "Enter additional personal details and choose between X & Y",
      fields: ["Phone Number", "Address", "Employment Status", "Type of Employment Issue", "Date of Incident", "Employer Contacted?", "Case Description"],
      options: { X: "end", Y: "end" },
    },
    workflow3: {
      question: "Enter company details and choose between M & N",
      fields: ["Company Name", "Job Title", "Type of Contract", "Nature of the Dispute", "Date the Dispute Started", "Attempts to Resolve the Dispute", "Upload Contract or Supporting Documents"],
      options: { M: "end", N: "end" },
    },
  });

  const [workflowData, setWorkflowData] = useState(initialWorkflowData);
  const [currentWorkflow, setCurrentWorkflow] = useState("workflow1");
  const [formData, setFormData] = useState({});
  const [selectedOption, setSelectedOption] = useState("");
  const [selectionPath, setSelectionPath] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dynamicOptions, setDynamicOptions] = useState([]);
  const [showNewOptionInput, setShowNewOptionInput] = useState(false);
  const [newOptionName, setNewOptionName] = useState("");
  const [workflowReason, setWorkflowReason] = useState("");

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e) => {
    setSelectedOption(e.target.value);
  };

  const handleNextStep = async () => {
    if (!selectedOption) return;

    setSelectionPath([...selectionPath, selectedOption]);

    if (dynamicOptions.includes(selectedOption)) {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:3000/api/getNextWorkflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ option: selectedOption }),
        });

        const data = await response.json();
        const nextWorkflow = data.nextWorkflow;

        if (nextWorkflow) {
          setCurrentWorkflow(nextWorkflow);
          setWorkflowData((prev) => ({
            ...prev,
            [nextWorkflow]: {
              question: `Dynamic question for ${selectedOption}`,
              fields: ["Dynamic Field 1", "Dynamic Field 2"],
              options: { Continue: "end" },
            },
          }));

          setInitialWorkflowData((prev) => ({
            ...prev,
            [nextWorkflow]: {
              question: `Dynamic question for ${selectedOption}`,
              fields: ["Dynamic Field 1", "Dynamic Field 2"],
              options: { Continue: "end" },
            },
          }));
        }
      } catch (error) {
        console.error("Error fetching next workflow:", error);
      } finally {
        setLoading(false);
      }
    } else {
      const nextWorkflow = workflowData[currentWorkflow].options[selectedOption];
      if (nextWorkflow) {
        setCurrentWorkflow(nextWorkflow);
      }
    }

    setSelectedOption("");
  };

  // const addNewOption = async () => {
  //   if (!newOptionName.trim()) return;

  //   setLoading(true);
  //   try {
  //     const response = await fetch("http://localhost:3000/api/getNextWorkflow", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ option: newOptionName }),
  //     });

  //     const data = await response.json();
  //     const nextWorkflow = data.nextWorkflow || "apiBasedWorkflow"; // Fallback if API does not return next workflow

  //     setWorkflowData((prev) => {
  //       const updatedWorkflow = {
  //         ...prev,
  //         workflow1: {
  //           ...prev.workflow1,
  //           options: { ...prev.workflow1.options, [newOptionName]: nextWorkflow },
  //         },
  //       };

  //       setInitialWorkflowData(updatedWorkflow);
  //       return updatedWorkflow;
  //     });

  //     setDynamicOptions([...dynamicOptions, newOptionName]);
  //     setNewOptionName("");
  //     setShowNewOptionInput(false);

  //     // Redirect to the new workflow
  //     setCurrentWorkflow(nextWorkflow);
  //   } catch (error) {
  //     console.error("Error fetching next workflow:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const addNewOption = async () => {
    if (!newOptionName.trim()) return;

    setLoading(true);

    const workflowWiseData = {};
    Object.keys(initialWorkflowData).forEach((workflowKey) => {
      workflowWiseData[workflowKey] = {};
      initialWorkflowData[workflowKey].fields.forEach((field) => {
        workflowWiseData[workflowKey][field] = formData[field] || ""; // Preserve empty fields
      });
    });

    const payload = {
      Options: initialWorkflowData.workflow1.options,
      workflows: workflowWiseData,
      currentWorkflow, // Include the current workflow key
      newOption: newOptionName,
    };

    try {
      const response = await fetch("https://38fc-122-179-154-192.ngrok-free.app/process_workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // Extract workflow key and reason dynamically
      const [nextWorkflow, reason] = Object.entries(data)[0];

      setWorkflowData((prev) => {
        const updatedWorkflow = {
          ...prev,
          [currentWorkflow]: {
            ...prev[currentWorkflow],
            options: { ...prev[currentWorkflow].options, [newOptionName]: nextWorkflow },
          },
        };

        setInitialWorkflowData(updatedWorkflow);
        return updatedWorkflow;
      });

      setDynamicOptions([...dynamicOptions, newOptionName]);
      setNewOptionName("");
      setShowNewOptionInput(false);

      // Redirect to the returned workflow
      setCurrentWorkflow(nextWorkflow);

      // Store reason for displaying below the form
      setWorkflowReason(reason);

    } catch (error) {
      console.error("Error fetching next workflow:", error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="p-8 max-w-lg mx-auto bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl shadow-lg">
      <h2 className="text-2xl font-extrabold mb-6 text-center">{workflowData[currentWorkflow].question}</h2>
      {workflowReason && (
        <div className="mt-4 p-3 bg-yellow-100 text-yellow-900 rounded-lg shadow-md">
          <h3 className="font-semibold">Reason for Workflow:</h3>
          <p className="text-md mt-1">{workflowReason}</p>
        </div>
      )}
      <form className="space-y-5">
        {workflowData[currentWorkflow].fields?.map((field) => (
          <div key={field} className="flex flex-col">
            <label className="text-lg font-medium mb-2">{field}</label>
            <input
              type="text"
              name={field}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        ))}
      </form>

      {workflowData[currentWorkflow].options && (
        <div className="mt-6">
          <label className="block text-lg font-medium mb-2">Choose a legal issue</label>
          <div className="flex gap-2 mb-2">
            <select
              value={selectedOption}
              onChange={handleSelectChange}
              className="flex-1 px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Select an option</option>
              {Object.keys(workflowData[currentWorkflow].options).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewOptionInput(!showNewOptionInput)}
              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-300"
            >
              + Add
            </button>
          </div>

          {showNewOptionInput && (
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                placeholder="Enter new option name"
                className="flex-1 px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="button"
                onClick={addNewOption}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-300"
              >
                Save
              </button>
            </div>
          )}

          <button
            className="w-full mt-4 px-6 py-3 bg-indigo-700 text-white font-semibold rounded-lg hover:bg-indigo-800 transition duration-300 disabled:opacity-50"
            onClick={handleNextStep}
            disabled={loading}
          >
            {loading ? "Loading..." : "Next"}
          </button>
        </div>
      )}

      <div className="mt-6 text-gray-200 text-center">
        <h3 className="font-semibold text-lg">Selected Path:</h3>
        <p className="text-md mt-1">{selectionPath.join(" > ")}</p>
      </div>
    </div>
  );
};

export default WorkflowForm;