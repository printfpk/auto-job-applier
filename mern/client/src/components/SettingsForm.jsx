import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../api';

const SettingsForm = () => {
    const [formData, setFormData] = useState({
        linkedInUsername: '',
        linkedInPassword: '',
        searchTerms: [],
        searchLocation: 'United States',
        easyApplyOnly: true,
        useAI: false,
        aiApiKey: ''
    });

    useEffect(() => {
        getSettings().then(data => {
            if (data) setFormData({ ...formData, ...data });
        });
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await updateSettings(formData);
        alert('Settings Saved!');
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-800 text-white rounded-lg space-y-4">
            <h2 className="text-xl font-bold mb-4">Configuration</h2>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm mb-1">LinkedIn Username</label>
                    <input type="text" name="linkedInUsername" value={formData.linkedInUsername} onChange={handleChange} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
                </div>
                <div>
                    <label className="block text-sm mb-1">LinkedIn Password</label>
                    <input type="password" name="linkedInPassword" value={formData.linkedInPassword} onChange={handleChange} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
                </div>
            </div>

            <div>
                <label className="block text-sm mb-1">Search Keywords (comma separated)</label>
                <input
                    type="text"
                    value={formData.searchTerms ? formData.searchTerms.join(', ') : ''}
                    onChange={(e) => setFormData({ ...formData, searchTerms: e.target.value.split(',').map(s => s.trim()) })}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                />
            </div>

            <div>
                <label className="block text-sm mb-1">Location</label>
                <input type="text" name="searchLocation" value={formData.searchLocation} onChange={handleChange} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
            </div>

            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                    <input type="checkbox" name="easyApplyOnly" checked={formData.easyApplyOnly} onChange={handleChange} />
                    Easy Apply Only
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" name="useAI" checked={formData.useAI} onChange={handleChange} />
                    Use AI (OpenAI)
                </label>
            </div>

            {formData.useAI && (
                <div>
                    <label className="block text-sm mb-1">OpenAI API Key</label>
                    <input type="password" name="aiApiKey" value={formData.aiApiKey} onChange={handleChange} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
                </div>
            )}

            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded">Save Settings</button>
        </form>
    );
};

export default SettingsForm;
