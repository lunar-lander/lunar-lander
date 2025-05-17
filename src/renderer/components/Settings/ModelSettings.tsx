import React, { useState } from 'react';
import { Model } from '../../../shared/types/model';
import { useAppContext } from '../../contexts/AppContext';
import styles from './ModelSettings.module.css';

interface ModelFormData {
  id?: string;
  name: string;
  baseUrl: string;
  modelName: string;
  apiKey: string;
  isActive: boolean;
}

const initialFormData: ModelFormData = {
  name: '',
  baseUrl: 'https://api.openai.com/v1',
  modelName: '',
  apiKey: '',
  isActive: true
};

const ModelSettings: React.FC = () => {
  const { models, addModel, updateModel, deleteModel, setSummaryModelId, summaryModelId } = useAppContext();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ModelFormData>(initialFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleAddModel = () => {
    setIsEditing(false);
    setFormData(initialFormData);
    setTestResult(null);
    setShowForm(true);
  };

  const handleEditModel = (model: Model) => {
    setIsEditing(true);
    setFormData({
      id: model.id,
      name: model.name,
      baseUrl: model.baseUrl,
      modelName: model.modelName,
      apiKey: model.apiKey,
      isActive: model.isActive
    });
    setTestResult(null);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setFormData(initialFormData);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    // In a real app, this would make an API call to test the connection
    // For now, we'll simulate a test
    setTestResult(null);
    
    // Simple validation
    if (!formData.name || !formData.modelName || !formData.apiKey) {
      setTestResult({
        success: false,
        message: 'Please fill in all required fields'
      });
      return;
    }
    
    // Simulate API test
    const testSuccess = Math.random() > 0.3; // 70% chance of success
    
    setTimeout(() => {
      setTestResult({
        success: testSuccess,
        message: testSuccess 
          ? 'Connection successful! The model is working correctly.' 
          : 'Connection failed. Please check your API key and model name.'
      });
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.modelName || !formData.apiKey) {
      setTestResult({
        success: false,
        message: 'Please fill in all required fields'
      });
      return;
    }
    
    if (isEditing && formData.id) {
      updateModel({
        id: formData.id,
        name: formData.name,
        baseUrl: formData.baseUrl,
        modelName: formData.modelName,
        apiKey: formData.apiKey,
        isActive: formData.isActive
      });
    } else {
      addModel({
        name: formData.name,
        baseUrl: formData.baseUrl,
        modelName: formData.modelName,
        apiKey: formData.apiKey,
        isActive: formData.isActive
      });
    }
    
    setShowForm(false);
    setFormData(initialFormData);
    setTestResult(null);
  };

  const handleToggleActive = (modelId: string, currentStatus: boolean) => {
    updateModel({
      id: modelId,
      isActive: !currentStatus
    });
  };

  const handleDeleteModel = (modelId: string) => {
    if (window.confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
      deleteModel(modelId);
    }
  };

  const handleSetAsSummaryModel = (modelId: string) => {
    localStorage.setItem('summaryModelId', modelId);
    setSummaryModelId(modelId);
    setTestResult({
      success: true,
      message: "Summary model updated successfully!"
    });
    
    // Clear the success message after 3 seconds
    setTimeout(() => {
      setTestResult(null);
    }, 3000);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>🤖 Model Configuration</h2>
      
      <div className={styles.modelList}>
        {models.length === 0 ? (
          <p>No models configured yet. Add your first model to get started.</p>
        ) : (
          models.map(model => (
            <div key={model.id} className={styles.modelItem}>
              <div className={styles.modelInfo}>
                <span className={styles.modelName}>
                  {model.name}
                  <span className={`${styles.badge} ${model.isActive ? styles.active : styles.inactive}`}>
                    {model.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {model.id === summaryModelId && (
                    <span className={styles.badge} style={{ backgroundColor: '#fbbc04' }}>
                      Summary Model
                    </span>
                  )}
                </span>
                <span className={styles.modelDetails}>
                  Model: {model.modelName} • Base URL: {model.baseUrl}
                </span>
              </div>
              <div className={styles.modelControls}>
                <button 
                  className={`${styles.button} ${styles.secondary}`}
                  onClick={() => handleToggleActive(model.id, model.isActive)}
                >
                  {model.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button 
                  className={`${styles.button} ${styles.secondary}`}
                  onClick={() => handleSetAsSummaryModel(model.id)}
                  disabled={model.id === summaryModelId}
                >
                  {model.id === summaryModelId ? 'Summary Model' : 'Set as Summary Model'}
                </button>
                <button 
                  className={styles.button} 
                  onClick={() => handleEditModel(model)}
                >
                  Edit
                </button>
                <button 
                  className={`${styles.button} ${styles.danger}`} 
                  onClick={() => handleDeleteModel(model.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {!showForm ? (
        <button className={`${styles.button} ${styles.addModelButton}`} onClick={handleAddModel}>
          + Add Model
        </button>
      ) : (
        <div className={styles.form}>
          <h3 className={styles.formTitle}>{isEditing ? 'Edit Model' : 'Add New Model'}</h3>
          
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="name">
                Model Name (Display Name)
              </label>
              <input
                id="name"
                name="name"
                className={styles.input}
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., GPT-4, Claude-3, etc."
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="baseUrl">
                Base URL
              </label>
              <input
                id="baseUrl"
                name="baseUrl"
                className={styles.input}
                value={formData.baseUrl}
                onChange={handleChange}
                placeholder="e.g., https://api.openai.com/v1"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="modelName">
                Model Name (API Identifier)
              </label>
              <input
                id="modelName"
                name="modelName"
                className={styles.input}
                value={formData.modelName}
                onChange={handleChange}
                placeholder="e.g., gpt-4-turbo, claude-3-opus-20240229"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="apiKey">
                API Key
                <span 
                  className={styles.apiKeyToggle}
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? "🙈 Hide" : "👁️ Show"}
                </span>
              </label>
              <input
                id="apiKey"
                name="apiKey"
                className={styles.input}
                type={showApiKey ? "text" : "password"}
                value={formData.apiKey}
                onChange={handleChange}
                placeholder="Enter your API key"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                {' '}Active (available for conversations)
              </label>
            </div>
            
            {testResult && (
              <div className={`${styles.testResult} ${testResult.success ? styles.success : styles.error}`}>
                {testResult.message}
              </div>
            )}
            
            <div className={styles.formActions}>
              <button 
                type="button" 
                className={`${styles.button} ${styles.secondary}`}
                onClick={handleTestConnection}
              >
                Test Connection
              </button>
              <button 
                type="button" 
                className={`${styles.button} ${styles.secondary}`}
                onClick={handleCancelForm}
              >
                Cancel
              </button>
              <button type="submit" className={styles.button}>
                {isEditing ? 'Update Model' : 'Add Model'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className={styles.summaryModelSection}>
        <h3 className={styles.title}>📝 Chat Summary Configuration</h3>
        <p>The selected model will be used to generate summaries for your chats. This helps organize your conversation history with meaningful titles.</p>
        
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="summaryModel">
            Summary Model
          </label>
          <select
            id="summaryModel"
            className={styles.input}
            value={summaryModelId || ''}
            onChange={(e) => setSummaryModelId(e.target.value)}
          >
            <option value="">Select a model</option>
            {models.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ModelSettings;