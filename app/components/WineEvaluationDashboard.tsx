"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePDF } from 'react-to-pdf';

interface CriteriaScore {
  criterion: string;
  weight: number;
  score: number;
  weightedScore: number;
  notes: string;
}

interface EvaluationData {
  staffName: string;
  date: string;
  overallScore: number;
  performanceLevel: string;
  criteriaScores: CriteriaScore[];
  strengths: string[];
  areasForImprovement: string[];
  keyRecommendations: string[];
}

const WineEvaluationDashboard = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Configure PDF options with the specified margins
  const { toPDF, targetRef } = usePDF({
    filename: 'wine-sales-evaluation.pdf',
    page: {
      margin: 18, // 0.25 inches = 18 points (1 inch = 72 points)
      format: 'letter', // 8.5" x 11"
    },
    method: 'save',
  });

  const loadEvaluationData = () => {
    setIsAnalyzing(true);
    console.log('Fetching evaluation data...');
    
    // Use the new evaluation file
    fetch(`/data/evaluation_new.json?t=${new Date().getTime()}`)
      .then(response => {
        console.log('Response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('Loaded evaluation data:', data);
        console.log('Areas for improvement:', data.areasForImprovement);
        setEvaluationData(data);
        setIsAnalyzing(false);
      })
      .catch(error => {
        console.error('Error loading evaluation data:', error);
        setIsAnalyzing(false);
      });
  };

  useEffect(() => {
    loadEvaluationData();
  }, []);

  const handleExportPDF = async () => {
    if (!evaluationData) return;
    
    setIsExporting(true);
    try {
      await toPDF();
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        // Validate the JSON structure matches our expected format
        if (
          typeof jsonData.staffName === 'string' &&
          typeof jsonData.date === 'string' &&
          typeof jsonData.overallScore === 'number' &&
          typeof jsonData.performanceLevel === 'string' &&
          Array.isArray(jsonData.criteriaScores) &&
          Array.isArray(jsonData.strengths) &&
          Array.isArray(jsonData.areasForImprovement) &&
          Array.isArray(jsonData.keyRecommendations)
        ) {
          setEvaluationData(jsonData);
        } else {
          alert('Invalid JSON format. Please ensure the file matches the expected structure.');
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
        alert('Error parsing JSON file. Please ensure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 60) return 'text-orange-500';
    return 'text-red-500';
  };
  
  const getBarColor = (score: number): string => {
    if (score >= 4) return '#4ECDC4';
    if (score >= 3) return '#FFD166';
    return '#FF6B6B';
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <Image 
          src="https://i.imgur.com/qfTW5j0.png" 
          alt="Winery Logo" 
          width={256}
          height={256}
          className="w-64 mb-6 opacity-20" 
        />
        <h1 className="text-2xl font-serif text-gray-800 mb-4">Analyzing Sales Conversation</h1>
        <div className="w-16 h-16 border-4 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!evaluationData) {
    return (
      <div className="text-center p-8 text-gray-800">
        <p>No evaluation data available</p>
        <button 
          onClick={loadEvaluationData}
          className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
        >
          Retry Loading Data
        </button>
      </div>
    );
  }

  const chartData = evaluationData.criteriaScores.map(item => ({
    name: item.criterion,
    score: item.score,
    fill: getBarColor(item.score)
  }));

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Export and Import Buttons */}
        <div className="flex justify-end space-x-4 mb-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
            Import JSON
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Export as PDF
              </>
            )}
          </button>
        </div>

        {/* Content for PDF export */}
        <div ref={targetRef} className="bg-white p-8" style={{ width: '8in', margin: '0 auto' }}>
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div>
              <Image 
                src="https://i.imgur.com/qfTW5j0.png" 
                alt="Winery Logo" 
                width={64}
                height={64}
                className="h-16 mb-4 md:mb-0" 
              />
            </div>
            <div className="text-center md:text-right">
              <h1 className="text-3xl font-serif text-gray-800">Sales Performance Evaluation</h1>
              <p className="text-gray-600">Evaluation Date: {evaluationData.date}</p>
              <p className="text-gray-600">Staff Member: {evaluationData.staffName}</p>
            </div>
          </div>
          
          {/* Score Overview */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8 page-break-inside-avoid">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <h2 className="text-xl font-serif text-gray-800 mb-2">Overall Performance</h2>
                <div className={`text-5xl font-bold ${getScoreColor(evaluationData.overallScore)}`}>
                  {evaluationData.overallScore}%
                </div>
                <div className="text-xl text-gray-800 mt-2">{evaluationData.performanceLevel}</div>
              </div>
              
              <div className="w-full md:w-2/3 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 5]} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                    <Tooltip 
                      formatter={(value) => [`${value}/5`, 'Score']}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #D8D1AE' }}
                    />
                    <Bar dataKey="score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Strengths and Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 page-break-inside-avoid">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-serif text-gray-800 mb-4 pb-2 border-b border-gray-200">Strengths</h2>
              <ul className="space-y-2">
                {evaluationData.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-serif text-gray-800 mb-4 pb-2 border-b border-gray-200">Areas for Improvement</h2>
              <ul className="space-y-2">
                {evaluationData.areasForImprovement.map((improvement, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-orange-500 mr-2">⚠</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8 page-break-inside-avoid">
            <h2 className="text-xl font-serif text-gray-800 mb-4 pb-2 border-b border-gray-200">Key Recommendations</h2>
            <ol className="space-y-4">
              {evaluationData.keyRecommendations.map((recommendation, index) => (
                <li key={index} className="flex">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center mr-3">
                    {index + 1}
                  </div>
                  <div className="pt-1">{recommendation}</div>
                </li>
              ))}
            </ol>
          </div>
          
          {/* Detailed Notes */}
          <div className="bg-white rounded-lg shadow-lg p-6 page-break-inside-avoid">
            <h2 className="text-xl font-serif text-gray-800 mb-4 pb-2 border-b border-gray-200">Detailed Evaluation Notes</h2>
            <div className="space-y-4">
              {evaluationData.criteriaScores.map((criterion) => (
                <div key={criterion.criterion} className="pb-4 border-b border-gray-100 last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-800">{criterion.criterion}</h3>
                    <div className={`px-2 py-1 rounded text-white text-sm ${getBarColor(criterion.score) === '#4ECDC4' ? 'bg-green-500' : (getBarColor(criterion.score) === '#FFD166' ? 'bg-yellow-500' : 'bg-red-500')}`}>
                      Score: {criterion.score}/5
                    </div>
                  </div>
                  <p className="text-gray-700">{criterion.notes}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-8 text-center text-gray-600">
            <p>Milea Estate Winery • Sales Performance Evaluation System</p>
            <p className="text-sm">Confidential - For Internal Use Only</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WineEvaluationDashboard; 