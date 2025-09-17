/*
    description: Utility functions for generating batch IDs and names.
*/

export const generateBatchId = () => {
    const now = new Date();
    return {
        id: `batch_${now.getTime()}`,              // Unique ID (timestamp)
        name: `Upload ${now.toISOString().slice(0, 16).replace('T', ' ')}` // "Upload 2024-02-20 14:30"
    };
};